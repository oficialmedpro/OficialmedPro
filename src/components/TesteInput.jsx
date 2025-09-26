import React, { useState } from 'react';

const TesteInput = () => {
  const [valor, setValor] = useState('50000');

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      color: 'black',
      position: 'absolute',
      top: '100px',
      left: '100px',
      zIndex: 9999,
      border: '2px solid red'
    }}>
      <h3>TESTE ISOLADO - SEM CSS</h3>
      <p>Se este input não fizer scroll, o problema é no CSS da página</p>

      <label>Valor de teste:</label>
      <input
        type="number"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{
          border: '1px solid #000',
          padding: '10px',
          margin: '10px',
          fontSize: '16px',
          display: 'block'
        }}
      />

      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{
          border: '1px solid #000',
          padding: '10px',
          margin: '10px',
          fontSize: '16px',
          display: 'block'
        }}
      />
    </div>
  );
};

export default TesteInput;