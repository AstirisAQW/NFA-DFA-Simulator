let automaton;

let network;

function initializeAutomaton() {
  const type = document.getElementById("automatonType").value;
  if (type === "DFA") {
    automaton = new DFA();
  } else if (type === "NFA") {
    automaton = new NFA();
  }
  document.getElementById("stateList").innerHTML = "";
  document.getElementById("transitionList").innerHTML = "";
  document.getElementById("result").textContent = `Initialized ${type}`;
  renderGraph(); // Initialize graph when automaton is initialized
}

function addState() {
  const name = document.getElementById("stateName").value.trim();
  const isStart = document.getElementById("startState").checked;
  const isAccept = document.getElementById("acceptState").checked;

  if (name === "") {
    alert("State name cannot be empty.");
    return;
  }

  automaton.addState(name, isStart, isAccept);
  updateStateList();
  document.getElementById("result").textContent = `State ${name} added.`;
  document.getElementById("stateName").value = "";
  document.getElementById("startState").checked = false;
  document.getElementById("acceptState").checked = false;

  renderGraph(); // Update graph after adding a state
}

function addTransition() {
  const fromState = document.getElementById("fromState").value.trim();
  const symbol = document.getElementById("symbol").value.trim();
  const toStatesInput = document.getElementById("toState").value.trim();

  if (fromState === "" || symbol === "" || toStatesInput === "") {
    alert("All fields must be filled.");
    return;
  }

  // Convert toStates input into an array of states (for NFA, could be multiple states)
  const toStates = toStatesInput.split(",").map((state) => state.trim());

  // For DFA, we expect a single destination state, so we just take the first element
  const transitionTarget = automaton instanceof DFA ? toStates[0] : toStates;

  // Add transition to automaton
  automaton.addTransition(fromState, symbol, transitionTarget);

  // Update transition list and display result
  updateTransitionList();
  document.getElementById(
    "result"
  ).textContent = `Transition added: ${fromState} --${symbol}--> ${toStates.join(
    ", "
  )}`;

  // Reset the input fields
  document.getElementById("fromState").value = "";
  document.getElementById("symbol").value = "";
  document.getElementById("toState").value = "";

  // Re-render the graph with the new transition
  renderGraph();
}

function updateStateList() {
  const stateList = document.getElementById("stateList");
  stateList.innerHTML = "";
  automaton.states.forEach((state) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${state} ${
      state === automaton.startState ? "(Start)" : ""
    } ${automaton.acceptStates.has(state) ? "(Accept)" : ""}`;
    stateList.appendChild(listItem);
  });
}

function updateTransitionList() {
  const transitionList = document.getElementById("transitionList");
  transitionList.innerHTML = "";
  for (const fromState in automaton.transitions) {
    for (const symbol in automaton.transitions[fromState]) {
      const toStates = automaton.transitions[fromState][symbol];
      const listItem = document.createElement("li");
      listItem.textContent = `${fromState} --${symbol}--> ${
        Array.isArray(toStates) ? toStates.join(", ") : toStates
      }`;
      transitionList.appendChild(listItem);
    }
  }
}

function renderGraph() {
  const nodes = [];
  const edges = [];

  // Add states as nodes with specific colors
  automaton.states.forEach((state) => {
    nodes.push({
      id: state,
      label: state,
      shape: "circle",
      color: {
        background:
          state === automaton.startState
            ? "blue"
            : automaton.acceptStates.has(state)
            ? "green"
            : "white",
        border: "black",
      },
      size: automaton.acceptStates.has(state) ? 30 : 20, // Larger size for accept states
      borderWidth: automaton.acceptStates.has(state) ? 4 : 2, // Thicker border for accept states
    });
  });

  // Add transitions as directed edges with black arrows
  for (const fromState in automaton.transitions) {
    for (const symbol in automaton.transitions[fromState]) {
      const toStates = automaton.transitions[fromState][symbol];

      // Handle both DFA (single toState) and NFA (multiple toStates) scenarios
      const destinationStates = Array.isArray(toStates) ? toStates : [toStates];

      destinationStates.forEach((toState) => {
        edges.push({
          from: fromState,
          to: toState,
          label: symbol, // Label the transition with the symbol
          arrows: "to", // Direct the arrow to the 'to' state
          color: { color: "black" }, // Black arrow color
          smooth: { type: "cubicBezier", roundness: 0.4 }, // Optional smoothness for edges
          font: { align: "top" }, // Optional: adjust label placement
        });
      });
    }
  }

  // Create the graph data
  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  // Options for the graph (enable physics)
  const options = {
    nodes: {
      shape: "circle",
      font: { size: 16 },
      margin: 10,
    },
    edges: {
      arrows: {
        to: {
          enabled: true,
          type: "arrow",
        },
      },
      smooth: true,
      color: { color: "black" },
      font: { size: 10 },
    },
    layout: {
      hierarchical: false,
    },
    physics: {
      enabled: true, // Keep physics enabled for smooth movement
    },
  };

  // Initialize the network only once (if not already initialized)
  if (!network) {
    const container = document.getElementById("network");
    network = new vis.Network(container, data, options);
  } else {
    // If network already exists, just update the data
    network.setData(data);
  }
}

function simulateWithAnimation(input) {
  if (!automaton) {
    alert("Automaton not initialized.");
    return;
  }

  // Reset graph to initial state
  renderGraph();

  let currentState = automaton.startState;
  let currentIndex = 0;

  // Perform step-by-step animation
  function animateStep() {
    // Check if we've processed all input
    if (currentIndex >= input.length) {
      // Final state check
      const isAccepted = automaton.acceptStates.has(currentState);
      document.getElementById("result").textContent = isAccepted
        ? "Accepted"
        : "Rejected";
      return;
    }

    const symbol = input[currentIndex];

    // Update result display with current processing
    document.getElementById(
      "result"
    ).textContent = `Processing symbol: ${symbol} (State: ${currentState})`;

    // Check if transition exists
    if (
      !automaton.transitions[currentState] ||
      !automaton.transitions[currentState][symbol]
    ) {
      document.getElementById(
        "result"
      ).textContent = `Rejected: No transition for ${symbol} from state ${currentState}`;
      return;
    }

    // Get next state (could be an array for NFA)
    const nextState = Array.isArray(automaton.transitions[currentState][symbol])
      ? automaton.transitions[currentState][symbol][0]
      : automaton.transitions[currentState][symbol];

    // Render graph with highlighted transition
    renderGraphWithHighlight(currentState, nextState, symbol);

    // Move to next state
    currentState = nextState;
    currentIndex++;

    // Schedule next step with 1 second delay for animation
    setTimeout(animateStep, 1000);
  }

  // Start animation
  animateStep();
}

function renderGraphWithHighlight(fromState, toState, symbol) {
  const nodes = [];
  const edges = [];

  // Add states as nodes with specific colors
  automaton.states.forEach((state) => {
    nodes.push({
      id: state,
      label: state,
      shape: "circle",
      color: {
        background:
          state === fromState
            ? "yellow" // Highlight current state
            : state === toState
            ? "orange" // Highlight next state
            : state === automaton.startState
            ? "blue"
            : automaton.acceptStates.has(state)
            ? "green"
            : "white",
        border: "black",
      },
      size:
        state === fromState ||
        state === toState ||
        automaton.acceptStates.has(state)
          ? 30
          : 20, // Larger size for highlighted or accept states
      borderWidth: automaton.acceptStates.has(state) ? 4 : 2, // Thicker border for accept states
    });
  });

  // Add transitions as directed edges
  for (const fromState in automaton.transitions) {
    for (const transitionSymbol in automaton.transitions[fromState]) {
      const toStates = automaton.transitions[fromState][transitionSymbol];

      // Handle both DFA (single toState) and NFA (multiple toStates) scenarios
      const destinationStates = Array.isArray(toStates) ? toStates : [toStates];

      destinationStates.forEach((toState) => {
        edges.push({
          from: fromState,
          to: toState,
          label: transitionSymbol,
          arrows: "to",
          color: {
            color:
              fromState === fromState &&
              toState === toState &&
              transitionSymbol === symbol
                ? "red" // Highlight current transition
                : "black", // Default color for transitions
          },
          width:
            fromState === fromState &&
            toState === toState &&
            transitionSymbol === symbol
              ? 3 // Make highlighted transition thicker
              : 1, // Default width for other transitions
          smooth: { type: "cubicBezier", roundness: 0.4 },
          font: { align: "top" },
        });
      });
    }
  }

  // Create the graph data
  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  // Update the existing network with new data
  network.setData(data);
}

// Modify the existing simulate button to use animation
function simulate() {
  const testString = document.getElementById("testString").value.trim();
  simulateWithAnimation(testString);
}

// Initialize automaton to DFA by default
initializeAutomaton();
