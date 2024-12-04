var dfa_delegate = (function() {
    var self = null; // Reference to the current instance of dfa_delegate
    var dfa = null; // Instance of the DFA (Deterministic Finite Automaton)
    var container = null; // Container element for the DFA visualization
    var dialogDiv = null; // Dialog element for transition editing
    var dialogActiveConnection = null; // Currently active connection being edited
    var statusConnector = null; // Connector for visualizing the current status  

    // Function to update the UI for debugging purposes
    var updateUIForDebug = function() {
        var status = dfa.status(); // Get the current status of the DFA

        // Remove current class from previous state
        $('.current').removeClass('current');
        if (statusConnector) {
            // Reset paint style for the previous status connector
            statusConnector.setPaintStyle(jsPlumb.Defaults.PaintStyle);
        }

        // Highlight the current state and update the status connector
        var curState = $('#' + status.state).addClass('current');
        jsPlumb.select({
            source: status.state // Select connections from the current state
        }).each(function(connection) {
            if (connection.getLabel() === status.nextChar) {
                statusConnector = connection; // Set the status connector
                connection.setPaintStyle({
                    strokeStyle: '#0a0' // Change color to indicate active connection
                });
            }
        });
        return self; // Return the current instance for chaining
    };

    // Function to save the dialog changes for a transition
    var dialogSave = function(update) {
        var inputChar = $('#dfa_dialog_readCharTxt').val(); // Get character input from dialog
        if (inputChar.length > 1) {
            inputChar = inputChar[0]; // Limit input to one character
        }
        if (inputChar.length === 0) {
            // Alert for empty transition
            alert("Deterministic Finite Automaton cannot have empty-string transition.");
            return;
        }

        // If updating an existing transition
        if (update) {
            dfa.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
        } else if (dfa.hasTransition(dialogActiveConnection.sourceId, inputChar)) {
            // Alert if transition already exists
            alert(dialogActiveConnection.sourceId + " already has a transition for " + inputChar);
            return;
        }

        // Set the new label for the connection and add the transition to the DFA
        dialogActiveConnection.setLabel(inputChar);
        dfa.addTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId);
        dialogDiv.dialog("close"); // Close the dialog
    };

    // Function to cancel the dialog changes
    var dialogCancel = function(update) {
        if (!update) {
            fsm.deleteConnection(dialogActiveConnection); // Delete connection if not updating
        }
        dialogDiv.dialog("close"); // Close the dialog
    };

    // Function to delete a transition
    var dialogDelete = function() {
        // Remove transition from DFA
        dfa.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
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
        }).html('Empty transitions not allowed for DFAs<br />Read from Input').appendTo(dialogDiv);
        $('<span></span>', {
            id: 'dfa_dialog_stateA',
            'class': 'tranStart'
        }).appendTo(dialogDiv); // Start state display
        $('<input />', {
                id: 'dfa_dialog_readCharTxt',
                type: 'text',
                maxlength: 1,
                style: 'width:30px;text-align:center;'
            })
            .val('A') // Default value for input
            .keypress(function(event) {
                if (event.which === $.ui.keyCode.ENTER) {
                    // Trigger save on Enter key press
                    dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click();
                }
            })
            .appendTo(dialogDiv); // Add input field to dialog
        $('<span></span>', {
            id: 'dfa_dialog_stateB',
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
                dialogDiv.find('input').focus().select(); // Focus on input when opened
            }
        });
    };

    return {
        // Public methods exposed by the module
        init: function() {
            self = this;// Set self reference
            dfa = new DFA(); // Create new DFA object
            makeDialog(); // Create dialog
            return self; // Return the current instance for chaining
        },

        setContainer: function(newContainer) {
            container = newContainer; // Set the container for the DFA visualization
            return self; // Return the current instance for chaining
        },

        fsm: function() {
            return dfa; // Return the DFA instance
        },

        connectionAdded: function(info) { // Set the active connection
            dialogActiveConnection = info.connection;
            $('#dfa_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;'); // Display source state
            $('#dfa_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId); // Display target state

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
            $('#dfa_dialog_readCharTxt').val(dialogActiveConnection.getLabel());
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

        updateUI: updateUIForDebug,  // Method to update UI for debugging

        getEmptyLabel: function() {
            return null; // Return null for empty label
        },

        reset: function() {
            dfa = new DFA(); // Reset DFA to a new instance
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
}()).init(); // Initialize the dfa_delegate module