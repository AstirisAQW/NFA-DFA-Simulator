import React from 'react';

interface ResultDisplayProps {
  message: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ message }) => {
  return (
    <div className="result-display">
      {message || "Enter commands or simulate an input string."}
    </div>
  );
};

export default ResultDisplay;