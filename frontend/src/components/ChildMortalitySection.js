import { Box, Typography, Link } from '@mui/material';
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
    <Box className="mortality-section">
      <Box className="mortality-stats">
        <Typography component="strong">Child Mortality</Typography>
        <Box className="mortality-stat-line">{mortalityData.start_year}: {mortalityData.start_rate.toFixed(1)} {mortalityData.end_year}: {mortalityData.end_rate.toFixed(1)}%</Box>
        <Box className="mortality-stat-line"><Typography component="b">Percentage points decrease: {Math.abs(mortalityData.difference).toFixed(1)}</Typography>%</Box>
      </Box>

      {mortalityData.candle_count > 0 && (
        <Candles count={mortalityData.candle_count} />
      )}

      <Box className="overlay-caption">
        <Typography component="p">
          The events of 2024 and 2025 are not reflected in the numbers above.</Typography>
          <Typography component="p"> To learn more about the kind of work that reduced the child mortality rate over the last few decades, please watch{' '}
          <Link
            href="https://www.pih.org/bending-the-arc"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bending the Arc
          </Link>
          {' '}(Partners in Health) and read this {' '}
          <Link
            href="https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01186-9/fulltext"
            target="_blank"
            rel="noopener noreferrer"
          >
          Lancet article
          </Link>
          .
        </Typography>
      </Box>

      <Box className="overlay-caption">
        <Box>
          Candle design adapted from{' '}
          <Link
            href="https://codepen.io/shorinamaria/pen/VbepBe"
            target="_blank"
            rel="noopener noreferrer"
          >
            shorinamaria
          </Link>
          {' '}and infobar adapted from{' '}
          <Link
            href="https://codepen.io/mirichan/pen/jEBmyG"
            target="_blank"
            rel="noopener noreferrer"
          >
            mirichan
          </Link>
        </Box>
        <Box className="mortality-credits-item">
          Data: Gapminder (2015); UN Inter-agency Group for Child Mortality Estimation (2025) – processed by Our World in Data.{' '}
          <Link
            href="https://ourworldindata.org/child-mortality-big-problem-in-brief"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more about child mortality
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default ChildMortalitySection;
