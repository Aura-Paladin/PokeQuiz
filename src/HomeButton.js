// src/HomeButton.js
import React from 'react';

const HomeButton = ({ goHome }) => {
  return (
    <button
      onClick={goHome}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: '#fdd835',
        border: 'none',
        padding: '10px 16px',
        fontWeight: 'bold',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      ⬅ Home
    </button>
  );
};

export default HomeButton;
