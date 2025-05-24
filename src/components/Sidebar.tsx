import React, { useState } from 'react';
import StateForm from './StateForm';
import TransitionForm from './TransitionForm';
import StateTable from './StateTable';
import TransitionTable from './TransitionTable';
import type { State as AutomatonState } from '../automata/automatonTypes'; // Changed
import type { AutomatonType } from '../hooks/useAutomaton'; // Changed


interface SidebarProps {
  automatonType: AutomatonType;
  onSetAutomatonType: (type: AutomatonType) => void;
  onAddState: (id: string, isStart: boolean, isAccept: boolean) => void;
  onAddTransition: (fromState: string, symbol: string, toState: string) => void;
  onDeleteState: (stateId: string) => void;
  onDeleteTransition: (fromState: string, symbol: string, toState: string) => void;
  states: AutomatonState[];
  transitions: { from: string; symbol: string; to: string }[];
  onStartSimulation: (input: string) => void;
  onNextSimulationStep: () => void;
  onResetSimulationVisuals: () => void;
  isSimulating: boolean;
  simulationMessage: string;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    automatonType,
    onSetAutomatonType,
    onAddState,
    onAddTransition,
    onDeleteState,
    onDeleteTransition,
    states,
    transitions,
    onStartSimulation,
    onNextSimulationStep,
    onResetSimulationVisuals,
    isSimulating,
    simulationMessage
  } = props;

  const [simulationInput, setSimulationInput] = useState('');
  const existingStateIds = states.map(s => s.id);

  const handleSimulationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartSimulation(simulationInput);
  };

  return (
    <aside className="sidebar">
      <div className="form-section">
        <h3>Automaton Type</h3>
        <select value={automatonType} onChange={(e) => onSetAutomatonType(e.target.value as AutomatonType)}>
          <option value="NFA">NFA</option>
          <option value="DFA">DFA</option>
        </select>
      </div>

      <StateForm onAddState={onAddState} />
      <TransitionForm onAddTransition={onAddTransition} existingStates={existingStateIds} />
      
      <div className="form-section">
          <h3>Simulate Input</h3>
          <form onSubmit={handleSimulationSubmit} className="simulation-controls">
              <input
                  type="text"
                  placeholder="Enter test string"
                  value={simulationInput}
                  onChange={(e) => setSimulationInput(e.target.value)}
              />
              <button type="submit" disabled={isSimulating}>Start</button>
          </form>
          {isSimulating && (
              <button onClick={onNextSimulationStep} style={{marginTop: "10px"}}>Next Step</button>
          )}
          {(isSimulating || simulationMessage.toLowerCase().includes("accept") || simulationMessage.toLowerCase().includes("reject")) && (
               <button onClick={() => { onResetSimulationVisuals(); setSimulationInput(''); }} style={{marginTop: "10px", backgroundColor: "#555"}}>Reset Sim</button>
          )}
          <p style={{marginTop: "10px", fontSize: "0.9em"}}>{simulationMessage}</p>
      </div>

      <StateTable states={states} onDeleteState={onDeleteState} />
      <TransitionTable transitions={transitions} onDeleteTransition={onDeleteTransition} />
    </aside>
  );
};

export default Sidebar;