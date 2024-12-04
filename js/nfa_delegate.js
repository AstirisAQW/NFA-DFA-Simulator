var nfa_delegate = (function() {
  var self = null; // Reference to the delegate object
  var nfa = null; // Instance of the NFA (Non-deterministic Finite Automaton)
  var container = null; // Container for graphical FSM representation
  var dialogDiv = null; // Dialog for setting transition labels
  var dialogActiveConnection = null; // Currently active connection being modified
  var emptyLabel = 'ϵ'; // Label for empty transitions (epsilon
  var statusConnectors = []; // Array to store connections highlighted during debugging

  // Updates the UI to reflect the current state during debugging
  var updateUIForDebug = function() {
      var status = nfa.status(); // Retrieve current status from NFA

      // Remove 'current' class from all states to reset their appearance
      $('.current').removeClass('current');

      // Reset all connection styles to default
      $.each(statusConnectors, function(index, connection) {
          connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
      });

      // Determine the character to compare (emptyLabel for empty input)
      var comparisonChar = status.nextChar === '' ? emptyLabel : status.nextChar;

      // Highlight the current states and their valid transitions
      $.each(status.states, function(index, state) {
          var curState = $('#' + state).addClass('current'); // Add 'current' class to active states
          jsPlumb.select({
              source: state
          }).each(function(connection) {
              if (connection.getLabel() === comparisonChar) {
                  statusConnectors.push(connection); // Store connection for later reset
                  connection.setPaintStyle({
                      strokeStyle: '#0a0' // Change color to indicate active connection
                  });
              }
          });
      });
      return self; // Return the current instance for chaining
  };

  // Function to save the dialog changes for a transition
  var dialogSave = function(update) {
      var inputChar = $('#nfa_dialog_readCharTxt').val(); // Get character input from dialog
      if (inputChar.length > 1) {
          inputChar = inputChar[0]; // Limit input to one character
      }

      // If updating, remove the existing transition
      if (update) {
          nfa.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
      } else if (nfa.hasTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId)) {
          // Alert if transition already exists
          alert(dialogActiveConnection.sourceId + " already has a transition to " + dialogActiveConnection.targetId + " on " + (inputChar || emptyLabel));
          return;
      }

      // Set the new label for the connection and add the transition to the NFA
      dialogActiveConnection.setLabel(inputChar || emptyLabel);
      nfa.addTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId);
      dialogDiv.dialog("close"); // Close the dialog
  };

  // Function to cancel the dialog changes
  var dialogCancel = function(update) {
      if (!update) {
          fsm.deleteConnection(dialogActiveConnection); // Delete connection if not updating
      }
      dialogDiv.dialog("close"); // Close the dialog
  };

  // Delete the current transition in the dialog
  var dialogDelete = function() {
      // Remove transition from NFA
      nfa.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
      fsm.deleteConnection(dialogActiveConnection); // Delete the visual connection
      dialogDiv.dialog("close"); // Close the dialog
  };

  // Function to create the dialog for setting transitions
  var makeDialog = function() {
      dialogDiv = $('<div></div>', {
          style: 'text-align:center;'
      });

      $('<div></div>', {
          style: 'font-size:small;'
          // Instructions for user
      }).html('Blank for Empty String: ' + emptyLabel + '<br />Read from Input').appendTo(dialogDiv);
      $('<span></span>', {
          id: 'nfa_dialog_stateA',
          'class': 'tranStart'
      }).appendTo(dialogDiv); // Start state display
      $('<input />', {
              id: 'nfa_dialog_readCharTxt',
              type: 'text',
              maxlength: 1,
              style: 'width:30px;text-align:center;'
          })
          .val('A')
          .keypress(function(event) {
              if (event.which === $.ui.keyCode.ENTER) {
                  // Trigger save on Enter key press
                  dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click();
              }
          })
          .appendTo(dialogDiv); // Add input field to dialog
      $('<span></span>', {
          id: 'nfa_dialog_stateB',
          'class': 'tranEnd'
      }).appendTo(dialogDiv); // End state display
      $('body').append(dialogDiv); // Append dialog to body

      // Initialize the dialog with options
      dialogDiv.dialog({
          dialogClass: "no-close", // Prevent closing via the close button
          autoOpen: false, // Do not open automatically
          title: 'Set Transition Character', // Dialog title
          height: 220, // Dialog height
          width: 350, // Dialog width
          modal: true, // Modal dialog
          open: function() {
              dialogDiv.find('input').focus().select(); // Focus on input when dialog opens
          }
      });
  };

  return {
      // Public methods exposed by the module
      init: function() {
          self = this; // Set self reference
          nfa = new NFA(); // Create new NFA object
          makeDialog(); // Create dialog UI
          return self; // Return the current instance for chaining
      },

      setContainer: function(newContainer) {
          container = newContainer; // Set the container for the NFA visualization
          return self; // Return the current instance for chaining
      },

      fsm: function() {
          return nfa; // Return the NFA instance
      },

      connectionAdded: function(info) { // Set the active connection
          dialogActiveConnection = info.connection;
          $('#nfa_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;'); // Display source state
          $('#nfa_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId); // Display target state

          // Configure dialog buttons for new connection
          dialogDiv.dialog('option', 'buttons', {
              Cancel: function() {
                  dialogCancel(false); // Cancel action
              },
              Save: function() {
                  dialogSave(false); // Save action
              }
          }).dialog("open"); // Open the dialog
      },

      connectionClicked: function(connection) {
          dialogActiveConnection = connection; // Set the active connection
          // Set input value to current label
          $('#nfa_dialog_readCharTxt').val(dialogActiveConnection.getLabel());
          // Configure dialog buttons for existing connection
          dialogDiv.dialog('option', 'buttons', {
              Cancel: function() {
                  dialogCancel(true); // Cancel action
              },
              Delete: dialogDelete, // Delete action
              Save: function() {
                  dialogSave(true); // Save action
              }
          }).dialog("open"); // Open the dialog
      },

      updateUI: updateUIForDebug, // Update FSM visualization during debugging

      getEmptyLabel: function() {
          return emptyLabel; // Return the epsilon label
      },

      reset: function() {
          nfa = new NFA(); // Reset NFA to a new instance
          return self; // Return the current instance for chaining
      },

      debugStart: function() {
          return self; // Return the current instance for chaining
      },

      debugStop: function() {
          $('.current').removeClass('current'); // Remove current state highlight
          return self; // Return the current instance for chaining
      }
  };
}()).init(); // Initialize the nfa_delegate module