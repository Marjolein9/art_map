import { Box, Typography, Link } from '@mui/material';
import Candles from './Candles';

/**
 * ChildMortalitySection Component (Pure MUI Version)
 *
 * Displays child mortality statistics and candle visualization.
 * No CSS classes - only MUI sx prop styling
 */
const ChildMortalitySection = ({ mortalityData, colors }) => {
  if (!mortalityData) return null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderTop: `1px solid ${colors?.border}`,
        mt: 1.25,
        bgcolor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          mb: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Typography component="strong">Child Mortality</Typography>
        <Typography sx={{ lineHeight: 1.6 }}>
          {mortalityData.start_year}: {mortalityData.start_rate.toFixed(1)} {mortalityData.end_year}: {mortalityData.end_rate.toFixed(1)}%
        </Typography>
        <Typography sx={{ lineHeight: 1.6 }}>
          <strong>Percentage points decrease: {Math.abs(mortalityData.difference).toFixed(1)}%</strong>
        </Typography>
      </Box>

      {mortalityData.candle_count > 0 && (
        <Candles count={mortalityData.candle_count} />
      )}

      <Box
        sx={{
          bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
          p: 1.5,
          borderRadius: 0.5,
          color: colors?.textPrimary,
          mt: 2,
          lineHeight: 1.4,
          '& p': {
            m: '0 0 6px 0',
            fontSize: '14px',
            color: colors?.textPrimary,
          },
          '& div': {
            fontSize: '14px',
            color: colors?.textPrimary,
          },
        }}
      >
        <Typography component="p">
          The events of 2024 and 2025 are not reflected in the numbers above.
        </Typography>
        <Typography component="p">
          To learn more about the kind of work that reduced the child mortality rate over the last few decades, please watch{' '}
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

      <Box
        sx={{
          bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
          p: 1.5,
          borderRadius: 0.5,
          color: colors?.textPrimary,
          mt: 2,
          lineHeight: 1.4,
          '& div': {
            fontSize: '14px',
            color: colors?.textPrimary,
          },
        }}
      >
        <Typography>
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
        </Typography>
        <Typography sx={{ mt: 0.5 }}>
          Data: Gapminder (2015); UN Inter-agency Group for Child Mortality Estimation (2025) – processed by Our World in Data.{' '}
          <Link
            href="https://ourworldindata.org/child-mortality-big-problem-in-brief"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more about child mortality
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ChildMortalitySection;
