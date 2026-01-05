/**
 * WelcomeOverlay Component - Settings and Help Dialog
 *
 * Provides access to game settings (hints, region filter) and helpful information
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  Link as MuiLink,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { welcomeExamples } from '../data/welcomeExamples';
import muiTheme from '../theme/muiTheme';
import { getSourceDisplayName, getSourceUrl } from '../utils/sourceHelpers';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { useContentSettings } from '../contexts/ContentSettingsContext';

const WelcomeOverlay = ({
  onClose,
  colors,
  mode,
  onModeToggle,
  onRegionChange
}) => {
  // Get game settings from context
  const {
    hintsEnabled,
    setHintsEnabled,
    selectedQuizRegion,
    setSelectedQuizRegion,
    quizCountriesOnly,
    setQuizCountriesOnly,
  } = useGameSettings();

  // Get content settings from context
  const {
    showNudity,
    setShowNudity,
  } = useContentSettings();

  const [isClosing, setIsClosing] = useState(false);

  // Source mapping functions imported from shared utility

  // Helper function to get image link URL based on collection type
  const getImageLinkUrl = (image) => {
    switch(image.collection_type) {
      case 'Albert Kahn':
        return image.page_url;
      case 'Children in Art':
        return image.work_url;
      case 'Public Domain Review':
        return image.source_url;
      case 'Met Museum':
        return image.object_url;
      default:
        return null;
    }
  };

  // Render collection-specific caption
  const renderCaption = (image, countryName) => {
    switch (image.collection_type) {
      case 'Albert Kahn':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
            {/* Title (linked to page_url) */}
            {image.title && image.page_url && (
              <MuiLink
                href={image.page_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: colors.linkColor, textDecoration: 'underline' }}
              >
                {image.title}
              </MuiLink>
            )}
            {/* Location, Date (combined on one line) */}
            {(image.location || image.date) && (
              <Typography variant="body2">
                {image.location && image.date
                  ? `${image.location}, ${image.date}`
                  : image.location || image.date}
              </Typography>
            )}
            {/* Mission (plain text, no hyperlink) */}
            {image.mission && (
              <Typography variant="body2">
                {image.mission}
              </Typography>
            )}
            {/* Organization (always link to homepage) */}
            <MuiLink
              href="https://albert-kahn.hauts-de-seine.fr/en/"
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{ color: colors.linkColor, textDecoration: 'underline' }}
            >
              Musée départemental Albert-Kahn
            </MuiLink>
          </Box>
        );

      case 'Children in Art':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
            {/* Title (linked to work_url) */}
            {image.title && image.work_url && (
              <MuiLink
                href={image.work_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: colors.linkColor, textDecoration: 'underline' }}
              >
                {image.title}
              </MuiLink>
            )}
            {/* Artist Name (Nationality) - parentheses, not comma */}
            {image.artist_name && (
              <Typography variant="body2">
                {image.artist_name}
                {image.artist_nationality && ` (${image.artist_nationality})`}
              </Typography>
            )}
            {/* via Source Name (with hyperlink) */}
            {image.source && getSourceUrl(image.source) && (
              <Typography variant="body2">
                via{' '}
                <MuiLink
                  href={getSourceUrl(image.source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: colors.linkColor, textDecoration: 'underline' }}
                >
                  {getSourceDisplayName(image.source)}
                </MuiLink>
              </Typography>
            )}
            {/* Artists from Country: Children in Art */}
            <Typography variant="body2">
             Children in Art
            </Typography>
          </Box>
        );

      case 'Public Domain Review':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
            {/* Description with Public Domain Review article link to source_link */}
            {image.description && (
              <Typography variant="body2">
                {image.description}
                {image.source_link && (
                  <>
                    {' - '}
                    <MuiLink
                      href={image.source_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: colors.linkColor, textDecoration: 'underline' }}
                    >
                      Public Domain Review article
                    </MuiLink>
                  </>
                )}
              </Typography>
            )}
            {/* Title (italicized) with Source link to source_url */}
            {image.title && (
              <Typography variant="body2">
                <em>{image.title}</em>
                {image.source_url && (
                  <>
                    {' - '}
                    <MuiLink
                      href={image.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: colors.linkColor, textDecoration: 'underline' }}
                    >
                      Source
                    </MuiLink>
                  </>
                )}
              </Typography>
            )}
          </Box>
        );

      case 'Met Museum':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
            {/* Title (linked to object_url) */}
            {image.title && image.object_url && (
              <MuiLink
                href={image.object_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: colors.linkColor, textDecoration: 'underline' }}
              >
                {image.title}
              </MuiLink>
            )}
            {/* Artist/Culture, Date (combined on one line) */}
            {(image.artist_name || image.culture || image.object_date) && (
              <Typography variant="body2">
                {(image.artist_name || image.culture) && image.object_date
                  ? `${image.artist_name || image.culture}, ${image.object_date}`
                  : image.artist_name || image.culture || image.object_date}
              </Typography>
            )}
            {/* Medium */}
            {image.medium && (
              <Typography variant="body2">
                {image.medium}
              </Typography>
            )}
            {/* Organization (link to exhibitions page) */}
            <MuiLink
              href="https://www.metmuseum.org/exhibitions"
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{ color: colors.linkColor, textDecoration: 'underline' }}
            >
              Metropolitan Museum of Art
            </MuiLink>
          </Box>
        );

      default:
        return null;
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (event, reason) => {
    if (reason === 'backdropClick') {
      handleClose();
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog
        open={true}
        onClose={handleBackdropClick}
        maxWidth="sm"
        fullWidth

      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            paddingBottom: 2,
          }}
        >
          {/* Close button in top right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              size="small"
              sx={{
                minWidth: 'auto',
                padding: '4px 8px'
              }}
            >
              ✕
            </Button>
          </Box>

          {/* Main Title */}
          <Typography
            component="div"
            variant="h5"
            sx={{
              fontWeight: 600,
              textAlign: 'center',
              mb: 2
            }}
          >
            Help & Settings
          </Typography>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
          {/* Settings Section */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Game Settings"
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                {/* Quiz Mode Toggle */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mode === 'quiz'}
                        onChange={onModeToggle}
                        size="small"
                      />
                    }
                    label="Quiz"
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Turn Quiz Mode on/off
                  </Typography>
                </Box>

                {/* Hints Toggle */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hintsEnabled}
                        onChange={(e) => setHintsEnabled(e.target.checked)}
                        disabled={mode !== 'quiz'}
                        size="small"
                      />
                    }
                    label="Hints"
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Show neighboring countries in quiz mode
                  </Typography>
                </Box>

                {/* Region Filter */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Select
                    value={selectedQuizRegion || ''}
                    onChange={(e) => {
                      setSelectedQuizRegion(e.target.value || null);
                      if (onRegionChange) {
                        onRegionChange();
                      }
                    }}
                    size="small"
                    displayEmpty
                    sx={{ minWidth: '150px' }}
                  >
                    <MenuItem value="">All Regions</MenuItem>
                    <MenuItem value="Africa">Africa</MenuItem>
                    <MenuItem value="Americas">Americas</MenuItem>
                    <MenuItem value="Asia">Asia</MenuItem>
                    <MenuItem value="Europe">Europe</MenuItem>
                    <MenuItem value="Oceania">Oceania</MenuItem>
                  </Select>
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Filter quiz questions by region
                  </Typography>
                </Box>

                {/* Quiz Countries Only Toggle */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quizCountriesOnly}
                        onChange={(e) => {
                          setQuizCountriesOnly(e.target.checked);
                          if (onRegionChange) {
                            onRegionChange();
                          }
                        }}
                        size="small"
                      />
                    }
                    label="Countries Only"
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Quiz only on sovereign countries (excludes territories)
                  </Typography>
                </Box>

                {/* Show Nudity Toggle */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showNudity}
                        onChange={(e) => setShowNudity(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show Nudity"
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Include artwork containing nudity
                  </Typography>
                </Box>

                {/* Next Button */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      minWidth: 'auto',
                      padding: '2px 8px',
                      fontSize: '1rem'
                    }}
                  >
                    Next
                  </Button>
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Get a new country to find
                  </Typography>
                </Box>

                {/* Show Me Button */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      minWidth: 'auto',
                      padding: '2px 8px',
                      fontSize: '1rem'
                    }}
                  >
                    Show
                  </Button>
                  <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Reveal the answer and its location
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Image Types Section Header */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              textAlign: 'center',
              mb: 2,
              mt: 1
            }}
          >
            Image Types
          </Typography>

          {/* Country Examples */}
          {welcomeExamples.countries.map((country) => (
            <Box key={country.iso3} sx={{ mb: 2 }}>
              {Object.entries(country.collections).map(
                ([collectionName, image]) => (
                  <Card
                    key={collectionName}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {/* Card Content */}
                    <CardContent>
                      {/* Image */}
                      {getImageLinkUrl(image) ? (
                        <MuiLink
                          href={getImageLinkUrl(image)}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'block', mb: 2 }}
                        >
                          <CardMedia
                            component="img"
                            image={image.filepath}
                            alt={image.title || collectionName}
                            sx={{
                              borderRadius: '4px',
                              objectFit: 'contain',
                              cursor: 'pointer',
                            }}
                          />
                        </MuiLink>
                      ) : (
                        <CardMedia
                          component="img"
                          image={image.filepath}
                          alt={image.title || collectionName}
                          sx={{
                            mb: 2,
                            borderRadius: '4px',
                            objectFit: 'contain',
                          }}
                        />
                      )}

                      {/* Caption */}
                      {renderCaption(image, country.name)}

                      {/* Collection Description */}
                      {image.collection_description && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {collectionName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {image.collection_description}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default WelcomeOverlay;
