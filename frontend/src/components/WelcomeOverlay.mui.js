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
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Candles from './Candles';
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
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleClose}
              size="small"
            >
              Explore
            </Button>
            <Button
              variant="contained"
              onClick={handleStartQuiz}
              size="small"
            >
              Start Quiz
            </Button>
          </Box>
          
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
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
          {/* Intro Text */}
          <Typography
            variant="body2"
            sx={{ mb: 3, fontWeight: 500 }}
          >
            Click on a country to get the public domain images and info described below
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
                    {/* Card Header - Source */}
                    <CardHeader
                      title={
                        image.link ? (
                          <MuiLink
                            href={image.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
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
                      }}
                    />

                    {/* Card Content */}
                    <CardContent>
                      {/* Description */}
                      {image.description && (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 2 }}
                        >
                          {image.description}
                        </Typography>
                      )}

                      {/* Image */}
                      <CardMedia
                        component="img"
                        image={image.image}
                        alt={image.title || collectionName}
                        sx={{
                          my: 2,
                          borderRadius: '4px',
                          maxHeight: '300px',
                          objectFit: 'cover',
                        }}
                      />

                      {/* Caption */}
                      <Box sx={{ textAlign: 'center' }}>
                        {image.subtitle && (
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {image.subtitle}
                          </Typography>
                        )}
                        {image.title && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {image.link ? (
                              <MuiLink
                                href={image.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                              >
                                {image.title}
                              </MuiLink>
                            ) : (
                              image.title
                            )}
                          </Typography>
                        )}
                        {image.artist && (
                          <Typography variant="caption" color="textSecondary">
                            {image.artist}
                          </Typography>
                        )}
                        {image.nationality && (
                          <Typography variant="caption" color="textSecondary">
                            <br /> {image.nationality}
                          </Typography>
                        )}
                        {image.date && (
                          <Typography variant="caption" color="textSecondary">
                            <br /> {image.date}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          ))}

          {/* Child Mortality Section */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Child Mortality Progress"
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            />
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Each candle represents one percentage point decrease in the
                under-five child mortality of the country between 1989 and 2023.
              </Typography>
              <Candles count={1} />
            </CardContent>
          </Card>

          {/* Quiz Mode Controls Section */}
          <Card>
            <CardHeader
              title="Quiz Mode Controls"
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
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
                  <Typography variant="body2" sx={{ minWidth: '40px' }}>Quiz</Typography>
                  <Typography variant="body2">Turn Quiz Mode on/off</Typography>
                </Box>

                {/* Skip */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" size="small" sx={{ minWidth: '40px' }}>
                    Skip
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
                  <Typography variant="body2" sx={{ minWidth: '40px' }}>Hint</Typography>
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
