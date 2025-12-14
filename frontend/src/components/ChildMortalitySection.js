import Candles from './Candles';

/**
 * ChildMortalitySection Component
 *
 * Displays child mortality statistics and candle visualization to represent
 * the improvement in child mortality rates over time.
 *
 * @param {Object} mortalityData - Child mortality data object
 * @param {number} mortalityData.start_year - Starting year
 * @param {number} mortalityData.start_rate - Mortality rate at start year
 * @param {number} mortalityData.end_year - Ending year
 * @param {number} mortalityData.end_rate - Mortality rate at end year
 * @param {number} mortalityData.difference - Change in mortality rate
 * @param {number} mortalityData.candle_count - Number of candles to display
 */
const ChildMortalitySection = ({ mortalityData }) => {
  if (!mortalityData) return null;

  return (
    <div className="mortality-section">
      <div className="mortality-stats">
        <strong>Child Mortality Progress</strong>
        <span>{mortalityData.start_year}: {mortalityData.start_rate.toFixed(2)}%</span>
        <span>{mortalityData.end_year}: {mortalityData.end_rate.toFixed(2)}%</span>
        <span>Change: {mortalityData.difference.toFixed(2)}%</span>
      </div>

      {mortalityData.candle_count > 0 && (
        <Candles count={mortalityData.candle_count} />
      )}

      <div className="mortality-credits">
        <div>
          Candle design by{' '}
          <a
            href="https://codepen.io/shorinamaria/pen/VbepBe"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            shorinamaria
          </a>
          {' '}and{' '}
          <a
            href="https://codepen.io/mirichan/pen/jEBmyG"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            mirichan
          </a>
        </div>
        <div style={{ marginTop: '4px' }}>
          Data: Gapminder (2015); UN Inter-agency Group for Child Mortality Estimation (2025) – processed by Our World in Data.{' '}
          <a
            href="https://ourworldindata.org/child-mortality-big-problem-in-brief"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Read more
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChildMortalitySection;
