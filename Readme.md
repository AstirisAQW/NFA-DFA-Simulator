# DFA and NFA Simulator

![image](https://github.com/user-attachments/assets/44707ed7-7cc1-44f1-930e-234c3f9068db)

## Description

This project is a **DFA (Deterministic Finite Automaton)** and **NFA (Non-deterministic Finite Automaton)** simulator. It provides an interactive environment for users to create, visualize, and simulate finite automata. The tool is designed to help users understand the behavior of DFAs and NFAs by allowing them to construct automata, define transitions, and test input strings.

---

## Features

- **Interactive Automata Creation**: Add states, transitions, and define start/accept states.
- **Visualization**: Automata are visualized using the Vis.js library, making it easy to understand the structure and flow.
- **Simulation**: Test input strings to see how the automaton processes them.
- **DFA and NFA Support**: Switch between DFA and NFA modes to explore the differences in behavior.
- **User-Friendly Interface**: Built with Bootstrap for a clean and responsive design.

---

## Setup

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge).
- Git (optional, for cloning the repository).

### Installation

1. **Clone the repository** (or download the ZIP file):

   ```bash
   git clone https://github.com/KvassAndVodka/DFA-and-NFA-Simulator.git

   ```

2. Navigate to the project directory:

   ```bash
   cd DFA-and-NFA-Simulator

   ```

3. Open the ui.html file in your web browser:
   ```bash
   open ui.html  # On macOS/Linux
   start ui.html # On Windows
   ```

Alternatively, you can drag and drop the `ui.html` file into your browser.

---

## Usage

### Creating an Automaton

1. Choose Automaton Type:

   - Use the dropdown menu to select either DFA or NFA.

2. Add States:

   - Click the "Add State" button to create new states.
   - Double-click a state to mark it as an accept state.

3. Define Transitions:

   - Select a state, then choose an input symbol and the target state to create a transition.
   - For NFAs, multiple transitions from the same state with the same input symbol are allowed.

4. Set Start State:
   - Click the "Set Start State" button and select the initial state.

Simulating Input Strings

1. Enter an input string in the provided text box.
2. Click the "Simulate" button to see how the automaton processes the string.
3. The simulation will highlight the path taken and indicate whether the string is accepted or rejected.

Visualizing the Automaton

- The automaton is automatically visualized using the Vis.js library.
- States and transitions are displayed as nodes and edges, respectively.
- Accept states are highlighted with a double circle.

## External Libraries Used

- Bootstrap: A CSS framework for styling the interface and ensuring responsiveness.
- Vis.js: A powerful library for visualizing networks and graphs, used to render the automata.

## Contributors

- Javier Raut (https://github.com/KvassAndVodka)
- Krystal Heart Bacalso (https://github.com/Sambilaycord)
- Joseph Deysolong (https://github.com/AstirisAQW)
