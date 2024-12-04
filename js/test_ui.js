// FSM Module: This encapsulates the entire FSM logic and UI interaction
var fsm = (function() {
    // Private variables and methods
    var self = null; // Reference to the FSM object
    var delegate = null; // Delegate managing FSM-specific logic (e.g., DFA, NFA)
    var container = null; // Container for the graphical FSM states
    var stateCounter = 0; // Counter for generating unique state IDs

    // Initializes jsPlumb library settings for drawing and managing connections.
    var initJsPlumb = function() {
        jsPlumb.importDefaults({
            Anchors: ["Continuous", "Continuous"], // Dynamic anchors for connections
            ConnectorZIndex: 5, // Z-index for connectors
            ConnectionsDetachable: false, // Prevent connections from being detached
            Endpoint: ["Dot", { radius: 2 }], // Circular endpoints
            HoverPaintStyle: { strokeStyle: "#d44", lineWidth: 2 }, // Style on hover
            ConnectionOverlays: [
                ["Arrow", { location: 1, length: 14, foldback: 0.8 }], // Arrow overlay
                ["Label", { location: 0.5 }] // Label overlay
            ],
            Connector: ["StateMachine", { curviness: 20 }], // Curved connectors
            PaintStyle: { strokeStyle: '#0dd', lineWidth: 2 } // Default connection style
        });

        jsPlumb.bind("click", connectionClicked);   // Bind click event on connections

    };

    // Initializes event handlers for state elements.
    var initStateEvents = function() {
        // Show delete button on hover
        container.on('mouseover', 'div.state', function() {
            $(this).find('div.delete').show(); // Show delete button
        }).on('mouseout', 'div.state', function() {
            $(this).find('div.delete').hide(); // Hide delete button
        });

        // Handle state deletion
        container.on('click', 'img.delete', function() {
            self.deleteState($(this).closest('div.state')); // Remove the state
        });

        // Handle state renaming
        container.on('click', 'span.stateName', function() {
            self.renameState($(this).closest('div.state')); // Rename the state
        });

        // Handle accept state checkbox changes
        container.on('change', 'input[type="checkbox"].isAccept', function() {
            var cBox = $(this);
            var stateId = cBox.closest('div.state').attr('id');
            if (cBox.prop('checked')) {
                delegate.fsm().addAcceptState(stateId); // Add state as accept state
            } else {
                delegate.fsm().removeAcceptState(stateId); // Remove state from accept states
            }
        });
    };


    var initFSMSelectors = function() {
        // Setup the Automaton type listeners:
        $('button.delegate').on('click', function() {
            var newDelegate = null;
            switch ($(this).html()) {
                case 'DFA': newDelegate = dfa_delegate; break; // Set delegate to DFA
                case 'NFA': newDelegate = nfa_delegate; break; // Set delegate to NFA
            }
            if (newDelegate !== delegate) {
                self.setDelegate(newDelegate); // Change the delegate
                $('button.delegate').prop('disabled', false); // Enable all delegate buttons
                $(this).prop('disabled', true); // Disable the currently selected delegate button
            }
        });

        // Default to DFA
        $('button.delegate').each(function() {
            if ($(this).html() === 'DFA') {
                $(this).click(); // Click the DFA button
            }
        });
    };

	var updateStatusUI = function(status) {
        // Update the UI with the current status of the FSM
		$('#fsmDebugInputStatus span.consumedInput').html(status.input.substring(0, status.inputIndex));
		if (status.nextChar === '') {
			$('#fsmDebugInputStatus span.currentInput').html(delegate.getEmptyLabel());
			$('#fsmDebugInputStatus span.futureInput').html(status.input.substring(status.inputIndex));
		} else if (status.nextChar === null) {
			$('#fsmDebugInputStatus span.currentInput').html('[End of Input]');
			$('#fsmDebugInputStatus span.futureInput').html('');
		} else {
			$('#fsmDebugInputStatus span.currentInput').html(status.input.substr(status.inputIndex, 1));
			$('#fsmDebugInputStatus span.futureInput').html(status.input.substring(status.inputIndex+1));
		}

	};

	var connectionClicked = function(connection) {
		delegate.connectionClicked(connection); // Handle connection click event
	};

	// Initialization on DOM ready
	var domReadyInit = function() {
		self.setGraphContainer($('#machineGraph')); // Set the graph container

		$(window).resize(function() {
            // Adjust container height on window resize
			container.height($(window).height() - $('#mainHolder h1').outerHeight() - $('#footer').outerHeight() - $('#bulkResultHeader').outerHeight() - $('#resultConsole').outerHeight() - 30 + 'px');
			jsPlumb.repaintEverything(); // Repaint jsPlumb elements
		}); 
		$(window).resize(); // Trigger resize to set initial height

        // Add state on double click in the container
		container.dblclick(function(event) {
			self.addState({top: event.offsetY, left: event.offsetX}); // Add state at clicked position
		});
		
        initJsPlumb(); // Initialize jsPlumb
        initStateEvents(); // Initialize state event handlers
        initFSMSelectors(); // Initialize FSM type selectors
	};

	var makeStartState = function() {
		var startState = makeState('start'); // Create the start state
		startState.find('div.delete').remove(); // Can't delete start state
		container.append(startState); // Add start state to the container
		makeStatePlumbing(startState); // Initialize plumbing for the start state
	};

	/**
	 * Create a new state.
	 * @param {string} stateId Internal ID of the new state.
	 * @param {string} [displayId] Displayed ID of the state, by default the internal ID.
	 */
	var makeState = function(stateId, displayId) {
		displayId = displayId || stateId; // Use stateId as displayId if not provided
		return $('<div id="' + stateId + '" class="state" data-displayid="' + displayId + '"></div>')
		.append('<input id="' + stateId + '_isAccept' + '" type="checkbox" class="isAccept" value="true" title="Accept State" />') // Checkbox for accept state
		.append('<span class="stateName">' + displayId + '</span>') // Displayed state name
		.append('<div class="plumbSource" title="Drag from here to create new transition">&nbsp;</div>') // Source for creating transitions
		.append('<div class="delete" style="display:none;"><img class="delete" src="images/empty.png" title="Delete"/></div>'); // Delete button
	};

    var makeStatePlumbing = function(state) {
        var source = state.find('.plumbSource'); // Get the source element for transitions
        jsPlumb.makeSource(source, {
            parent: state, // Set the parent for the source
            maxConnections: 10, // Maximum connections allowed
            onMaxConnections: function(info, e) {
                alert("Maximum connections (" + info.maxConnections + ") reached"); // Alert if max connections reached
            },
        });

        jsPlumb.makeTarget(state, {
            dropOptions: { hoverClass: 'dragHover' } // Set hover class for drop options
        });
        return state; // Return the state with plumbing
    };

	return {
        init: function() {
            self = this; // Set reference to the FSM object
            $(domReadyInit); // Initialize on DOM ready
            return self; // Return the FSM object
        },

        setDelegate: function(newDelegate) {
            delegate = newDelegate; // Set the new delegate
            delegate.setContainer(container); // Set the container for the delegate
            delegate.reset().fsm().setStartState('start'); // Reset and set the start state
            jsPlumb.unbind("jsPlumbConnection"); // Unbind previous connections
            jsPlumb.reset(); // Reset jsPlumb
            container.empty(); // Clear the container
            initJsPlumb(); // Reinitialize jsPlumb
            jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded); // Bind connection added event
            stateCounter = 0; // Reset state counter
            makeStartState(); // Create the start state
            return self; // Return the FSM object
        },

        setGraphContainer: function(newContainer) {
            container = newContainer; // Set the new graph container
            jsPlumb.Defaults.Container = container; // Update jsPlumb defaults
            return self; // Return the FSM object
        },

        addState: function(location) {
            while ($('#s' + stateCounter).length > 0) { ++stateCounter; } // Prevent duplicate states after loading
            var state = makeState('s' + stateCounter); // Create a new state
            if (location && location.left && location.top) {
                state.css('left', location.left + 'px') // Set left position
                    .css('top', location.top + 'px'); // Set top position
            }
            container.append(state); // Add state to the container
            jsPlumb.draggable(state, { containment: "parent" }); // Make the state draggable
            makeStatePlumbing(state); // Initialize plumbing for the state
            return self; // Return the FSM object
        },

		/**
		 * Change the displayed name of a state. The start state cannot
		 * be renamed, it’s a no-op if the given state is the start state.
		 * @param {jQuery} state The state to rename.
		 */
        renameState: function(state) {
            if (state.attr('id') !== 'start') { // Check if it's not the start state
                var newname = window.prompt('New name', state.data('displayid')); // Prompt for new name
                if (newname) {
                    state.data('displayid', newname); // Update state data
                    state.find('.stateName').text(newname); // Update displayed name
                }
            }
        },

		deleteState: function(state) {
			var stateId = state.attr('id'); // Get the ID of the state to remove
			jsPlumb.select({source:stateId}).detach(); // Remove all connections from UI
			jsPlumb.select({target:stateId}).detach(); // Remove all connections to UI
			state.remove(); // Remove state from UI
			delegate.fsm().removeTransitions(stateId); // Remove all transitions from model touching this state
			delegate.fsm().removeAcceptState(stateId); // Ensure no trace is left in accept states
			return self; // Return the FSM object
		},

		deleteConnection: function(connection) {
			jsPlumb.detach(connection); // Detach the connection
		},

        test: function(input) {
            // Ensure the input is a string for testing
            $.type(input) === 'string'
            var accepts = delegate.fsm().accepts(input); // Test if input is accepted
            // Display the result with highlighting effect
            $('#testResult')
                .html(accepts ? 'Accepted' : 'Rejected')
                .effect('highlight', { color: accepts ? '#bfb' : '#fbb' });
            return self; // Return the current FSM object for method chaining
        },

        debug: function(input) {
            if ($('#stopButton').prop('disabled')) {
                $('#testResult').html('&nbsp;'); // Clear test result
                $('#stopButton').prop('disabled', false); // Enable stop button
                $('#testButton, #testString, #resetButton').prop('disabled', true); // Disable other buttons
                $('button.delegate').prop('disabled', true); // Disable delegate buttons
                $('#fsmDebugInputStatus').show(); // Show debug input status
                delegate.debugStart(); // Start debugging
                delegate.fsm().stepInit(input); // Initialize FSM with input
            } else {
                delegate.fsm().step(); // Step through the FSM
            }
            var status = delegate.fsm().status(); // Get current status
            updateStatusUI(status); // Update UI with status
            delegate.updateUI(); // Update delegate UI
            if (status.status !== 'Active') {
                $('#testResult').html(status.status === 'Accept' ? 'Accepted' : 'Rejected').effect('highlight', {color: status.status === 'Accept' ? '#bfb' : '#fbb'}, 1000); // Show final result
                $('#debugButton').prop('disabled', true); // Disable debug button
            }
            return self; // Return the FSM object
        },

        debugStop: function() {
            $('#fsmDebugInputStatus').hide(); // Hide debug input status
            $('#stopButton').prop('disabled', true); // Disable stop button
            $('#testButton, #debugButton, #testString, #resetButton').prop('disabled', false); // Enable other buttons
            $('button.delegate').prop('disabled', false).each(function() {
                switch ($(this).html()) {
                    case 'DFA': if (delegate === dfa_delegate) {$(this).prop('disabled', true);} break; // Disable DFA button if currently selected
                    case 'NFA': if (delegate === nfa_delegate) {$(this).prop('disabled', true);} break; // Disable NFA button if currently selected
                }
            });
            delegate.debugStop (); // Stop debugging
            return self; // Return the FSM object
        },  

        reset: function() {
            self.setDelegate(delegate); // Reset the delegate
            $('#testString').val(''); // Clear the test string input
            $('#testResult').html('&nbsp;'); // Clear the test result display
            return self; // Return the FSM object
        }
	};
})().init(); // Initialize the FSM module
