export interface State { // This is AutomatonStateDefinition
  id: string;
  isStartState: boolean;
  isAcceptState: boolean;
}

export interface Transition {
  fromState: string;
  symbol: string;
  toState: string; // For DFA, this is a single state. For NFA, the class will handle an array internally but UI might show one row per target.
}

export interface Automaton {
  states: Map<string, State>;
  alphabet: Set<string>;
  // For DFA: { [fromState: string]: { [symbol: string]: string } }
  // For NFA: { [fromState: string]: { [symbol: string]: string[] } }
  transitions: any; 
  startState: string | null;
  acceptStates: Set<string>;

  addState: (id: string, isStart?: boolean, isAccept?: boolean) => boolean;
  addTransition: (fromState: string, symbol: string, toState: string | string[]) => boolean;
  removeState: (stateId: string) => void;
  removeTransition: (fromState: string, symbol: string, toState: string) => void;
  getEpsilonClosure?: (states: Set<string> | string[]) => Set<string>; // NFA specific
  simulate: (input: string) => boolean;
}

// ReactFlow specific types (can be extended)
export interface CustomNodeData {
  label: string;
  isStartState?: boolean;
  isAcceptState?: boolean;
  isCurrent?: boolean; // For simulation highlighting
  isNext?: boolean;     // For simulation highlighting
}

export interface CustomEdgeData {
  label?: string;
  isCurrent?: boolean; // For simulation highlighting
}