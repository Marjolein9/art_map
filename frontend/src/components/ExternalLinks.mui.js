import {
  Box,
  Typography,
  Link,
  List,
  ListItem,
  ListItemButton
} from '@mui/material';
import COLOR_SCHEME from '../styles/colorSchemes';

/**
 * ExternalLinks Component (MUI Version)
 *
 * Displays external resource links for a country using MUI List components.
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

  const linkItems = [];

  if (externalLinks.gapminder_url?.trim()) {
    linkItems.push({
      url: externalLinks.gapminder_url,
      label: "Gapminder's Dollar Street",
      description: `How people live in ${countryName || 'this country'}`
    });
  }

  if (externalLinks.tasteatlas_url?.trim()) {
    linkItems.push({
      url: externalLinks.tasteatlas_url,
      label: 'TasteAtlas',
      description: `Food from ${countryName || 'this country'}`
    });
  }

  if (externalLinks.extra_links?.trim()) {
    linkItems.push({
      url: externalLinks.extra_links,
      label: 'Additional Links',
      description: 'More resources'
    });
  }

  return (
    <Box
      sx={{
        padding: 2,
        borderTop: `2px solid ${COLOR_SCHEME.borderPrimary}`,
        marginTop: 2,
        backgroundColor: COLOR_SCHEME.bgSecondary,
        borderRadius: 1
      }}
    >
      <Typography
        variant="h6"
        sx={{
          marginBottom: 2,
          fontWeight: 600,
          textAlign: 'center',
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: COLOR_SCHEME.textPrimary,
          fontFamily: "'Roboto Condensed', Helvetica, sans-serif"
        }}
      >
        External Resources
      </Typography>

      <List sx={{ padding: 0 }}>
        {linkItems.map((item, index) => (
          <ListItem
            key={index}
            disablePadding
            sx={{
              marginBottom: index < linkItems.length - 1 ? 1.5 : 0
            }}
          >
            <ListItemButton
              component="a"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderRadius: 1,
                backgroundColor: COLOR_SCHEME.bgPrimary,
                border: `2px solid ${COLOR_SCHEME.borderPrimary}`,
                padding: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                transition: 'all 0.25s ease-in-out',
                opacity: 0.8,
                '&:hover': {
                  backgroundColor: COLOR_SCHEME.bgPrimary,
                  borderColor: COLOR_SCHEME.textPrimary,
                  opacity: 1,
                  transform: 'translateY(-5px)',
                  boxShadow: `0 0 20px ${COLOR_SCHEME.linkColor}`
                }
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: COLOR_SCHEME.textPrimary,
                  fontSize: '13px'
                }}
              >
                <Box
                  component="span"
                  sx={{
                    color: COLOR_SCHEME.linkColor,
                    textDecoration: 'underline',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  {item.label}
                </Box>
                : {item.description}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ExternalLinks;
