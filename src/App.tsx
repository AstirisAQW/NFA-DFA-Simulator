import React from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, type Connection } from 'reactflow'; // Changed
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphDisplay from './components/GraphDisplay';
import ResultDisplay from './components/ResultDisplay';
import { useAutomaton }  from './hooks/useAutomaton';

function AppInternal() {
  const {
    automatonType,
    setAutomatonType,
    // initializeAutomaton, // Called internally by setAutomatonType or on mount
    nodes: automatonNodes, // Renamed to avoid conflict with useNodesState
    edges: automatonEdges, // Renamed
    message,
    // setMessage, // For ResultDisplay
    addAutomatonState,
    addAutomatonTransition,
    removeAutomatonState,
    removeAutomatonTransition,
    automatonStates,
    automatonTransitions,
    startSimulation,
    nextSimulationStep,
    resetSimulationVisuals,
    isSimulating,
    currentSimulationStepMessage
  } = useAutomaton();

  // React Flow's own state handlers for node/edge changes (e.g., dragging)
  // These are distinct from the nodes/edges derived from the automaton model
  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState(automatonNodes);
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState(automatonEdges);

  // Update React Flow nodes/edges when automaton model changes
  React.useEffect(() => {
    setRfNodes(automatonNodes);
  }, [automatonNodes, setRfNodes]);

  React.useEffect(() => {
    setRfEdges(automatonEdges);
  }, [automatonEdges, setRfEdges]);

  // Handler for connecting nodes manually in graph (optional feature)
  const handleConnect = (params: Connection) => {
    // Example: if you want to auto-create a transition when nodes are connected
    // const symbol = prompt("Enter symbol for new transition:");
    // if (symbol && params.source && params.target) {
    //   addAutomatonTransition(params.source, symbol, params.target);
    // }
    console.log("Connect event:", params);
  };

  return (
    <>
      <Header />
      <ResultDisplay message={currentSimulationStepMessage || message} />
      <div className="app-container">
        <Sidebar
          automatonType={automatonType}
          onSetAutomatonType={setAutomatonType}
          onAddState={addAutomatonState}
          onAddTransition={addAutomatonTransition}
          onDeleteState={removeAutomatonState}
          onDeleteTransition={removeAutomatonTransition}
          states={automatonStates}
          transitions={automatonTransitions}
          onStartSimulation={startSimulation}
          onNextSimulationStep={nextSimulationStep}
          onResetSimulationVisuals={resetSimulationVisuals}
          isSimulating={isSimulating}
          simulationMessage={currentSimulationStepMessage || message}
        />
        <GraphDisplay
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onRfNodesChange}
          onEdgesChange={onRfEdgesChange}
          onConnect={handleConnect}
        />
      </div>
    </>
  );
}

// Wrap with ReactFlowProvider
function App() {
  return (
    <ReactFlowProvider>
      <AppInternal />
    </ReactFlowProvider>
  );
}


export default App;