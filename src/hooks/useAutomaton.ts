import { useState, useCallback, useEffect, useMemo } from 'react';
import { MarkerType, type Node, type Edge } from 'reactflow'; // Changed: Position removed, MarkerType is value, Node/Edge are types
import { DFA } from '../automata/DFA';
import { NFA, EPSILON } from '../automata/NFA';
import type { Automaton, CustomNodeData, CustomEdgeData } from '../automata/automatonTypes'; // Changed: AutomatonState (alias for State) removed

export type AutomatonType = 'DFA' | 'NFA';

const initialNodes: Node<CustomNodeData>[] = [];
const initialEdges: Edge<CustomEdgeData>[] = [];

interface SimulationStep {
  currentStates: string[];
  consumedSymbol: string | null; // null for initial epsilon closure
  nextStates: string[];
  epsilonPathToNext?: { from: string, to: string }[]; // For visualizing epsilon transitions
  isFinalAccept?: boolean;
  message: string;
}

export function useAutomaton() {
  const [automatonType, setAutomatonType] = useState<AutomatonType>('NFA');
  const [automaton, setAutomaton] = useState<Automaton>(new NFA());
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<CustomEdgeData>[]>(initialEdges);
  const [message, setMessage] = useState<string>('');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationInput, setSimulationInput] = useState<string>("");
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());


  const initializeAutomaton = useCallback((type: AutomatonType) => {
    setAutomatonType(type);
    setAutomaton(type === 'DFA' ? new DFA() : new NFA());
    setNodes([]);
    setEdges([]);
    setMessage(`${type} initialized. Add states and transitions.`);
    resetSimulationVisuals();
  }, []);

  useEffect(() => {
    // Effect to re-initialize when type changes via dropdown, if not already handled by a button
    initializeAutomaton(automatonType);
  }, [automatonType, initializeAutomaton]);


  const updateGraph = useCallback(() => {
    if (!automaton) return;

    const newNodes: Node<CustomNodeData>[] = [];
    automaton.states.forEach(state => {
      const isCurrent = highlightedNodes.has(state.id);
      // isNext could also be tracked if needed for more distinct highlighting
      
      newNodes.push({
        id: state.id,
        position: { x: Math.random() * 400, y: Math.random() * 400 }, // Placeholder position
        data: { 
          label: state.id,
          isStartState: state.isStartState,
          isAcceptState: state.isAcceptState,
          isCurrent: isCurrent,
        },
        type: 'default', // Can be custom later
        style: {
          background: isCurrent ? '#ffcc00' : (state.isAcceptState ? '#90ee90' : '#ffffff'),
          borderColor: state.isStartState ? 'blue' : (state.isAcceptState ? 'green' : '#333'),
          borderWidth: state.isStartState || state.isAcceptState ? 2 : 1,
          width: 50,
          height: 50,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px'
        }
      });
    });
    setNodes(newNodes);

    const newEdges: Edge<CustomEdgeData>[] = [];
    for (const fromStateId in automaton.transitions) {
      for (const symbol in automaton.transitions[fromStateId]) {
        const targets = Array.isArray(automaton.transitions[fromStateId][symbol])
          ? automaton.transitions[fromStateId][symbol]
          : [automaton.transitions[fromStateId][symbol]];
        
        targets.forEach((toStateId: string) => {
          const edgeId = `${fromStateId}-${symbol}-${toStateId}`;
          const isCurrent = highlightedEdges.has(edgeId);
          newEdges.push({
            id: edgeId,
            source: fromStateId,
            target: toStateId,
            label: symbol,
            type: 'smoothstep', // Or 'default'
            markerEnd: { type: MarkerType.ArrowClosed }, // MarkerType used as value
            animated: isCurrent, // Animate if part of current simulation step
            style: {
                stroke: isCurrent ? 'red' : '#333',
                strokeWidth: isCurrent ? 2.5 : 1.5,
            }
          });
        });
      }
    }
    setEdges(newEdges);

  }, [automaton, highlightedNodes, highlightedEdges]);

  useEffect(() => {
    updateGraph();
  }, [automaton, updateGraph]); // updateGraph depends on highlighted states/edges


  const addAutomatonState = useCallback((id: string, isStart: boolean, isAccept: boolean) => {
    if (!id.trim()) {
      setMessage('Error: State name cannot be empty.');
      return;
    }
    // Check for existing start state if this one is set to start
    if (isStart && automaton.startState && automaton.startState !== id) {
        const oldStart = automaton.states.get(automaton.startState);
        if (oldStart) {
            // Demote old start state visually in graph if it exists
             automaton.states.set(automaton.startState, { ...oldStart, isStartState: false });
        }
    }

    const success = automaton.addState(id, isStart, isAccept);
    if (success) {
      updateGraph();
      setMessage(`State '${id}' ${automaton.states.has(id) ? 'updated' : 'added'}.`);
    } else {
      setMessage(`Error adding state '${id}'. It might already exist or name is invalid.`);
    }
  }, [automaton, updateGraph]);

  const addAutomatonTransition = useCallback((fromState: string, symbol: string, toState: string) => {
    if (!fromState.trim() || !toState.trim()) {
      setMessage('Error: From/To state names cannot be empty for transitions.');
      return;
    }
    if (automatonType === 'DFA' && symbol.trim() === '') {
        setMessage('Error: DFA transitions require a non-empty symbol.');
        return;
    }
    const sym = automatonType === 'NFA' && symbol.trim() === '' ? EPSILON : symbol.trim();

    // For NFA, toState could be multiple, comma-separated, but our form is one-to-one for now
    const success = automaton.addTransition(fromState, sym, toState);
    if (success) {
      updateGraph();
      setMessage(`Transition: ${fromState} --${sym}--> ${toState} added.`);
    } else {
      setMessage(`Error adding transition from '${fromState}' to '${toState}'. Check states exist.`);
    }
  }, [automaton, automatonType, updateGraph]);

  const removeAutomatonState = useCallback((stateId: string) => {
    automaton.removeState(stateId);
    updateGraph();
    setMessage(`State '${stateId}' and its transitions removed.`);
  }, [automaton, updateGraph]);

  const removeAutomatonTransition = useCallback((fromState: string, symbol: string, toState: string) => {
    const sym = automatonType === 'NFA' && symbol.trim() === '' ? EPSILON : symbol.trim();
    automaton.removeTransition(fromState, sym, toState);
    updateGraph();
    setMessage(`Transition ${fromState} --${sym}--> ${toState} removed.`);
  }, [automaton, automatonType, updateGraph]);


  // SIMULATION LOGIC
  const resetSimulationVisuals = () => {
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setIsSimulating(false);
    setCurrentStepIndex(0);
    setSimulationSteps([]);
  };

  const prepareSimulationSteps = useCallback((input: string) => {
    if (!automaton.startState) {
        setMessage("Simulation failed: No start state defined.");
        return [];
    }

    const steps: SimulationStep[] = [];
    let currentActualStates: Set<string> = new Set([automaton.startState]);
    
    // Initial Epsilon Closure (for NFA)
    if (automaton instanceof NFA) {
        const initialClosure = automaton.getEpsilonClosure(currentActualStates);
        const epsilonTransitionsMade = Array.from(initialClosure)
            .filter(s => !currentActualStates.has(s)) // Naive way to find "new" states via epsilon
            .map(s => ({ from: "?", to: s })); // From state is harder to track perfectly here without more complex logic

        steps.push({
            currentStates: Array.from(currentActualStates),
            consumedSymbol: null, // Represents initial epsilon closure
            nextStates: Array.from(initialClosure),
            epsilonPathToNext: epsilonTransitionsMade,
            message: `Initial: ε-closure from ${automaton.startState} -> {${Array.from(initialClosure).join(', ')}}`
        });
        currentActualStates = initialClosure;
    } else {
         steps.push({
            currentStates: [],
            consumedSymbol: null, 
            nextStates: Array.from(currentActualStates),
            message: `Initial: Start at ${automaton.startState}`
        });
    }


    for (let i = 0; i < input.length; i++) {
        const symbol = input[i];
        const statesBeforeSymbolMove = new Set(currentActualStates); // For visualization
        let movedStates: Set<string>;

        if (automaton instanceof NFA) {
            movedStates = automaton.move(currentActualStates, symbol);
        } else { // DFA
            movedStates = new Set();
            let nextDfaState: string | undefined = undefined;
            // DFA has one current state (or should after epsilon closure if it were an NFA converted to DFA)
            // For simplicity, assume DFA simulation starts with a single, well-defined current state
            const singleCurrentState = currentActualStates.values().next().value; // Should ideally be just one for DFA
            if (singleCurrentState && automaton.transitions[singleCurrentState] && automaton.transitions[singleCurrentState][symbol]) {
                 nextDfaState = automaton.transitions[singleCurrentState][symbol];
                 if (nextDfaState) movedStates.add(nextDfaState);
            }
        }
        
        if (movedStates.size === 0) {
            steps.push({
                currentStates: Array.from(statesBeforeSymbolMove),
                consumedSymbol: symbol,
                nextStates: [],
                message: `Symbol '${symbol}': No transition from {${Array.from(statesBeforeSymbolMove).join(', ')}}. Rejected.`
            });
            currentActualStates = new Set(); // Stuck
            break; 
        }
        
        let statesAfterEpsilon: Set<string> = movedStates;
        let epsilonTransitionsPostSymbol: any[] = [];
        if (automaton instanceof NFA) {
            statesAfterEpsilon = automaton.getEpsilonClosure(movedStates);
            // Similar to initial, find "new" states via epsilon
            epsilonTransitionsPostSymbol = Array.from(statesAfterEpsilon)
                .filter(s => !movedStates.has(s))
                .map(s => ({ from: "prev_moved", to: s }));
        }

        steps.push({
            currentStates: Array.from(statesBeforeSymbolMove),
            consumedSymbol: symbol,
            nextStates: Array.from(statesAfterEpsilon),
            epsilonPathToNext: epsilonTransitionsPostSymbol.length > 0 ? epsilonTransitionsPostSymbol : undefined,
            message: `Symbol '${symbol}': {${Array.from(statesBeforeSymbolMove).join(', ')}} -> {${Array.from(movedStates).join(', ')}}` +
                     ( (automaton instanceof NFA && statesAfterEpsilon.size > movedStates.size) ? ` (ε-closure) -> {${Array.from(statesAfterEpsilon).join(', ')}}` : "")
        });
        currentActualStates = statesAfterEpsilon;
    }

    // Final acceptance check
    const isAccepted = Array.from(currentActualStates).some(s => automaton.acceptStates.has(s));
    steps.push({
        currentStates: Array.from(currentActualStates),
        consumedSymbol: "", // End of input
        nextStates: Array.from(currentActualStates), // Final states
        isFinalAccept: isAccepted,
        message: `End of input. Final states: {${Array.from(currentActualStates).join(', ')}}. ${isAccepted ? 'Accepted' : 'Rejected'}.`
    });

    return steps;
  }, [automaton]);


  const startSimulation = useCallback((input: string) => {
    resetSimulationVisuals();
    setSimulationInput(input);
    const preparedSteps = prepareSimulationSteps(input);
    setSimulationSteps(preparedSteps);
    setIsSimulating(true);
    setCurrentStepIndex(0); 
    setMessage("Simulation started. Click 'Next Step' or 'Auto Play'.");
  }, [prepareSimulationSteps]);

  
  const executeSimulationStep = useCallback((step: SimulationStep) => {
    const newHighlightedNodes = new Set<string>();
    const newHighlightedEdges = new Set<string>();

    // Highlight current states from before symbol consumption for this step
    // (or initial states for the very first step)
    step.currentStates.forEach(s => newHighlightedNodes.add(s));
    
    // If symbol was consumed, highlight related edges and next states
    if (step.consumedSymbol !== null && step.consumedSymbol !== "") { // Symbol "" means end of input
        step.currentStates.forEach(fromNode => {
            const transitionsFromNode = automaton.transitions[fromNode]?.[step.consumedSymbol!];
            if (transitionsFromNode) {
                const targets = Array.isArray(transitionsFromNode) ? transitionsFromNode : [transitionsFromNode];
                targets.forEach(toNode => {
                    // Only highlight if this 'toNode' is part of the *actual* next states of this step.
                    // This distinction is important for NFA where a symbol can lead to multiple states,
                    // but the "nextStates" in the step data might be a subset after epsilon closure or if some paths die.
                    // For simplicity here, we check if `toNode` is among the `step.nextStates` before they undergo further epsilon closure.
                    // A more precise way would be to ensure `step.nextStates` (pre-epsilon) are exactly those reached by the symbol.
                    if (step.nextStates.includes(toNode) || (automaton instanceof NFA && (automaton.move(new Set(step.currentStates), step.consumedSymbol!)).has(toNode))) {
                       newHighlightedEdges.add(`${fromNode}-${step.consumedSymbol}-${toNode}`);
                       newHighlightedNodes.add(toNode); // Highlight direct target of symbol
                    }
                });
            }
        });
    }

    // Highlight states that are part of the epsilon closure path, if any
    if (step.epsilonPathToNext) {
        step.epsilonPathToNext.forEach(ep => {
            // We might not have `ep.from` if it's complex. Just highlight `ep.to`.
            newHighlightedNodes.add(ep.to);
            // If `ep.from` was available and valid, highlight edge:
            // newHighlightedEdges.add(`${ep.from}-${EPSILON}-${ep.to}`);
        });
    }
    // Ensure all states listed in step.nextStates (which are post-epsilon) are highlighted
    step.nextStates.forEach(s => newHighlightedNodes.add(s));


    setHighlightedNodes(newHighlightedNodes);
    setHighlightedEdges(newHighlightedEdges);
    setMessage(step.message);

  }, [automaton]);


  const nextSimulationStep = useCallback(() => {
    if (!isSimulating || currentStepIndex >= simulationSteps.length) {
      setMessage(currentStepIndex >= simulationSteps.length && simulationSteps.length > 0 ? simulationSteps[simulationSteps.length-1].message : "Simulation not active or finished.");
      setIsSimulating(false); // Stop if at end
      return;
    }
    
    const step = simulationSteps[currentStepIndex];
    executeSimulationStep(step);
    
    if (currentStepIndex === simulationSteps.length - 1) {
        // Last step, usually the result.
        // Keep highlighting final states but maybe clear edges.
        // For now, keep as is.
        setIsSimulating(false); // Mark simulation as ended
        setMessage(step.message); // Ensure final message is shown
    }
    setCurrentStepIndex(prev => prev + 1);

  }, [isSimulating, currentStepIndex, simulationSteps, executeSimulationStep]);


  // Auto play timer
  useEffect(() => {
    let timerId: number | undefined;
    if (isSimulating && currentStepIndex < simulationSteps.length && simulationInput !== "autoplay_off") { // Use a special value or a separate flag for auto-play
        // Check if it's actually auto-playing, e.g. by a button state not covered here
        // For now, assume nextSimulationStep is manually triggered or by an external auto-play button
    }
    return () => clearTimeout(timerId);
  }, [isSimulating, currentStepIndex, simulationSteps, nextSimulationStep, simulationInput]);


  const memoizedAutomatonStates = useMemo(() => {
    return Array.from(automaton.states.values());
  }, [automaton.states]);

  const memoizedTransitions = useMemo(() => {
    const transitionsArray: { from: string, symbol: string, to: string }[] = [];
    if (automaton && automaton.transitions) {
        for (const fromState in automaton.transitions) {
            for (const symbol in automaton.transitions[fromState]) {
                const toStates = automaton.transitions[fromState][symbol];
                if (Array.isArray(toStates)) { // NFA
                    toStates.forEach(toState => transitionsArray.push({ from: fromState, symbol, to: toState }));
                } else { // DFA
                    transitionsArray.push({ from: fromState, symbol, to: toStates });
                }
            }
        }
    }
    return transitionsArray;
  }, [automaton.transitions]);


  return {
    automatonType,
    setAutomatonType, // For dropdown to change type
    initializeAutomaton,
    nodes,
    edges,
    message,
    setMessage,
    addAutomatonState,
    addAutomatonTransition,
    removeAutomatonState,
    removeAutomatonTransition,
    automatonStates: memoizedAutomatonStates,
    automatonTransitions: memoizedTransitions,
    
    startSimulation,
    nextSimulationStep,
    resetSimulationVisuals, // To manually stop/clear simulation visuals
    isSimulating,
    currentSimulationStepMessage: simulationSteps[currentStepIndex -1]?.message || message, // currentStepIndex is advanced *after* processing
  };
}