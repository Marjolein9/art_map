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
        <strong>Child Mortality</strong>
        <div className="mortality-stat-line">{mortalityData.start_year}: {mortalityData.start_rate.toFixed(1)} {mortalityData.end_year}: {mortalityData.end_rate.toFixed(1)}%</div>
        <div className="mortality-stat-line"><b>Percentage points decrease: {Math.abs(mortalityData.difference).toFixed(1)}</b>%</div>
      </div>

      {mortalityData.candle_count > 0 && (
        <Candles count={mortalityData.candle_count} />
      )}

      <div className="overlay-caption">
        <p>
          The events of 2024 and 2025 are not reflected in the numbers above.</p>
          <p> To learn more about the kind of work that reduced the child mortality rate over the last few decades, please watch{' '}
          <a
            href="https://www.pih.org/bending-the-arc"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bending the Arc
          </a>
          {' '}(Partners in Health) and read this {' '}
          <a
            href="https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01186-9/fulltext"
            target="_blank"
            rel="noopener noreferrer"
          >
          Lancet article
          </a>
          .
        </p>
      </div>

      <div className="overlay-caption">
        <div>
          Candle design adapted from{' '}
          <a
            href="https://codepen.io/shorinamaria/pen/VbepBe"
            target="_blank"
            rel="noopener noreferrer"
          >
            shorinamaria
          </a>
          {' '}and infobar adapted from{' '}
          <a
            href="https://codepen.io/mirichan/pen/jEBmyG"
            target="_blank"
            rel="noopener noreferrer"
          >
            mirichan
          </a>
        </div>
        <div className="mortality-credits-item">
          Data: Gapminder (2015); UN Inter-agency Group for Child Mortality Estimation (2025) – processed by Our World in Data.{' '}
          <a
            href="https://ourworldindata.org/child-mortality-big-problem-in-brief"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more about child mortality
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChildMortalitySection;
