import React from 'react';

// Space theme color palette
const COLORS = {
  ocean: '#0a1128',
  land: '#1c2541',
  cardBg: 'rgba(28, 37, 65, 0.8)',
  hover: '#5bc0be',
  selected: '#6fffe9',
  correct: '#06D6A0',
  incorrect: '#ff006e',
  border: '#5bc0be',
  text: '#ffffff',
  textSecondary: '#b8c5d6',
  glow: 'rgba(91, 192, 190, 0.6)',
  buttonPrimary: '#3a506b',
  buttonSecondary: '#5bc0be'
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
      backgroundColor: COLORS.cardBg,
      borderRadius: '8px',
      boxShadow: `0 0 20px ${COLORS.glow}, 0 2px 4px rgba(0, 0, 0, 0.3)`,
      marginBottom: '20px',
      border: `2px solid ${COLORS.border}`,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{
            margin: 0,
            color: COLORS.text,
            textShadow: `0 0 10px ${COLORS.glow}`
          }}>
            {gameStatus === 'playing' ? `Find: ${targetCountry?.name || 'Loading...'}` : 'World Map Game'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '18px', color: COLORS.text }}>
          <span>Score: <strong style={{ color: COLORS.selected }}>{score}</strong></span>
          <span>Attempts: <strong style={{ color: COLORS.selected }}>{attempts}</strong></span>
          <span>Found: <strong style={{ color: COLORS.selected }}>{correctlyAnsweredCount}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={onNewGame}
          style={{
            padding: '10px 20px',
            backgroundColor: COLORS.buttonPrimary,
            color: COLORS.text,
            border: `2px solid ${COLORS.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: `0 0 10px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
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
              backgroundColor: hintUsed ? COLORS.land : COLORS.buttonSecondary,
              color: hintUsed ? COLORS.textSecondary : COLORS.ocean,
              border: `2px solid ${hintUsed ? COLORS.textSecondary : COLORS.border}`,
              borderRadius: '4px',
              cursor: hintUsed ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: hintUsed ? 0.5 : 1,
              boxShadow: hintUsed ? 'none' : `0 0 15px ${COLORS.hover}`,
              transition: 'all 0.3s ease'
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
            border: `2px solid ${COLORS.incorrect}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: `0 0 10px rgba(255, 0, 110, 0.6)`,
            transition: 'all 0.3s ease'
          }}
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default GameControls;
