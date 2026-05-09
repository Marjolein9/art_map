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

  // eslint-disable-next-line no-unused-vars
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

  // Shared sub-components for the reference metadata layout

  // Spec row: mono uppercase key left / right-aligned value
  const SpecRow = ({ label, children, last }) => (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 1.5,
      py: 0.625,
      borderBottom: last ? 'none' : '1px dotted var(--rule, #cfc4a8)',
    }}>
      <Typography component="span" sx={{
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '9px',
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        color: 'var(--ink-3, #6c6356)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', fontSize: '11px', color: 'var(--ink-2, #3a322a)', lineHeight: 1.4, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {children}
      </Box>
    </Box>
  );

  // Italic serif title, optionally linked
  const ArtTitle = ({ href, children }) => (
    <Typography component="h3" sx={{
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: '1.2rem',
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--ink, #1a1612)',
      lineHeight: 1.15,
      mb: 0.75,
      mt: 0,
    }}>
      {href ? (
        <MuiLink href={href} target="_blank" rel="noopener noreferrer" sx={{
          color: 'inherit',
          textDecoration: 'none',
          borderBottom: '1px solid var(--rule, #cfc4a8)',
          transition: 'border-color .15s, color .15s',
          '&:hover': { borderColor: 'var(--accent, #b34727)', color: 'var(--accent, #b34727)' },
        }}>
          {children}
        </MuiLink>
      ) : children}
    </Typography>
  );

  // "by Artist · nationality" line
  const ByLine = ({ artist, artistHref, nationality }) => {
    if (!artist) return null;
    return (
      <Typography sx={{
        fontFamily: 'var(--font-sans, "Manrope", sans-serif)',
        fontSize: '12px',
        lineHeight: 1.5,
        color: 'var(--ink-3, #6c6356)',
        mb: 1.25,
      }}>
        {'by '}
        {artistHref ? (
          <MuiLink href={artistHref} target="_blank" rel="noopener noreferrer" sx={{
            fontWeight: 600,
            color: 'var(--ink-2, #3a322a)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--rule, #cfc4a8)',
            '&:hover': { borderColor: 'var(--accent, #b34727)' },
          }}>
            {artist}
          </MuiLink>
        ) : (
          <Box component="b" sx={{ color: 'var(--ink-2, #3a322a)' }}>{artist}</Box>
        )}
        {nationality && (
          <Box component="span" sx={{ fontStyle: 'italic', color: 'var(--ink-3, #6c6356)' }}>
            {' · '}{nationality}
          </Box>
        )}
      </Typography>
    );
  };

  // Accent source link with arrow
  const SourceLink = ({ href, children }) => href ? (
    <MuiLink href={href} target="_blank" rel="noopener noreferrer" sx={{
      color: 'var(--accent, #b34727)',
      textDecoration: 'none',
      borderBottom: '1px solid rgba(179,71,39,.3)',
      fontSize: '11px',
      '&:hover': { borderColor: 'var(--accent, #b34727)' },
    }}>
      {children} ↗
    </MuiLink>
  ) : (
    <Box component="span" sx={{ fontSize: '11px', color: 'var(--ink-2, #3a322a)' }}>{children}</Box>
  );

  // Render collection-specific caption using the reference art card layout
  const renderCaption = (image) => {
    let title = null, titleHref = null, artist = null, artistHref = null,
        nationality = null, specs = [];

    switch (image.collection_type) {
      case 'Albert Kahn':
        title = image.title;
        titleHref = image.page_url;
        if (image.location || image.date) {
          specs.push({ label: 'Location', value: [image.location, image.date].filter(Boolean).join(', ') });
        }
        if (image.mission) specs.push({ label: 'Mission', value: image.mission });
        specs.push({ label: 'Source', value: <SourceLink href="https://albert-kahn.hauts-de-seine.fr/en/">Musée Albert-Kahn</SourceLink> });
        break;

      case 'Children in Art':
        title = image.title;
        titleHref = image.work_url;
        artist = image.artist_name;
        artistHref = image.author_wikilink;
        nationality = image.artist_nationality;
        if (image.source && getSourceUrl(image.source)) {
          specs.push({ label: 'Via', value: <SourceLink href={getSourceUrl(image.source)}>{getSourceDisplayName(image.source)}</SourceLink> });
        }
        specs.push({ label: 'Collection', value: 'Children in Art' });
        break;

      case 'Public Domain Review':
        title = image.title;
        titleHref = image.source_url;
        if (image.description) specs.push({ label: 'Description', value: image.description });
        if (image.source_url) specs.push({ label: 'Source', value: <SourceLink href={image.source_url}>View image</SourceLink> });
        if (image.source_link) specs.push({ label: 'Article', value: <SourceLink href={image.source_link}>Public Domain Review</SourceLink> });
        break;

      case 'Met Museum':
        title = image.title;
        titleHref = image.object_url;
        artist = image.artist_name || image.culture;
        if (image.object_date) specs.push({ label: 'Date', value: image.object_date });
        if (image.medium) specs.push({ label: 'Medium', value: image.medium });
        specs.push({ label: 'Source', value: <SourceLink href={image.object_url || 'https://www.metmuseum.org'}>Met Museum</SourceLink> });
        break;

      default:
        return null;
    }

    return (
      <Box sx={{ pt: 2 }}>
        {title && <ArtTitle href={titleHref}>{title}</ArtTitle>}
        <ByLine artist={artist} artistHref={artistHref} nationality={nationality} />
        {specs.length > 0 && (
          <Box sx={{ borderTop: '1px dotted var(--rule, #cfc4a8)', mt: 1.25 }}>
            {specs.map(({ label, value }, i) => (
              <SpecRow key={i} label={label} last={i === specs.length - 1}>{value}</SpecRow>
            ))}
          </Box>
        )}
      </Box>
    );
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
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(26,22,18,0.45)',
              backdropFilter: 'blur(6px)',
            }
          }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            px: { xs: 2, sm: 3.5 },
            pt: { xs: 2.5, sm: 3 },
            pb: { xs: 2, sm: 2.5 },
            background: 'var(--paper-2, #e8dfc8)',
            borderBottom: '1px solid var(--rule, #cfc4a8)',
            position: 'relative',
          }}>
            {/* Eyebrow label */}
            <Typography sx={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--accent, #b34727)',
              mb: 1,
            }}>
              Guide
            </Typography>

            {/* Main title — large serif italic */}
            <Typography component="h1" sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '2.25rem', sm: '3rem' },
              fontWeight: 500,
              fontStyle: 'italic',
              lineHeight: 1,
              color: 'var(--ink, #1a1612)',
              letterSpacing: '-0.01em',
            }}>
              Help & Settings
            </Typography>

            {/* Circle close button — top-right */}
            <Box
              component="button"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid var(--rule, #cfc4a8)',
                background: 'transparent',
                color: 'var(--ink-2, #3a322a)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: 1,
                transition: 'all .15s',
                '&:hover': {
                  background: 'var(--ink, #1a1612)',
                  color: 'var(--paper, #f1ead9)',
                  borderColor: 'var(--ink, #1a1612)',
                },
              }}
            >
              ×
            </Box>
          </Box>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
          {/* Settings Section */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Typography sx={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-3, #6c6356)',
                  }}>
                    Game Settings
                  </Typography>
                  <Typography sx={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontSize: '10px',
                    fontWeight: 400,
                    letterSpacing: '.1em',
                    color: 'var(--ink-3, #6c6356)',
                  }}>
                    i
                  </Typography>
                </Box>
              }
              sx={{
                bgcolor: 'var(--paper-2, #e8dfc8)',
                borderBottom: '1px solid var(--rule, #cfc4a8)',
                py: 1,
                px: 2,
                '& .MuiCardHeader-content': { width: '100%' },
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

          {/* Image Types Section Header — dr-secttitle pattern */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 0.75,
            mb: 2,
            mt: 1,
            borderBottom: '1px solid var(--rule, #cfc4a8)',
          }}>
            <Typography sx={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-3, #6c6356)',
            }}>
              Image Types
            </Typography>
            <Typography sx={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '10px',
              fontWeight: 400,
              letterSpacing: '.1em',
              color: 'var(--ink-3, #6c6356)',
            }}>
              ii
            </Typography>
          </Box>

          {/* Country Examples */}
          {welcomeExamples.countries.map((country) => (
            <Box key={country.iso3} sx={{ mb: 2 }}>
              {Object.entries(country.collections).map(
                ([collectionName, image]) => (
                  <Card
                    key={collectionName}
                    sx={{
                      mb: 2,
                      border: '1px solid var(--rule, #cfc4a8)',
                      borderRadius: '4px',
                      boxShadow: 'none',
                    }}
                  >
                    {/* Collection type header — dr-secttitle pattern */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 2,
                      py: 0.875,
                      background: 'var(--paper-2, #e8dfc8)',
                      borderBottom: '1px solid var(--rule, #cfc4a8)',
                    }}>
                      <Typography sx={{
                        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-3, #6c6356)',
                      }}>
                        {collectionName}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                        fontSize: '10px',
                        fontWeight: 400,
                        letterSpacing: '.1em',
                        color: 'var(--ink-3, #6c6356)',
                        fontStyle: 'italic',
                      }}>
                        {country.name}
                      </Typography>
                    </Box>

                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Image */}
                      {getImageLinkUrl(image) ? (
                        <MuiLink
                          href={getImageLinkUrl(image)}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'block', mb: 0 }}
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
                            borderRadius: '4px',
                            objectFit: 'contain',
                          }}
                        />
                      )}

                      {/* Caption — reference metadata layout */}
                      {renderCaption(image)}

                      {/* Collection description */}
                      {image.collection_description && (
                        <Box sx={{
                          mt: 2,
                          pt: 1.5,
                          borderTop: '1px solid var(--rule, #cfc4a8)',
                        }}>
                          <Typography sx={{
                            fontFamily: 'var(--font-sans, "Manrope", sans-serif)',
                            fontSize: '12px',
                            lineHeight: 1.5,
                            color: 'var(--ink-2, #3a322a)',
                          }}>
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
