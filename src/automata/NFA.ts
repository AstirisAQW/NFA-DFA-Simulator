import type { Automaton, State } from './automatonTypes'; // Changed

export const EPSILON = "ε"; // Epsilon symbol

export class NFA implements Automaton {
  states: Map<string, State>;
  alphabet: Set<string>;
  transitions: { [fromState: string]: { [symbol: string]: string[] } };
  startState: string | null;
  acceptStates: Set<string>;

  constructor() {
    this.states = new Map();
    this.alphabet = new Set();
    this.transitions = {}; // {state: {symbol: [nextStates]}}
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
      // NFA can technically have multiple start states by using epsilon transitions from a single conceptual start state.
      // For simplicity here, we maintain one explicit start state.
      if (this.startState && this.startState !== id) {
        const oldStartState = this.states.get(this.startState);
        if (oldStartState) oldStartState.isStartState = false;
        console.warn(`Changing start state from '${this.startState}' to '${id}'.`);
      }
      this.startState = id;
    }

    if (isAccept) {
      this.acceptStates.add(id);
    }
    return true;
  }

  addTransition(fromState: string, symbol: string, toStates: string | string[]): boolean {
    if (!this.states.has(fromState)) {
      console.error(`From state '${fromState}' does not exist.`);
      return false;
    }

    const effectiveSymbol = symbol.trim() === "" ? EPSILON : symbol;

    const targetStatesArray = Array.isArray(toStates) ? toStates : [toStates];
    for (const state of targetStatesArray) {
      if (!this.states.has(state)) {
        console.error(`To state '${state}' does not exist.`);
        return false;
      }
    }

    if (!this.transitions[fromState]) {
      this.transitions[fromState] = {};
    }
    if (!this.transitions[fromState][effectiveSymbol]) {
      this.transitions[fromState][effectiveSymbol] = [];
    }

    let added = false;
    targetStatesArray.forEach((state) => {
      if (!this.transitions[fromState][effectiveSymbol].includes(state)) {
        this.transitions[fromState][effectiveSymbol].push(state);
        added = true;
      }
    });

    if (added) {
      this.alphabet.add(effectiveSymbol);
    }
    return added;
  }

  removeState(stateId: string): void {
    if (!this.states.has(stateId)) return;

    this.states.delete(stateId);
    if (this.startState === stateId) {
      this.startState = null;
    }
    this.acceptStates.delete(stateId);

    // Remove transitions involving this state
    delete this.transitions[stateId]; // Transitions originating from this state
    for (const from in this.transitions) {
      for (const sym in this.transitions[from]) {
        this.transitions[from][sym] = this.transitions[from][sym].filter(
          (to) => to !== stateId
        );
        if (this.transitions[from][sym].length === 0) {
          delete this.transitions[from][sym];
        }
      }
      if (Object.keys(this.transitions[from]).length === 0) {
        delete this.transitions[from];
      }
    }
  }

  removeTransition(fromState: string, symbol: string, toStateToRemove: string): void {
    const effectiveSymbol = symbol.trim() === "" ? EPSILON : symbol;
    if (
      this.transitions[fromState] &&
      this.transitions[fromState][effectiveSymbol]
    ) {
      this.transitions[fromState][effectiveSymbol] = this.transitions[fromState][
        effectiveSymbol
      ].filter((s) => s !== toStateToRemove);

      if (this.transitions[fromState][effectiveSymbol].length === 0) {
        delete this.transitions[fromState][effectiveSymbol];
        if (Object.keys(this.transitions[fromState]).length === 0) {
          delete this.transitions[fromState];
        }
      }
    }
  }

  getEpsilonClosure(initialStates: Set<string> | string[]): Set<string> {
    const closure = new Set(initialStates);
    const stack = Array.from(initialStates);

    while (stack.length > 0) {
      const current = stack.pop()!;
      const epsilonTransitions = this.transitions[current]?.[EPSILON];
      if (epsilonTransitions) {
        for (const nextState of epsilonTransitions) {
          if (!closure.has(nextState)) {
            closure.add(nextState);
            stack.push(nextState);
          }
        }
      }
    }
    return closure;
  }
  
  // Gets states reachable from a set of states on a given symbol (excluding epsilon)
  move(currentStates: Set<string>, symbol: string): Set<string> {
    const nextStates = new Set<string>();
    if (symbol === EPSILON) return currentStates; // move specifically does not process epsilon

    for (const state of currentStates) {
      const symbolTransitions = this.transitions[state]?.[symbol];
      if (symbolTransitions) {
        for (const nextState of symbolTransitions) {
          nextStates.add(nextState);
        }
      }
    }
    return nextStates;
  }

  simulate(input: string): boolean {
    if (!this.startState) {
      return false;
    }

    let currentNFAStates = this.getEpsilonClosure(new Set([this.startState]));

    for (const symbol of input) {
      if (symbol === EPSILON) continue; // Epsilon in input string is usually ignored or treated as empty
      
      const movedStates = this.move(currentNFAStates, symbol);
      if (movedStates.size === 0 && symbol !== EPSILON) { // Check symbol !== EPSILON here
          return false; // Stuck
      }
      currentNFAStates = this.getEpsilonClosure(movedStates);
    }

    for (const state of currentNFAStates) {
      if (this.acceptStates.has(state)) {
        return true;
      }
    }
    return false;
  }
}