import { Box, Typography, Card, Link } from '@mui/material';

/**
 * ExternalLinks Component (Pure MUI Version)
 *
 * Displays external resource links for a country.
 * No CSS classes - only MUI sx prop styling
 */
const ExternalLinks = ({ externalLinks, countryName, colors }) => {
  // Return null if no links are available
  if (!externalLinks ||
      (!externalLinks.gapminder_url?.trim() &&
       !externalLinks.tasteatlas_url?.trim() &&
       !externalLinks.extra_links?.trim())) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2.5,
        borderTop: `2px solid ${colors?.border}`,
        mt: 2.5,
        bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
        borderRadius: 1,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          m: '0 0 15px 0',
          fontWeight: 600,
          textAlign: 'center',
          fontSize: '14px',
          fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
          color: colors?.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        External Resources
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {externalLinks.gapminder_url?.trim() && (
          <Card
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              transition: 'all 0.25s ease-in-out',
              cursor: 'pointer',
              opacity: 0.8,
              bgcolor: 'rgba(0, 0, 0, 0.35)',
              border: `2px solid ${colors?.border}`,
              p: '12px 16px',
              color: colors?.textPrimary,
              fontWeight: 500,
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 0 15px ${colors?.glow}`,
                opacity: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderColor: colors?.glow,
                color: 'rgba(229, 229, 229, 0.9)',
              },
            }}
          >
            <Link
              href={externalLinks.gapminder_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none', color: 'inherit' }}
            >
              Gapminder's Dollar Street
            </Link>
            : How people live in {countryName || 'this country'}
          </Card>
        )}
        {externalLinks.tasteatlas_url?.trim() && (
          <Card
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              transition: 'all 0.25s ease-in-out',
              cursor: 'pointer',
              opacity: 0.8,
              bgcolor: 'rgba(0, 0, 0, 0.35)',
              border: `2px solid ${colors?.border}`,
              p: '12px 16px',
              color: colors?.textPrimary,
              fontWeight: 500,
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 0 15px ${colors?.glow}`,
                opacity: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderColor: colors?.glow,
                color: 'rgba(229, 229, 229, 0.9)',
              },
            }}
          >
            <Link
              href={externalLinks.tasteatlas_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none', color: 'inherit' }}
            >
              TasteAtlas
            </Link>
            : Food from {countryName || 'this country'}
          </Card>
        )}
        {externalLinks.extra_links?.trim() && (
          <Card
            component={Link}
            href={externalLinks.extra_links}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              transition: 'all 0.25s ease-in-out',
              cursor: 'pointer',
              opacity: 0.8,
              bgcolor: 'rgba(0, 0, 0, 0.35)',
              border: `2px solid ${colors?.border}`,
              p: '12px 16px',
              color: colors?.textPrimary,
              fontWeight: 500,
              textAlign: 'center',
              textDecoration: 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 0 15px ${colors?.glow}`,
                opacity: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderColor: colors?.glow,
                color: 'rgba(229, 229, 229, 0.9)',
              },
            }}
          >
            Additional Links
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ExternalLinks;
