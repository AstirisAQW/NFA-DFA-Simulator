// Define the DFA (Deterministic Finite Automaton) constructor function
function DFA(useDefaults) {
    "use strict"; // Enable strict mode for better error checking
    this.transitions = {}; // Object to hold state transitions
    this.startState = useDefaults ? 'start' : null; // Set the start state, either 'start' or null based on the `useDefaults` flag
    this.acceptStates = useDefaults ? ['accept'] : []; // Initialize the accept states array, defaulting to ['accept'] or empty

    // Processor object to keep track of the current input and state
    this.processor = {
        input: null, // The input string to be processed
        inputLength: 0, // Length of the input string
        state: null, // Current state of the DFA
        inputIndex: 0, // Current index in the input string
        status: null, // Status of the DFA (e.g., Accept, Reject, Active)
    };
}

// jQuery ready function to ensure the DOM is fully loaded before executing the code
$(function() {
    "use strict"; // Enable strict mode

    // Method to get the next state based on the current state and input character
    DFA.prototype.transition = function(state, character) {
        // Retrieve the next state from the transitions object
        var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
        return !retVal ? null : retVal; // Return the next state or null if no transition exists
    };

    // Method to deserialize a JSON object into the DFA
    DFA.prototype.deserialize = function(json) {
        this.transitions = json.transitions; // Set transitions from the JSON object
        this.startState = json.startState; // Set the start state from the JSON object
        this.acceptStates = json.acceptStates; // Set accept states from the JSON object
        return this; // Return the current instance for method chaining
    };

    // Serialize the DFA's current state to a JSON object
    DFA.prototype.serialize = function() {
        return {
            transitions: this.transitions, // Include transitions in the serialized object
            startState: this.startState, // Include start state in the serialized object
            acceptStates: this.acceptStates // Include accept states in the serialized object
        };
    };

    // Method to add a transition from one state to another based on an input character
    DFA.prototype.addTransition = function(stateA, character, stateB) {
        // If the stateA does not exist in transitions, create an empty object for it
        if (!this.transitions[stateA]) {
            this.transitions[stateA] = {};
        }
        // Set the transition from stateA to stateB on the given character
        this.transitions[stateA][character] = stateB;
        return this; // Return the current instance for chaining
    };

    // Method to check if a transition exists for a given state and character
    DFA.prototype.hasTransition = function(state, character) {
        // Check if the state exists and if the character has a transition defined
        if (this.transitions[state]) {
            return !!this.transitions[state][character]; // Return true if transition exists, false otherwise
        }
        return false; // Return false if the state does not exist
    };

    // Method to remove all transitions to/from a specific state
    DFA.prototype.removeTransitions = function(state) {
        delete this.transitions[state]; // Remove transitions for the specified state
        var self = this; // Reference to the current instance
        // Iterate through all transitions to remove any that point to the specified state
        $.each(self.transitions, function(stateA, sTrans) {
            $.each(sTrans, function(char, stateB) {
                if (stateB === state) {
                    self.removeTransition(stateA, char); // Remove the transition
                }
            });
        });
        return this; // Return the current instance for chaining
    };

    // Method to remove a specific transition from stateA on the given character
    DFA.prototype.removeTransition = function(stateA, character) {
        if (this.transitions[stateA]) {
            delete this.transitions[stateA][character]; // Delete the transition
        }
        return this; // Return the current instance for chaining
    };

    // Method to set the start state of the DFA
    DFA.prototype.setStartState = function(state) {
        this.startState = state; // Assign the provided state as the start state
        return this; // Return the current instance for chaining
    };

    // Method to add an accept state to the DFA
    DFA.prototype.addAcceptState = function(state) {
        this.acceptStates.push(state); // Add the state to the accept states if it's not already included
        return this; // Return the current instance for chaining
    };
    
    // Method to remove an accept state from the DFA
    DFA.prototype.removeAcceptState = function(state) {
        var stateI = -1; // Initialize index for the state
        // Check if the state exists in the accept states array
        if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
            this.acceptStates.splice(stateI, 1); // Remove the state from the accept states
        }
        return this; // Return the current instance for chaining
    };

    // Method to check if the DFA accepts a given input string
    DFA.prototype.accepts = function(input) {
        var _status = this.stepInit(input); // Initialize the processor with the input
        while (_status === 'Active') { // Continue processing until the status is no longer 'Active'
            _status = this.step(); // Process the next step
        }
        return _status === 'Accept'; // Return true if the final status is 'Accept'
    };

    // Method to get the current status of the DFA
    DFA.prototype.status = function() {
        return {
            state: this.processor.state, // Current state of the DFA
            input: this.processor.input, // Current input string
            inputIndex: this.processor.inputIndex, // Current index in the input string
            nextChar: this.processor.input.substr(this.processor.inputIndex, 1), // Next character to process
            status: this.processor.status // Current status of the DFA
        };
    };

    // Method to initialize the processing of the input string
    DFA.prototype.stepInit = function(input) {
        this.processor.input = input; // Set the input string
        this.processor.inputLength = this.processor.input.length; // Set the length of the input string
        this.processor.inputIndex = 0; // Reset the input index to the start
        this.processor.state = this.startState; // Set the current state to the start state
        // Determine the initial status based on the input length and accept states
        this.processor.status = (this.processor.inputLength === 0 && this.acceptStates.indexOf(this.processor.state) >= 0) ? 'Accept' : 'Active';
        return this.processor.status; // Return the initial status
    };

    // Method to process the next character in the input string
    DFA.prototype.step = function() {
        // Get the next state based on the current state and the next input character
        if ((this.processor.state = this.transition(this.processor.state, this.processor.input.substr(this.processor.inputIndex++, 1))) === null) {
            this.processor.status = 'Reject'; // Set status to 'Reject' if no transition exists
        }
        // Check if the end of the input string has been reached
        if (this.processor.inputIndex === this.processor.inputLength) {
            this.processor.status = (this.acceptStates.indexOf(this.processor.state) >= 0 ? 'Accept' : 'Reject'); // Set status based on whether the current state is an accept state
        }
        return this.processor.status; // Return the current status
    };
});