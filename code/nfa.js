class NFA {
  constructor() {
    this.states = new Set();
    this.alphabet = new Set();
    this.transitions = {}; // {state: {symbol: [nextStates]}}
    this.startState = null;
    this.acceptStates = new Set();
  }

  addState(state, isStart = false, isAccept = false) {
    if (!state) {
      throw new Error("State name cannot be empty.");
    }
    if (this.states.has(state)) {
      throw new Error(`State '${state}' already exists.`);
    }

    this.states.add(state);

    if (isStart) {
      if (this.startState) {
        console.warn(
          `Changing start state from '${this.startState}' to '${state}'.`
        );
      }
      this.startState = state;
    }

    if (isAccept) {
      this.acceptStates.add(state);
    }
    return true;
  }

  addTransition(fromState, symbol, toStates) {
    if (!this.states.has(fromState)) {
      alert(`From state '${fromState}' does not exist.`);
      return false;
    }

    // If symbol is empty, treat it as an epsilon transition
    if (!symbol.trim()) {
      symbol = "ε";
    }

    const stateArray = Array.isArray(toStates) ? toStates : [toStates];
    for (const state of stateArray) {
      if (!this.states.has(state)) {
        alert(`To state '${state}' does not exist.`);
        return false;
      }
    }

    if (!this.transitions[fromState]) {
      this.transitions[fromState] = {};
    }

    if (!this.transitions[fromState][symbol]) {
      this.transitions[fromState][symbol] = [];
    }

    // Add unique next states
    stateArray.forEach((state) => {
      if (!this.transitions[fromState][symbol].includes(state)) {
        this.transitions[fromState][symbol].push(state);
      }
    });

    this.alphabet.add(symbol);
    return true;
  }

  // Helper method to get epsilon-closure of a state
  getEpsilonClosure(states) {
    const closure = new Set(states);
    const stack = Array.from(states);

    while (stack.length > 0) {
      const state = stack.pop();
      if (this.transitions[state] && this.transitions[state]["ε"]) {
        this.transitions[state]["ε"].forEach((nextState) => {
          if (!closure.has(nextState)) {
            closure.add(nextState);
            stack.push(nextState);
          }
        });
      }
    }

    return closure;
  }

  // Update the simulate function to handle epsilon transitions
  simulate(input, currentStates = [this.startState], index = 0) {
    if (index === input.length) {
      // Final check if any of the current states is an accepting state
      const epsilonClosure = this.getEpsilonClosure(new Set(currentStates));
      return Array.from(epsilonClosure).some((state) =>
        this.acceptStates.has(state)
      );
    }

    const symbol = input[index];
    const nextStates = new Set();

    // Get epsilon closure for all current states
    const epsilonClosure = this.getEpsilonClosure(new Set(currentStates));

    // Transition for the current symbol
    epsilonClosure.forEach((state) => {
      if (this.transitions[state] && this.transitions[state][symbol]) {
        this.transitions[state][symbol].forEach((nextState) => {
          nextStates.add(nextState);
        });
      }
    });

    return this.simulate(input, Array.from(nextStates), index + 1);
  }
}
