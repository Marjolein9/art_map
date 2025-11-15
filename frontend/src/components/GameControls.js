import React from 'react';

const COLORS = {
  ocean: '#A8DADC',
  land: '#F1FAEE',
  hover: '#E9EDC9',
  selected: '#FCBF49',
  correct: '#06D6A0',
  incorrect: '#EF476F',
  border: '#457B9D',
  text: '#1D3557'
};

const GameControls = ({
  targetCountry,
  score,
  attempts,
  onNewGame,
  onStartOver,
  onShowHint,
  hintUsed,
  gameStatus,
  correctlyAnsweredCount
}) => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: COLORS.land,
      borderRadius: '8px',
      boxShadow: `0 2px 4px ${COLORS.border}40`,
      marginBottom: '20px',
      border: `2px solid ${COLORS.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: COLORS.text }}>
            {gameStatus === 'playing' ? `Find: ${targetCountry?.name || 'Loading...'}` : 'World Map Game'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '18px', color: COLORS.text }}>
          <span>Score: <strong>{score}</strong></span>
          <span>Attempts: <strong>{attempts}</strong></span>
          <span>Found: <strong>{correctlyAnsweredCount}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={onNewGame}
          style={{
            padding: '10px 20px',
            backgroundColor: COLORS.ocean,
            color: COLORS.text,
            border: `2px solid ${COLORS.border}`,
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
              backgroundColor: hintUsed ? '#ccc' : COLORS.selected,
              color: COLORS.text,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '4px',
              cursor: hintUsed ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: hintUsed ? 0.5 : 1
            }}
          >
            {hintUsed ? 'Hint Used' : 'Show Hint'}
          </button>
        )}

        <button
          onClick={onStartOver}
          style={{
            padding: '10px 20px',
            backgroundColor: COLORS.incorrect,
            color: 'white',
            border: `2px solid ${COLORS.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default GameControls;
