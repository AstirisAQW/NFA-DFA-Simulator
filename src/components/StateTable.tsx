import React from 'react';
import type { State as AutomatonState } from '../automata/automatonTypes'; // Changed

interface StateTableProps {
  states: AutomatonState[];
  onDeleteState: (stateId: string) => void;
}

const StateTable: React.FC<StateTableProps> = ({ states, onDeleteState }) => {
  if (!states.length) {
    return <div className="table-section"><h3>Current States</h3><p>No states defined.</p></div>;
  }
  return (
    <div className="table-section">
      <h3>Current States</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {states.map((state) => {
            const types = [];
            if (state.isStartState) types.push('Start');
            if (state.isAcceptState) types.push('Accept');
            return (
              <tr key={state.id}>
                <td>{state.id}</td>
                <td>{types.join(', ') || 'Normal'}</td>
                <td>
                  <button onClick={() => onDeleteState(state.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StateTable;