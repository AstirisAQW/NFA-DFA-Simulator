import { useState, useCallback, useEffect, useMemo } from 'react';
import { MarkerType, type Node, type Edge } from 'reactflow';
import { DFA } from '../automata/DFA';
import { NFA, EPSILON } from '../automata/NFA';
import type { Automaton, State as AutomatonStateDefinition, CustomNodeData, CustomEdgeData } from '../automata/automatonTypes';

export type AutomatonType = 'DFA' | 'NFA';

const initialNodes: Node<CustomNodeData>[] = [];
const initialEdges: Edge<CustomEdgeData>[] = [];

interface SimulationStep {
  currentStates: string[];
  consumedSymbol: string | null;
  nextStates: string[];
  epsilonPathToNext?: { from: string, to: string }[];
  isFinalAccept?: boolean;
  message: string;
}

export function useAutomaton() {
  const [automatonType, setAutomatonTypeHook] = useState<AutomatonType>('NFA');
  const [automaton, setAutomaton] = useState<Automaton>(new NFA());
  
  const [nodesInternal, setNodesInternal] = useState<Node<CustomNodeData>[]>(initialNodes);
  const [edgesInternal, setEdgesInternal] = useState<Edge<CustomEdgeData>[]>(initialEdges);
  
  const [message, setMessage] = useState<string>('');
  const [revision, setRevision] = useState(0);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationInput, setSimulationInput] = useState<string>("");
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());

  const forceUpdate = useCallback(() => {
    setRevision(r => r + 1);
  }, []);

  // Effect to re-initialize automaton when automatonType changes
  useEffect(() => {
    const newAutomaton = automatonType === 'DFA' ? new DFA() : new NFA();
    setAutomaton(newAutomaton);
    setNodesInternal(initialNodes); // Reset internal nodes
    setEdgesInternal(initialEdges); // Reset internal edges
    setMessage(`${automatonType} initialized. Add states and transitions.`);
    resetSimulationVisuals();
    forceUpdate(); // Ensure graph reflects the new empty automaton
  }, [automatonType, forceUpdate]); // Removed resetSimulationVisuals from here, it's part of the process


  const updateGraph = useCallback(() => {
    if (!automaton) return;

    setNodesInternal(currentInternalNodes => {
      const automatonStateIds = new Set(Array.from(automaton.states.keys()));
      
      const nextFlowNodes = Array.from(automaton.states.values()).map(state => {
        const existingNode = currentInternalNodes.find(n => n.id === state.id);
        const isCurrent = highlightedNodes.has(state.id);
        const isNodeAccept = automaton.acceptStates.has(state.id);
        const isNodeStart = automaton.startState === state.id;

        return {
          id: state.id,
          position: existingNode ? existingNode.position : { x: Math.random() * 350 + 50, y: Math.random() * 250 + 50 },
          data: {
            label: state.id,
            isStartState: isNodeStart,
            isAcceptState: isNodeAccept,
            isCurrent: isCurrent,
          },
          type: 'default',
          style: {
            background: isCurrent ? '#ffcc00' : (isNodeAccept ? '#90ee90' : '#ffffff'),
            borderColor: isNodeStart ? 'blue' : (isNodeAccept ? 'green' : '#333'),
            borderWidth: (isNodeStart || isNodeAccept) ? 2.5 : 1.5, // Slightly thicker for emphasis
            width: isNodeAccept || isNodeStart || isCurrent ? 55: 50, // Slightly larger for emphasis
            height: isNodeAccept || isNodeStart || isCurrent ? 55: 50,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: isCurrent ? '0 0 10px #ffcc00' : 'none',
          }
        };
      });
      // Filter out nodes that are no longer in automaton.states (e.g. after a state deletion)
      return nextFlowNodes.filter(node => automatonStateIds.has(node.id));
    });

    const newEdges: Edge<CustomEdgeData>[] = [];
    if (automaton && automaton.transitions) {
        for (const fromStateId in automaton.transitions) {
            if (!automaton.states.has(fromStateId)) continue; 

            for (const symbol in automaton.transitions[fromStateId]) {
                const targets = Array.isArray(automaton.transitions[fromStateId][symbol])
                ? automaton.transitions[fromStateId][symbol]
                : [automaton.transitions[fromStateId][symbol]];
                
                targets.forEach((toStateId: string, index: number) => {
                    if (!automaton.states.has(toStateId)) return; 

                    // For multiple edges between same nodes with same symbol (NFA specific)
                    const edgeInstanceKey = (automaton instanceof NFA && targets.filter(t => t === toStateId).length > 1) ? `_i${index}` : '';
                    const edgeId = `${fromStateId}-${symbol}-${toStateId}${edgeInstanceKey}`;
                    const isCurrent = highlightedEdges.has(edgeId);
                    
                    newEdges.push({
                        id: edgeId,
                        source: fromStateId,
                        target: toStateId,
                        label: symbol === EPSILON ? 'ε' : symbol,
                        type: fromStateId === toStateId ? 'selfconnecting' : 'smoothstep', // Use selfconnecting type for loops
                        markerEnd: { type: MarkerType.ArrowClosed, color: isCurrent ? '#ff0000' : '#555' },
                        animated: isCurrent,
                        style: {
                            stroke: isCurrent ? '#ff0000' : '#a0a0a0', // Brighter default stroke for dark theme
                            strokeWidth: isCurrent ? 2.5 : 1.5,
                        },
                        data: {
                            label: symbol === EPSILON ? 'ε' : symbol, // Ensure data.label exists for custom edges if needed
                            isCurrent: isCurrent,
                        }
                    });
                });
            }
        }
    }
    setEdgesInternal(newEdges);

  }, [automaton, highlightedNodes, highlightedEdges, revision]); // revision ensures this runs when data changes

  useEffect(() => {
    updateGraph();
  }, [revision, updateGraph]); // updateGraph will run when automaton or highlighting changes due to its own deps.
                               // revision ensures it runs for other direct data changes.


  const addAutomatonState = useCallback((id: string, isStart: boolean, isAccept: boolean) => {
    if (!id.trim()) {
      setMessage('Error: State name cannot be empty.');
      return;
    }
    const alreadyExists = automaton.states.has(id);
    if (isStart && automaton.startState && automaton.startState !== id) {
        const oldStart = automaton.states.get(automaton.startState);
        if (oldStart) {
            automaton.states.set(automaton.startState, { ...oldStart, isStartState: false });
        }
    }

    const success = automaton.addState(id, isStart, isAccept);
    if (success) {
      forceUpdate();
      setMessage(`State '${id}' ${alreadyExists ? 'updated' : 'added'}.`);
    } else {
      // This case might not be hit if addState always returns true or warns internally
      setMessage(`Error processing state '${id}'. It might already exist with same props or name is invalid.`);
    }
  }, [automaton, forceUpdate]);

  const addAutomatonTransition = useCallback((fromState: string, symbol: string, toState: string) => {
    if (!fromState.trim() || !toState.trim()) {
      setMessage('Error: From/To state names cannot be empty for transitions.');
      return;
    }
    const effectiveSymbol = (automatonType === 'NFA' && symbol.trim() === '') ? EPSILON : symbol.trim();
    if (automatonType === 'DFA' && !effectiveSymbol) { // Check effectiveSymbol for DFA
        setMessage('Error: DFA transitions require a non-empty symbol.');
        return;
    }

    const success = automaton.addTransition(fromState, effectiveSymbol, toState);
    if (success) {
      forceUpdate();
      setMessage(`Transition: ${fromState} --${effectiveSymbol}--> ${toState} added.`);
    } else {
      setMessage(`Error adding transition. Ensure states exist or transition is valid for ${automatonType}.`);
    }
  }, [automaton, automatonType, forceUpdate]);

  const removeAutomatonState = useCallback((stateId: string) => {
    automaton.removeState(stateId);
    forceUpdate();
    setMessage(`State '${stateId}' and its transitions removed.`);
  }, [automaton, forceUpdate]);

  const removeAutomatonTransition = useCallback((fromState: string, symbol: string, toState: string) => {
    const effectiveSymbol = (automatonType === 'NFA' && symbol.trim() === '' && symbol !== EPSILON) ? EPSILON : symbol.trim(); // Allow explicit ε
    automaton.removeTransition(fromState, effectiveSymbol, toState);
    forceUpdate();
    setMessage(`Transition ${fromState} --${effectiveSymbol}--> ${toState} removed.`);
  }, [automaton, automatonType, forceUpdate]);

  const resetSimulationVisuals = useCallback(() => {
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setIsSimulating(false);
    setCurrentStepIndex(0);
    setSimulationSteps([]);
    // message is often set by the calling context after this
  }, []);

  const prepareSimulationSteps = useCallback((input: string) => {
    if (!automaton.startState) {
        setMessage("Simulation failed: No start state defined.");
        return [];
    }

    const steps: SimulationStep[] = [];
    let currentActualStates: Set<string> = new Set([automaton.startState]);
    
    if (automaton instanceof NFA) {
        const initialClosure = automaton.getEpsilonClosure(currentActualStates);
        steps.push({
            currentStates: Array.from(currentActualStates),
            consumedSymbol: null, 
            nextStates: Array.from(initialClosure),
            message: `Initial: ε-closure from ${automaton.startState} -> {${Array.from(initialClosure).join(', ')}}`
        });
        currentActualStates = initialClosure;
    } else { // DFA
         steps.push({
            currentStates: [], // No "current" before first step for DFA in this model
            consumedSymbol: null, 
            nextStates: Array.from(currentActualStates),
            message: `Initial: Start at ${automaton.startState}`
        });
    }

    for (let i = 0; i < input.length; i++) {
        const charSymbol = input[i];
        const statesBeforeSymbolMove = new Set(currentActualStates);
        let movedStates: Set<string>;

        if (automaton instanceof NFA) {
            movedStates = automaton.move(currentActualStates, charSymbol);
        } else { // DFA
            movedStates = new Set();
            const singleCurrentState = currentActualStates.values().next().value; 
            if (singleCurrentState && automaton.transitions[singleCurrentState]?.[charSymbol]) {
                 const nextDfaState = automaton.transitions[singleCurrentState][charSymbol];
                 if (nextDfaState) movedStates.add(nextDfaState);
            }
        }
        
        if (movedStates.size === 0) {
            steps.push({
                currentStates: Array.from(statesBeforeSymbolMove),
                consumedSymbol: charSymbol,
                nextStates: [],
                message: `Symbol '${charSymbol}': No transition from {${Array.from(statesBeforeSymbolMove).join(', ')}}. Rejected.`
            });
            currentActualStates = new Set(); 
            break; 
        }
        
        let statesAfterEpsilon: Set<string> = movedStates;
        if (automaton instanceof NFA) {
            statesAfterEpsilon = automaton.getEpsilonClosure(movedStates);
        }

        steps.push({
            currentStates: Array.from(statesBeforeSymbolMove),
            consumedSymbol: charSymbol,
            nextStates: Array.from(statesAfterEpsilon),
            message: `Symbol '${charSymbol}': {${Array.from(statesBeforeSymbolMove).join(', ')}} -> {${Array.from(movedStates).join(', ')}}` +
                     ( (automaton instanceof NFA && statesAfterEpsilon.size > movedStates.size) ? ` (ε-closure) -> {${Array.from(statesAfterEpsilon).join(', ')}}` : "")
        });
        currentActualStates = statesAfterEpsilon;
    }

    const isAccepted = Array.from(currentActualStates).some(s => automaton.acceptStates.has(s));
    steps.push({
        currentStates: Array.from(currentActualStates),
        consumedSymbol: "", 
        nextStates: Array.from(currentActualStates), 
        isFinalAccept: isAccepted,
        message: `End of input. Final states: {${Array.from(currentActualStates).join(', ')}}. ${isAccepted ? 'Accepted' : 'Rejected'}.`
    });

    return steps;
  }, [automaton]);


  const startSimulation = useCallback((input: string) => {
    resetSimulationVisuals(); // Clear previous highlights first
    setSimulationInput(input);
    const preparedSteps = prepareSimulationSteps(input);
    setSimulationSteps(preparedSteps);
    if (preparedSteps.length > 0) {
        setIsSimulating(true);
        setCurrentStepIndex(0); 
        // Execute the first step immediately to show initial state
        if (preparedSteps[0]) {
            executeSimulationStep(preparedSteps[0]); // Show initial state
            setCurrentStepIndex(1); // Ready for the next *actual* step
             setMessage(preparedSteps[0].message);
        } else {
            setMessage("Simulation prepared but no steps generated.");
        }
    } else {
        // Message already set by prepareSimulationSteps if it fails early
        setIsSimulating(false);
    }
  }, [prepareSimulationSteps, resetSimulationVisuals /* executeSimulationStep will be added by ESLint if missing */]);

  
  const executeSimulationStep = useCallback((step: SimulationStep) => {
    const newHighlightedNodes = new Set<string>();
    const newHighlightedEdges = new Set<string>();

    // Highlight nextStates which are the primary focus of the current step's outcome
    step.nextStates.forEach(s => newHighlightedNodes.add(s));
    
    if (step.consumedSymbol !== null && step.consumedSymbol !== "") {
        step.currentStates.forEach(fromNode => {
            const transitionsFromNode = automaton.transitions[fromNode]?.[step.consumedSymbol!];
            if (transitionsFromNode) {
                const targets = Array.isArray(transitionsFromNode) ? transitionsFromNode : [transitionsFromNode];
                targets.forEach((toNode, index) => {
                    if (step.nextStates.includes(toNode) || // If it's a direct result of move
                        (automaton instanceof NFA && automaton.move(new Set([fromNode]), step.consumedSymbol!).has(toNode)) // Or part of symbol move before epsilon
                    ) {
                       const edgeInstanceKey = (automaton instanceof NFA && targets.filter(t => t === toNode).length > 1) ? `_i${index}` : '';
                       newHighlightedEdges.add(`${fromNode}-${step.consumedSymbol}-${toNode}${edgeInstanceKey}`);
                    }
                });
            }
        });
    } else if (step.consumedSymbol === null && automaton instanceof NFA) { // Initial Epsilon transitions
        // Highlight epsilon paths for initial step in NFA
        const initialEpsilonTransitions = (startState: string, closure: Set<string>) => {
            const paths: {from: string, to: string, symbol: string}[] = [];
            const q: {current: string, path: {from: string, to: string, symbol: string}[]}[] = [{current: startState, path: []}];
            const visitedViaEpsilon = new Set<string>([startState]);

            while(q.length > 0) {
                const {current, path} = q.shift()!;
                const epsTransitions = automaton.transitions[current]?.[EPSILON];
                if (epsTransitions) {
                    for (const next of epsTransitions) {
                        if (closure.has(next) && !path.some(p => p.from === current && p.to === next && p.symbol === EPSILON)) {
                           const newPath = [...path, {from: current, to: next, symbol: EPSILON}];
                           paths.push(...newPath.filter(p => !paths.some(existing => existing.from === p.from && existing.to === p.to && existing.symbol === p.symbol))); // add unique path segments
                           if(!visitedViaEpsilon.has(next)){
                               visitedViaEpsilon.add(next);
                               q.push({current: next, path: newPath});
                           }
                        }
                    }
                }
            }
            return paths;
        };
        if(automaton.startState){
            const paths = initialEpsilonTransitions(automaton.startState, new Set(step.nextStates));
            paths.forEach(p => {
                 const edgeInstanceKey = (automaton instanceof NFA && automaton.transitions[p.from]?.[EPSILON]?.filter(t => t === p.to).length > 1) ? `_i${automaton.transitions[p.from]?.[EPSILON]?.indexOf(p.to)}` : ''; // approximate index
                 newHighlightedEdges.add(`${p.from}-${EPSILON}-${p.to}${edgeInstanceKey}`);
            });
        }
    }
    
    setHighlightedNodes(newHighlightedNodes);
    setHighlightedEdges(newHighlightedEdges);
    setMessage(step.message);

  }, [automaton]); // setMessage


  const nextSimulationStep = useCallback(() => {
    if (!isSimulating || currentStepIndex >= simulationSteps.length) {
      const finalMessage = currentStepIndex >= simulationSteps.length && simulationSteps.length > 0 
                           ? simulationSteps[simulationSteps.length-1].message 
                           : "Simulation not active or finished.";
      setMessage(finalMessage);
      setIsSimulating(false);
      // Optionally clear highlights on final step or keep them
      // resetSimulationVisuals(); // or just setHighlightedEdges(new Set());
      return;
    }
    
    const step = simulationSteps[currentStepIndex];
    executeSimulationStep(step);
    
    if (currentStepIndex === simulationSteps.length - 1) {
        setIsSimulating(false); 
        setMessage(step.message); 
    }
    setCurrentStepIndex(prev => prev + 1);

  }, [isSimulating, currentStepIndex, simulationSteps, executeSimulationStep, setMessage]);

  useEffect(() => { // Added executeSimulationStep to startSimulation dependencies
    if (isSimulating && simulationSteps.length > 0 && currentStepIndex === 0) {
        // This ensures the first step (initial state) is displayed when simulation starts
        // executeSimulationStep(simulationSteps[0]);
        // setCurrentStepIndex(1); // Move to the next step to be processed
    }
  }, [isSimulating, simulationSteps, currentStepIndex, executeSimulationStep]);

  const memoizedAutomatonStates = useMemo(() => {
    return Array.from(automaton.states.values());
  }, [automaton, revision]); 

  const memoizedTransitions = useMemo(() => {
    const transitionsArray: { from: string, symbol: string, to: string }[] = [];
    if (automaton && automaton.transitions) {
        for (const fromState in automaton.transitions) {
            for (const symbol in automaton.transitions[fromState]) {
                const toStates = automaton.transitions[fromState][symbol];
                if (Array.isArray(toStates)) { 
                    toStates.forEach(toState => transitionsArray.push({ from: fromState, symbol, to: toState }));
                } else { 
                    transitionsArray.push({ from: fromState, symbol, to: toStates });
                }
            }
        }
    }
    return transitionsArray;
  }, [automaton, revision]);


  return {
    automatonType,
    setAutomatonType: setAutomatonTypeHook, // Expose the hook's own setter
    nodes: nodesInternal, // Expose internal nodes
    edges: edgesInternal, // Expose internal edges
    message,
    // setMessage, // Internal use, message is part of currentSimulationStepMessage or result
    addAutomatonState,
    addAutomatonTransition,
    removeAutomatonState,
    removeAutomatonTransition,
    automatonStates: memoizedAutomatonStates,
    automatonTransitions: memoizedTransitions,
    
    startSimulation,
    nextSimulationStep,
    resetSimulationVisuals,
    isSimulating,
    currentSimulationStepMessage: (isSimulating && simulationSteps[currentStepIndex-1]) ? simulationSteps[currentStepIndex-1].message : message,
  };
}