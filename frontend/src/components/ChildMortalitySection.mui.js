import {
  Card,
  CardContent,
  Box,
  Typography,
  Link
} from '@mui/material';
import Candles from './Candles';
import COLOR_SCHEME from '../styles/colorSchemes';

/**
 * ChildMortalitySection Component (MUI Version)
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
    <Card
      sx={{
        borderRadius: 1,
        backgroundColor: COLOR_SCHEME.bgPrimary,
        borderTop: `1px solid ${COLOR_SCHEME.borderPrimary}`,
        marginTop: 2
      }}
    >
      <CardContent sx={{ padding: 2 }}>
        {/* Statistics Section */}
        <Box sx={{ marginBottom: 2, textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: COLOR_SCHEME.textPrimary,
              marginBottom: 1
            }}
          >
            Child Mortality Progress since 1989
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              marginBottom: 0.5,
              lineHeight: 1.6
            }}
          >
            <strong>{mortalityData.start_year}:</strong> {mortalityData.start_rate.toFixed(1)}%
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              marginBottom: 0.5,
              lineHeight: 1.6
            }}
          >
            <strong>{mortalityData.end_year}:</strong> {mortalityData.end_rate.toFixed(1)}%
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              fontWeight: 600,
              lineHeight: 1.6
            }}
          >
            Percentage points decrease: {Math.abs(mortalityData.difference).toFixed(1)}%
          </Typography>
        </Box>

        {/* Candles Visualization */}
        {mortalityData.candle_count > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
            <Candles count={mortalityData.candle_count} />
          </Box>
        )}

        {/* First Caption */}
        <Box
          sx={{
            backgroundColor: COLOR_SCHEME.bgSecondary,
            padding: 1.5,
            borderRadius: 1,
            marginBottom: 2
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              marginBottom: 1,
              lineHeight: 1.4
            }}
          >
            The events of 2024 and 2025 are not reflected in the numbers above.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              lineHeight: 1.4
            }}
          >
            To learn more about the kind of work that reduced the child mortality rate over the last few decades, please watch{' '}
            <Link
              href="https://www.pih.org/bending-the-arc"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: COLOR_SCHEME.linkColor,
                textDecoration: 'underline',
                '&:hover': {
                  color: COLOR_SCHEME.linkColor
                }
              }}
            >
              Bending the Arc
            </Link>
            {' '}(Partners in Health) and read this{' '}
            <Link
              href="https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01186-9/fulltext"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: COLOR_SCHEME.linkColor,
                textDecoration: 'underline',
                '&:hover': {
                  color: COLOR_SCHEME.linkColor
                }
              }}
            >
              Lancet article
            </Link>
            .
          </Typography>
        </Box>

        {/* Second Caption - Credits */}
        <Box
          sx={{
            backgroundColor: COLOR_SCHEME.bgSecondary,
            padding: 1.5,
            borderRadius: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              marginBottom: 1,
              lineHeight: 1.4
            }}
          >
            Candle design adapted from{' '}
            <Link
              href="https://codepen.io/shorinamaria/pen/VbepBe"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: COLOR_SCHEME.linkColor,
                textDecoration: 'underline',
                '&:hover': {
                  color: COLOR_SCHEME.linkColor
                }
              }}
            >
              shorinamaria
            </Link>
            {' '}and infobar adapted from{' '}
            <Link
              href="https://codepen.io/mirichan/pen/jEBmyG"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: COLOR_SCHEME.linkColor,
                textDecoration: 'underline',
                '&:hover': {
                  color: COLOR_SCHEME.linkColor
                }
              }}
            >
              mirichan
            </Link>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLOR_SCHEME.textPrimary,
              lineHeight: 1.4
            }}
          >
            Data: Gapminder (2015); UN Inter-agency Group for Child Mortality Estimation (2025) – processed by Our World in Data.{' '}
            <Link
              href="https://ourworldindata.org/child-mortality-big-problem-in-brief"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: COLOR_SCHEME.linkColor,
                textDecoration: 'underline',
                '&:hover': {
                  color: COLOR_SCHEME.linkColor
                }
              }}
            >
              Read more about child mortality
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChildMortalitySection;
