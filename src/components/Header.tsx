import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{ padding: '15px', backgroundColor: '#333', color: 'white', textAlign: 'center', borderBottom: '1px solid #444' }}>
      <h1>NFA/DFA Simulator</h1>
    </header>
  );
};

export default Header;