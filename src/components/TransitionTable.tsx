import React from 'react';

interface TransitionTableProps {
  transitions: { from: string; symbol: string; to: string }[];
  onDeleteTransition: (fromState: string, symbol: string, toState: string) => void;
}

const TransitionTable: React.FC<TransitionTableProps> = ({ transitions, onDeleteTransition }) => {
   if (!transitions.length) {
    return <div className="table-section"><h3>Current Transitions</h3><p>No transitions defined.</p></div>;
  }
  return (
    <div className="table-section">
      <h3>Current Transitions</h3>
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>Symbol</th>
            <th>To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transitions.map((t, index) => (
            <tr key={`${t.from}-${t.symbol}-${t.to}-${index}`}>
              <td>{t.from}</td>
              <td>{t.symbol}</td>
              <td>{t.to}</td>
              <td>
                <button onClick={() => onDeleteTransition(t.from, t.symbol, t.to)} className="delete-btn">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransitionTable;