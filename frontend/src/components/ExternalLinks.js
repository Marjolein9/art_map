import { Box, Typography, Link } from '@mui/material';

/**
 * ExternalLinks Component
 *
 * Displays external resource links for a country.
 * Handles Gapminder Dollar Street, Food Atlas, and other external links.
 *
 * @param {Object} externalLinks - External links data object
 * @param {string} externalLinks.gapminder_url - Gapminder Dollar Street URL
 * @param {string} externalLinks.tasteatlas_url - TasteAtlas URL
 * @param {string} externalLinks.extra_links - Additional external links
 * @param {string} countryName - Name of the country
 */
const ExternalLinks = ({ externalLinks, countryName }) => {
  // Return null if no links are available
  if (!externalLinks ||
      (!externalLinks.gapminder_url?.trim() &&
       !externalLinks.tasteatlas_url?.trim() &&
       !externalLinks.extra_links?.trim())) {
    return null;
  }

  return (
    <Box className="external-links-section">
      <Typography variant="h4" className="section-header section-header--external">External Resources</Typography>
      <Box className="external-links-list">
        {externalLinks.gapminder_url?.trim() && (
          <Box className="card-item card-item--padded">
            <Link
              href={externalLinks.gapminder_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Gapminder's Dollar Street
            </Link>
            : How people live in {countryName || 'this country'}
          </Box>
        )}
        {externalLinks.tasteatlas_url?.trim() && (
          <Box className="card-item card-item--padded">
            <Link
              href={externalLinks.tasteatlas_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              TasteAtlas
            </Link>
            : Food from {countryName || 'this country'}
          </Box>
        )}
        {externalLinks.extra_links?.trim() && (
          <Link
            href={externalLinks.extra_links}
            target="_blank"
            rel="noopener noreferrer"
            className="card-item card-item--padded"
          >
            Additional Links
          </Link>
        )}
      </Box>
    </Box>
  );
};

export default ExternalLinks;
