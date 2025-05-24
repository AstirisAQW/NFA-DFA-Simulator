import React from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, type Connection } from 'reactflow';
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
    nodes: hookNodes, // Renamed: these are from useAutomaton
    edges: hookEdges, // Renamed: these are from useAutomaton
    message, // General messages from the hook
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
    currentSimulationStepMessage // Specific message for simulation step
  } = useAutomaton();

  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState(hookNodes);
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState(hookEdges);

  React.useEffect(() => {
    setRfNodes(hookNodes);
  }, [hookNodes, setRfNodes]);

  React.useEffect(() => {
    setRfEdges(hookEdges);
  }, [hookEdges, setRfEdges]);

  const handleConnect = (params: Connection) => {
    console.log("Connect event (manual edge creation not implemented by default):", params);
    // If you want to allow users to draw edges to create transitions:
    // const symbol = prompt("Enter symbol for new transition (or leave empty for NFA epsilon):");
    // if (params.source && params.target) { // symbol can be null if user cancels prompt
    //   addAutomatonTransition(params.source, symbol || '', params.target);
    // }
  };

  const displayMessage = currentSimulationStepMessage || message;

  return (
    <>
      <Header />
      <ResultDisplay message={displayMessage} />
      <div className="app-container">
        <Sidebar
          automatonType={automatonType}
          onSetAutomatonType={setAutomatonType}
          onAddState={addAutomatonState}
          onAddTransition={addAutomatonTransition}
          onDeleteState={removeAutomatonState}
          onDeleteTransition={removeAutomatonTransition}
          states={automatonStates} // These are AutomatonStateDefinition[]
          transitions={automatonTransitions}
          onStartSimulation={startSimulation}
          onNextSimulationStep={nextSimulationStep}
          onResetSimulationVisuals={resetSimulationVisuals}
          isSimulating={isSimulating}
          simulationMessage={displayMessage} // Pass the combined message
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

function App() {
  return (
    <ReactFlowProvider>
      <AppInternal />
    </ReactFlowProvider>
  );
}

export default App;