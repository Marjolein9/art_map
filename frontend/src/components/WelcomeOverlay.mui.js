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

const WelcomeOverlay = ({
  onClose,
  colors,
  hintsEnabled,
  setHintsEnabled,
  selectedQuizRegion,
  setSelectedQuizRegion
}) => {
  const [isClosing, setIsClosing] = useState(false);

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
            Image Types
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Hints Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hintsEnabled}
                        onChange={(e) => setHintsEnabled(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Hints"
                    sx={{ minWidth: '100px' }}
                  />
                  <Typography variant="body2">
                    Show neighboring countries in quiz mode
                  </Typography>
                </Box>

                {/* Region Filter */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Select
                    value={selectedQuizRegion || ''}
                    onChange={(e) => setSelectedQuizRegion(e.target.value || null)}
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
                  <Typography variant="body2">
                    Filter quiz questions by region
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

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
                      <CardMedia
                        component="img"
                        image={image.image}
                        alt={image.title || collectionName}
                        sx={{
                          mb: 2,
                          borderRadius: '4px',
                          objectFit: 'contain',
                        }}
                      />

                      {/* Caption */}
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        {/* Source as subtitle */}
                        {image.source && (
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              fontStyle: 'italic',
                            }}
                          >
                            {image.link ? (
                              <MuiLink
                                href={image.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: colors.linkColor, textDecoration: 'underline' }}
                              >
                                {image.source}
                              </MuiLink>
                            ) : (
                              image.source
                            )}
                          </Typography>
                        )}

                        {image.subtitle && (
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {image.subtitle_link ? (
                              <MuiLink
                                href={image.subtitle_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: colors.linkColor, textDecoration: 'underline' }}
                              >
                                {image.subtitle}
                              </MuiLink>
                            ) : (
                              image.subtitle
                            )}
                          </Typography>
                        )}
                        {image.title && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {image.title}
                          </Typography>
                        )}
                        {image.artist && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {image.artist}
                          </Typography>
                        )}
                        {image.nationality && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {image.nationality}
                          </Typography>
                        )}
                        {image.date && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {image.date}
                          </Typography>
                        )}
                      </Box>

                      {/* Description */}
                      {image.description && (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          {image.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          ))}

          {/* Quiz Mode Controls Section */}
          <Card>
            <CardHeader
              title="Quiz Mode Controls"
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Quiz Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch disabled />}
                    label="Quiz"
                    sx={{ minWidth: '100px' }}
                  />
                  <Typography variant="body2">Turn Quiz Mode on/off</Typography>
                </Box>

                {/* Skip */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '40px' }}>
                    Next
                  </Button>
                  <Typography variant="body2">Get a new country to find</Typography>
                </Box>

                {/* Show Me */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '60px' }}>
                    Show Me
                  </Button>
                  <Typography variant="body2">Reveal the answer and its location</Typography>
                </Box>

                {/* Hint Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch disabled />}
                    label="Hint"
                    sx={{ minWidth: '100px' }}
                  />
                  <Typography variant="body2">Show/hide the country and neighboring countries</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default WelcomeOverlay;
