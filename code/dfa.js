class DFA {
  constructor() {
    this.states = new Set();
    this.alphabet = new Set();
    this.transitions = {}; // {state: {symbol: nextState}}
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

  addTransition(fromState, symbol, toState) {
    // Ensure both fromState and toState exist
    if (!this.states.has(fromState)) {
      alert(`From state '${fromState}' does not exist.`);
      return false;
    }
    if (!this.states.has(toState)) {
      alert(`To state '${toState}' does not exist.`);
      return false;
    }

    if (!this.transitions[fromState]) {
      this.transitions[fromState] = {};
    }

    // Overwrite existing transition for this symbol
    this.transitions[fromState][symbol] = toState;
    this.alphabet.add(symbol);
    return true;
  }

  simulate(input) {
    let currentState = this.startState;
    for (const symbol of input) {
      if (
        !this.transitions[currentState] ||
        !this.transitions[currentState][symbol]
      ) {
        return false;
      }
      currentState = this.transitions[currentState][symbol];
    }
    return this.acceptStates.has(currentState);
  }
}
