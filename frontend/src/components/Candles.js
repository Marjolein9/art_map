import { useEffect, useRef } from 'react';
import './Candles.css';

const Candles = ({ count = 5 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear existing candles

    // Round to nearest tenth (0.1) to allow fractional candles
    const roundedCount = Math.round(count * 10) / 10;
    const fullCandles = Math.floor(roundedCount);
    const lastCandleScale = roundedCount - fullCandles;
    const candleCount = lastCandleScale > 0 ? fullCandles + 1 : fullCandles;

    for (let i = 0; i < candleCount; i++) {
      const candle = document.createElement('div');
      candle.className = 'candle';
      candle.style.zIndex = candleCount - i;

      const isLast = i === candleCount - 1;
      let innerStyle = '';

      // Scale the last candle's flame if it's fractional
      if (isLast && lastCandleScale > 0) {
        const scaledSize = lastCandleScale * 0.5;
        innerStyle = ` style="transform: scale(${scaledSize}); transform-origin: 50% 100%;"`;
      }

      candle.innerHTML = `
        <div class="flame">
          <div class="flame-inner"${innerStyle}>
            <div class="shadows"></div>
            <div class="top"></div>
            <div class="middle"></div>
            <div class="bottom"></div>
          </div>
        </div>
      `;

      container.appendChild(candle);
    }
  }, [count]);

  return <div ref={containerRef} className="candle-container"></div>;
};

export default Candles;
