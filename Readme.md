# DFA and NFA Simulator

## Overview

This project is a web-based tool designed to help users define, visualize, and simulate Deterministic Finite Automata (DFA) and Non-deterministic Finite Automata (NFA). It provides an interactive way to understand how these automata process input strings.

## Features

*   **Automaton Selection:** Choose between DFA and NFA modes.
*   **State Definition:**
    *   Add states with unique names.
    *   Designate a single start state.
    *   Mark one or more states as accept states.
*   **Transition Definition:**
    *   Specify transitions with a `from state`, `input symbol`, and `to state(s)`.
    *   For NFAs, a single transition can lead to multiple states (comma-separated).
    *   Epsilon (ε) transitions are supported for NFAs.
*   **Interactive Graph Visualization:**
    *   Automata are visualized using [Vis.js](https://visjs.github.io/vis-network/docs/network/).
    *   States appear as nodes:
        *   Start state: Light blue background (or light seagreen if also an accept state).
        *   Accept states: Light green background, larger size, and thicker border.
        *   Other states: White background.
    *   Transitions are represented as directed edges labeled with input symbols. Epsilon transitions are styled distinctly.
*   **String Simulation with Animation:**
    *   Input a test string (including empty string) to simulate its processing by the defined automaton.
    *   The simulation is animated step-by-step on the graph:
        *   Currently active state(s) are highlighted (orange).
        *   States just exited are highlighted (yellow).
        *   Transitions taken in the current step are highlighted (red for symbol, darkorange for epsilon).
        *   Final states are highlighted (green for accepted, darkred for rejected).
    *   The final result (Accepted/Rejected) is displayed.
*   **Dynamic Lists:** View lists of currently defined states and transitions.

*(Vis.js is included via CDN in `index.html`)*

## How to Use

1.  **Open `index.html`:** Launch the `index.html` file in a modern web browser from the `NFA-DFA` directory.
2.  **Select Automaton Type:**
    *   Use the dropdown menu to choose "DFA" or "NFA". This initializes the simulator for the selected type.
3.  **Add States:**
    *   In the "Add States" section:
        *   Enter a unique name for the state in the "State Name" field.
        *   Check the "Start State" box if this is the initial state (any previous start state will be deselected).
        *   Check the "Accept State" box if this is an accepting/final state.
        *   Click "Add State". The state will appear in the "States" list and on the graph.
4.  **Add Transitions:**
    *   In the "Add Transitions" section:
        *   Enter the "From State" (name of an existing state).
        *   Enter the "Symbol" for the transition. For NFAs, leave blank or type `ε` for an epsilon transition.
        *   Enter the "To State". For NFAs, if a symbol leads to multiple states, enter their names separated by commas (e.g., `q2,q3`). For DFAs, enter a single state name.
        *   Click "Add Transition". The transition will appear in the "Transitions" list and on the graph.
5.  **Test String:**
    *   In the "Test String" section:
        *   Enter the input string you want to test in the "Input string" field.
        *   Click "Animate Simulation".
6.  **Observe Simulation:**
    *   The graph will visually animate the automaton's step-by-step processing of the string.
    *   The "Result" area below the graph will display messages about the current step and the final outcome (Accepted or Rejected).

## Technologies Used

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   [Vis.js Network](https://visjs.github.io/vis-network/docs/network/) - For dynamic graph visualization.

## Notes on NFA Simulation

*   The NFA simulation animation tracks all concurrently active states, including those reached via epsilon transitions.
*   An input string is considered "Accepted" by an NFA if, after processing the entire string, at least one of the set of active states (after all epsilon closures) is an accept state. If no active states remain or none of the final active states are accept states, the string is "Rejected".