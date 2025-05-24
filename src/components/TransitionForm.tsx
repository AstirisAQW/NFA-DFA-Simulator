import React, { useState } from 'react';

interface TransitionFormProps {
  onAddTransition: (fromState: string, symbol: string, toState: string) => void;
  existingStates: string[]; // To populate dropdowns
}

const TransitionForm: React.FC<TransitionFormProps> = ({ onAddTransition, existingStates }) => {
  const [fromState, setFromState] = useState('');
  const [symbol, setSymbol] = useState('');
  const [toState, setToState] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromState || !toState) {
      alert('From and To states must be selected/entered.');
      return;
    }
    // Symbol can be empty for NFA (epsilon)
    onAddTransition(fromState, symbol, toState);
    // Reset form partially, keep dropdowns potentially selected if user is adding multiple from same state
    setSymbol(''); 
  };
  
  // Initialize fromState and toState if existingStates is populated and they are empty
  React.useEffect(() => {
    if (existingStates.length > 0) {
      if (!fromState) setFromState(existingStates[0]);
      if (!toState) setToState(existingStates[0]);
    }
  }, [existingStates, fromState, toState]);


  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h3>Add Transition</h3>
      <div>
        <label htmlFor="fromState">From State:</label>
        <select id="fromState" value={fromState} onChange={(e) => setFromState(e.target.value)} required>
          {existingStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="symbol">Symbol (empty for ε in NFA):</label>
        <input
          type="text"
          id="symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="toState">To State:</label>
         <select id="toState" value={toState} onChange={(e) => setToState(e.target.value)} required>
          {existingStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button type="submit">Add Transition</button>
    </form>
  );
};

export default TransitionForm;