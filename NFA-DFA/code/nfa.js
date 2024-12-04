class NFA {
  constructor() {
    this.states = new Set();
    this.alphabet = new Set();
    this.transitions = {}; // {state: {symbol: [nextStates]}}
    this.startState = null;
    this.acceptStates = new Set();
  }

  addState(state, isStart = false, isAccept = false) {
    // Ensure state names are unique
    if (this.states.has(state)) {
      alert(`State '${state}' already exists.`);
      return false;
    }

    this.states.add(state);
    if (isStart) {
      // Remove previous start state if exists
      this.startState = state;
    }
    if (isAccept) {
      this.acceptStates.add(state);
    }
    return true;
  }

  addTransition(fromState, symbol, toStates) {
    // Ensure fromState exists
    if (!this.states.has(fromState)) {
      alert(`From state '${fromState}' does not exist.`);
      return false;
    }

    // Ensure all toStates exist
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

  simulate(input, currentStates = [this.startState], index = 0) {
    if (index === input.length) {
      return currentStates.some((state) => this.acceptStates.has(state));
    }
    const symbol = input[index];
    const nextStates = new Set();
    for (const state of currentStates) {
      if (this.transitions[state] && this.transitions[state][symbol]) {
        nextStates.add(...this.transitions[state][symbol]);
      }
    }
    return this.simulate(input, Array.from(nextStates), index + 1);
  }
}
