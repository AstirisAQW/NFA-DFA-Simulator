// Define the NFA (Non-Deterministic Finite Automaton) constructor function
function NFA(useDefaults) {
  "use strict";  // Enable strict mode for better error checking
  this.transitions = {};  // Object to hold state transitions
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];

  // Processor object to keep track of the current input and state
  this.processor = {
      input: null, // The input string to be processed
      inputIndex: 0, // Current index in the input string
      inputLength: 0, // Length of the input string
      states: [], // Array to hold current states of the NFA
      status: null, // Status of the NFA (e.g., Accept, Reject, Active)
      nextStep: null // Indicates the next step to be taken in processing
  };
}

// jQuery ready function to ensure the DOM is fully loaded before executing the code
$(function() {
  "use strict"; // Enable strict mode

  // Method to get the next state based on the current state and input character
  NFA.prototype.transition = function(state, character) {
      // Retrieve the next state from the transitions object
      var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
      return !retVal ? null : retVal;  // Return the next state or null if no transition exists
  };

  // Method to deserialize a JSON object into the NFA
  NFA.prototype.deserialize = function(json) {
      this.transitions = json.transitions; // Set transitions from the JSON object
      this.startState = json.startState; // Set the start state from the JSON object
      this.acceptStates = json.acceptStates; // Set accept states from the JSON object
      return this; // Return the current instance for method chaining
  };

  // Serialize the NFA's current state to a JSON object
  NFA.prototype.serialize = function() {
      return {
        transitions: this.transitions, // Include transitions in the serialized object
        startState: this.startState, // Include start state in the serialized object
        acceptStates: this.acceptStates // Include accept states in the serialized object
      };
  };

  // Method to add a transition from one state to another based on an input character
  NFA.prototype.addTransition = function(stateA, character, stateB) {
      // If the stateA does not exist in transitions, create an empty object for it
      if (!this.transitions[stateA]) {
          this.transitions[stateA] = {};
      }
      // If there is no transition for the character, create an empty array for it
      if (!this.transitions[stateA][character]) {
          this.transitions[stateA][character] = [];
      }
      // Add the new stateB to the list of states for the transition
      this.transitions[stateA][character].push(stateB);
      return this; // Return the current instance for chaining
  };

  // Method to check if a transition exists for a given state and character
  NFA.prototype.hasTransition = function(stateA, character, stateB) {
      // Check if the state exists and if the character has a transition defined
      if (this.transitions[stateA] && this.transitions[stateA][character]) {
          return this.transitions[stateA][character].indexOf(stateB) >= 0; // Return true if stateB is in the transition list
      }
      return false; // Return false if the state does not exist
  };

  // Method to remove all transitions associated with a given state
  NFA.prototype.removeTransitions = function(state) {
      delete this.transitions[state]; // Remove the state from transitions
      var self = this;
      // Iterate through all transitions to remove any that point to the state being removed
      $.each(self.transitions, function(stateA, sTrans) {
          $.each(sTrans, function(char, states) {
              if (states.indexOf(state) >= 0) {
                  self.removeTransition(stateA, char, state);
              }
          });
      });
      return this;
  };

  NFA.prototype.removeTransition = function(stateA, character, stateB) {
      if (this.hasTransition(stateA, character, stateB)) {
          this.transitions[stateA][character].splice(this.transitions[stateA][character].indexOf(stateB), 1);
      }
      return this;
  };

  // Method to set the start state of the NFA
  NFA.prototype.setStartState = function(state) {
      this.startState = state; // Assign the provided state as the start state
      return this; // Return the current instance for chaining
  };

  // Method to add an accept state to the NFA
  NFA.prototype.addAcceptState = function(state) {
      this.acceptStates.push(state); // Add the state to the accept states if it's not already included
      return this; // Return the current instance for chaining
  };

  // Method to remove an accept state from the NFA
  NFA.prototype.removeAcceptState = function(state) {
      var stateI = -1; // Initialize index for the state
      // Check if the state exists in the accept states array
      if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
          this.acceptStates.splice(stateI, 1); // Remove the state from the accept states
      }
      return this; // Return the current instance for chaining
  };

  // Method to check if the NFA accepts a given input string
  NFA.prototype.accepts = function(input) {
      var _status = this.stepInit(input); // Initialize the processor with the input
      while (_status === 'Active') { // Continue processing until the status is no longer 'Active'
          _status = this.step(); // Process the next step
      }
      return _status === 'Accept'; // Return true if the final status is 'Accept'
  };

  // Method to get the current status of the NFA
  NFA.prototype.status = function() {
      var nextChar = null;
      if (this.processor.status === 'Active') {
          if (this.processor.nextStep === 'input' && this.processor.input.length > this.processor.inputIndex) {
              nextChar = this.processor.input.substr(this.processor.inputIndex, 1);
          } else if (this.processor.nextStep === 'epsilons') {
              nextChar = '';
          }
      }
      return {
          states: this.processor.states, // Current state of the NFA
          input: this.processor.input, // Current input string
          inputIndex: this.processor.inputIndex, // Current index in the input string
          nextChar: nextChar, 
          status: this.processor.status // Current status of the NFA
      };
  };
  
  // Method to initialize the processing of the input string
  NFA.prototype.stepInit = function(input) {
      this.processor.input = input; // Set the input string
      this.processor.inputLength = this.processor.input.length; // Set the length of the input string
      this.processor.inputIndex = 0; // Reset the input index to the start
      this.processor.states = [this.startState];
      this.processor.status = 'Active';
      this.processor.nextStep = 'epsilons';
      return this.updateStatus();
  };
  NFA.prototype.step = function() {
      switch (this.processor.nextStep) {
          case 'epsilons':
              this.followEpsilonTransitions();
              this.processor.nextStep = 'input';
              break;
          case 'input':
              var newStates = [];
              var char = this.processor.input.substr(this.processor.inputIndex, 1);
              var state = null;
              while (state = this.processor.states.shift()) {
                  var tranStates = this.transition(state, char);
                  if (tranStates) {
                      $.each(tranStates, function(index, tranState) {
                          if (newStates.indexOf(tranState) === -1) {
                              newStates.push(tranState);
                          }
                      });
                  }
              };
              ++this.processor.inputIndex;
              this.processor.states = newStates;
              this.processor.nextStep = 'epsilons';
              break;
      }
      return this.updateStatus();
  };
  NFA.prototype.followEpsilonTransitions = function() {
      var self = this;
      var changed = true;
      while (changed) {
          changed = false;
          $.each(self.processor.states, function(index, state) {
              var newStates = self.transition(state, '');
              if (newStates) {
                  $.each(newStates, function(sIndex, newState) {
                      var match = false;
                      $.each(self.processor.states, function(oIndex, checkState) {
                          if (checkState === newState) {
                              match = true;
                              return false; // break the iteration
                          }
                      });
                      if (!match) {
                          changed = true;
                          self.processor.states.push(newState);
                      }
                  });
              }
          });
      }
  };

  NFA.prototype.updateStatus = function() {
      var self = this;
      if (self.processor.states.length === 0) {
          self.processor.status = 'Reject';
      }
      if (self.processor.inputIndex === self.processor.inputLength) {
          $.each(self.processor.states, function(index, state) {
              if (self.acceptStates.indexOf(state) >= 0) {
                  self.processor.status = 'Accept';
                  return false; // break the iteration
              }
          });
      }
      return self.processor.status;
  }
});