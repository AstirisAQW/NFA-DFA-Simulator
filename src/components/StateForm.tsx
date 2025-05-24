import React, { useState } from 'react';

interface StateFormProps {
  onAddState: (id: string, isStart: boolean, isAccept: boolean) => void;
}

const StateForm: React.FC<StateFormProps> = ({ onAddState }) => {
  const [stateName, setStateName] = useState('');
  const [isStartState, setIsStartState] = useState(false);
  const [isAcceptState, setIsAcceptState] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateName.trim()) {
      alert('State name cannot be empty.');
      return;
    }
    onAddState(stateName.trim(), isStartState, isAcceptState);
    setStateName('');
    setIsStartState(false);
    setIsAcceptState(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h3>Add State</h3>
      <div>
        <label htmlFor="stateName">State Name:</label>
        <input
          type="text"
          id="stateName"
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={isStartState}
            onChange={(e) => setIsStartState(e.target.checked)}
          />
          Start State
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={isAcceptState}
            onChange={(e) => setIsAcceptState(e.target.checked)}
          />
          Accept State
        </label>
      </div>
      <button type="submit">Add State</button>
    </form>
  );
};

export default StateForm;