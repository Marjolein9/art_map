import React from 'react';

const GameControls = ({
  targetCountry,
  score,
  attempts,
  onNewGame,
  onShowHint,
  hintUsed,
  gameStatus
}) => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>
            {gameStatus === 'playing' ? `Find: ${targetCountry?.name || 'Loading...'}` : 'World Map Game'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '18px' }}>
          <span>Score: <strong>{score}</strong></span>
          <span>Attempts: <strong>{attempts}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onNewGame}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          New Country
        </button>

        {gameStatus === 'playing' && (
          <button
            onClick={onShowHint}
            disabled={hintUsed}
            style={{
              padding: '10px 20px',
              backgroundColor: hintUsed ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: hintUsed ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {hintUsed ? 'Hint Used' : 'Show Hint'}
          </button>
        )}
      </div>

      {gameStatus === 'correct' && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Correct! Well done!
        </div>
      )}

      {gameStatus === 'incorrect' && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Wrong country! Try again!
        </div>
      )}
    </div>
  );
};

export default GameControls;
