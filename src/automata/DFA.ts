import type { Automaton, State } from './automatonTypes'; // Changed

export class DFA implements Automaton {
  states: Map<string, State>;
  alphabet: Set<string>;
  transitions: { [fromState: string]: { [symbol: string]: string } };
  startState: string | null;
  acceptStates: Set<string>;

  constructor() {
    this.states = new Map();
    this.alphabet = new Set();
    this.transitions = {};
    this.startState = null;
    this.acceptStates = new Set();
  }

  addState(id: string, isStart: boolean = false, isAccept: boolean = false): boolean {
    if (!id) {
      console.error("State ID cannot be empty.");
      return false;
    }
    if (this.states.has(id)) {
      console.warn(`State '${id}' already exists.`);
      // Allow updating existing state properties (e.g. start/accept)
      const existingState = this.states.get(id)!;
      if (isStart) {
        if (this.startState && this.startState !== id) {
            const oldStartState = this.states.get(this.startState);
            if (oldStartState) oldStartState.isStartState = false;
        }
        this.startState = id;
        existingState.isStartState = true;
      }
      if (isAccept) {
        this.acceptStates.add(id);
        existingState.isAcceptState = true;
      } else {
        this.acceptStates.delete(id);
        existingState.isAcceptState = false;
      }
      return true;
    }

    this.states.set(id, { id, isStartState: isStart, isAcceptState: isAccept });

    if (isStart) {
      if (this.startState && this.startState !== id) {
        const oldStartState = this.states.get(this.startState);
        if (oldStartState) oldStartState.isStartState = false;
      }
      this.startState = id;
    }
    if (isAccept) {
      this.acceptStates.add(id);
    }
    return true;
  }

  addTransition(fromState: string, symbol: string, toState: string | string[]): boolean {
    if (Array.isArray(toState)) {
        console.error("DFA transition must lead to a single state.");
        return false;
    }
    if (!this.states.has(fromState)) {
      console.error(`From state '${fromState}' does not exist.`);
      return false;
    }
    if (!this.states.has(toState as string)) {
      console.error(`To state '${toState}' does not exist.`);
      return false;
    }
    if (!symbol) {
      console.error("Symbol cannot be empty for DFA transitions.");
      return false;
    }

    if (!this.transitions[fromState]) {
      this.transitions[fromState] = {};
    }

    if (this.transitions[fromState][symbol]) {
      console.warn(`DFA transition from '${fromState}' on symbol '${symbol}' already exists. Overwriting.`);
    }

    this.transitions[fromState][symbol] = toState as string;
    this.alphabet.add(symbol);
    return true;
  }

  removeState(stateId: string): void {
    if (!this.states.has(stateId)) return;

    this.states.delete(stateId);
    if (this.startState === stateId) {
      this.startState = null;
    }
    this.acceptStates.delete(stateId);

    // Remove transitions involving this state
    delete this.transitions[stateId];
    for (const from in this.transitions) {
      for (const sym in this.transitions[from]) {
        if (this.transitions[from][sym] === stateId) {
          delete this.transitions[from][sym];
        }
      }
      if (Object.keys(this.transitions[from]).length === 0) {
        delete this.transitions[from];
      }
    }
  }

  removeTransition(fromState: string, symbol: string, toState: string): void {
    // In DFA, toState is not strictly needed to identify the transition to remove,
    // as there's at most one transition for a (fromState, symbol) pair.
    // However, we check it for consistency with a potential generic interface.
    if (
      this.transitions[fromState] &&
      this.transitions[fromState][symbol] &&
      this.transitions[fromState][symbol] === toState
    ) {
      delete this.transitions[fromState][symbol];
      if (Object.keys(this.transitions[fromState]).length === 0) {
        delete this.transitions[fromState];
      }
    }
  }

  simulate(input: string): boolean {
    if (!this.startState) {
      return false; // No start state
    }
    let currentState = this.startState;
    for (const symbol of input) {
      if (
        !this.transitions[currentState] ||
        !this.transitions[currentState][symbol]
      ) {
        return false; // No transition for this symbol
      }
      currentState = this.transitions[currentState][symbol];
    }
    return this.acceptStates.has(currentState);
  }
}