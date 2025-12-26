/**
 * WelcomeOverlay Component - Using Material-UI
 *
 * Refactored to use @mui/material Dialog, Button, Typography components
 * Maintains all original functionality with cleaner, maintained code
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
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { welcomeExamples } from '../data/welcomeExamples';
import muiTheme from '../theme/muiTheme';

const WelcomeOverlay = ({ onStartQuiz, onExplore, colors }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onExplore();
    }, 300);
  };

  const handleStartQuiz = () => {
    setIsClosing(true);
    setTimeout(() => {
      onStartQuiz();
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
            Click on a country for info
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleClose}
              size="large"
              sx={{
                fontSize: '18px',
                padding: '12px 32px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35), 0 10px 28px rgba(0, 0, 0, 0.25)',
                }
              }}
            >
              Explore
            </Button>
            <Button
              variant="contained"
              onClick={handleStartQuiz}
              size="large"
              sx={{
                fontSize: '18px',
                padding: '12px 32px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35), 0 10px 28px rgba(0, 0, 0, 0.25)',
                }
              }}
            >
              Start Quiz
            </Button>
          </Box>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
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
                    {/* Card Header - Source */}
                    <CardHeader
                      title={
                        image.link ? (
                          <MuiLink
                            href={image.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: colors.linkColor, textDecoration: 'underline', fontWeight: 600 }}
                          >
                            {image.source || collectionName}
                          </MuiLink>
                        ) : (
                          <Typography variant="h6">
                            {image.source || collectionName}
                          </Typography>
                        )
                      }
                      sx={{
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                      }}
                    />

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
                            {image.link ? (
                              <MuiLink
                                href={image.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                sx={{ color: colors.linkColor, textDecoration: 'underline' }}
                              >
                                {image.title}
                              </MuiLink>
                            ) : (
                              image.title
                            )}
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
                {/* Rotate Left */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '40px' }}>
                    ←
                  </Button>
                  <Typography variant="body2">Rotate globe left</Typography>
                </Box>

                {/* Rotate Right */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '40px' }}>
                    →
                  </Button>
                  <Typography variant="body2">Rotate globe right</Typography>
                </Box>

                {/* Zoom In */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '40px' }}>
                    +
                  </Button>
                  <Typography variant="body2">Zoom in to see details</Typography>
                </Box>

                {/* Zoom Out */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '40px' }}>
                    −
                  </Button>
                  <Typography variant="body2">Zoom out to see full globe</Typography>
                </Box>

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
