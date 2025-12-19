/**
 * WelcomeOverlay Component - Interactive Welcome Screen (Pure MUI Version)
 *
 * Fully migrated to Material-UI with sx prop styling - no CSS classes
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
  IconButton,
  Stack,
  Card,
  CardContent,
  CardMedia,
  Link,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Candles from './Candles';
import { welcomeExamples } from '../data/welcomeExamples';

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

  return (
    <Dialog
      open={!isClosing}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen
      slotProps={{
        paper: {
          sx: {
            bgcolor: colors?.cardBg || 'background.paper',
            backgroundImage: 'none',
            opacity: isClosing ? 0 : 1,
            transition: 'opacity 0.3s ease',
          },
        },
        backdrop: {
          onClick: handleClose,
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 15,
          top: 15,
          color: colors?.linkColor || 'primary.main',
          zIndex: 1,
          border: `2px solid ${colors?.linkColor || 'primary.main'}`,
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            boxShadow: `0 0 12px ${colors?.linkColor}`,
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          p: 0,
          overflow: 'hidden',
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 2.5,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            borderBottom: `1px solid ${colors?.linkUnderline || 'divider'}`,
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleClose}
              fullWidth
              sx={{
                py: 3,
                fontSize: '18px',
                borderColor: '#8fb3c9',
                color: '#8fb3c9',
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#8fb3c9',
                  bgcolor: 'rgba(143, 179, 201, 0.15)',
                  borderWidth: 2,
                },
              }}
            >
              Explore
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleStartQuiz}
              fullWidth
              sx={{
                py: 3,
                fontSize: '18px',
                borderColor: '#d4a574',
                color: '#d4a574',
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#d4a574',
                  bgcolor: 'rgba(212, 165, 116, 0.15)',
                  borderWidth: 2,
                },
              }}
            >
              Start Quiz
            </Button>
          </Stack>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2.5,
            bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.25,
            '&::-webkit-scrollbar': {
              width: '12px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(241, 239, 239, 0.3)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: colors?.linkColor,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: colors?.linkHover,
            },
          }}
        >
          {/* Info Header */}
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 1,
              borderLeft: `3px solid ${colors?.linkColor}`,
            }}
          >
            <Typography
              sx={{
                m: 0,
                fontSize: '14px',
                color: colors?.textPrimary,
                fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
            >
              Click on a country to get the public domain images and info described below
            </Typography>
          </Box>

          {/* Country Examples */}
          {welcomeExamples.countries.map((country) => (
            <React.Fragment key={country.iso3}>
              {Object.entries(country.collections).map(
                ([collectionName, image]) => (
                  <Card
                    key={collectionName}
                    sx={{
                      bgcolor: colors?.bgOverlayLight || 'rgba(0, 0, 0, 0.2)',
                      border: `1px solid ${colors?.border}`,
                      borderRadius: 1,
                    }}
                  >
                    {/* Source Header */}
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
                        borderBottom: `1px solid ${colors?.border}`,
                      }}
                    >
                      {image.link ? (
                        <Link
                          href={image.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{
                            fontSize: '16px',
                            fontWeight: 600,
                            fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          {image.source || collectionName}
                        </Link>
                      ) : (
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: colors?.linkColor,
                            m: 0,
                            textShadow: `0 0 8px ${colors?.linkShadow}`,
                            fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          {image.source || collectionName}
                        </Typography>
                      )}
                    </Box>

                    {/* Card Content */}
                    <CardContent>
                      {/* Description */}
                      {image.description && (
                        <Box
                          sx={{
                            bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
                            p: 1.5,
                            borderRadius: 0.5,
                            color: colors?.textPrimary,
                            mb: 2,
                            lineHeight: 1.4,
                            fontSize: '14px',
                          }}
                        >
                          {image.description}
                        </Box>
                      )}

                      {/* Image */}
                      <CardMedia
                        component="img"
                        image={image.image}
                        alt={image.title || collectionName}
                        sx={{
                          width: '100%',
                          maxHeight: 500,
                          objectFit: 'contain',
                          borderRadius: 0.5,
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />

                      {/* Caption */}
                      <Box
                        sx={{
                          bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
                          p: 1.5,
                          borderRadius: 0.5,
                          color: colors?.textPrimary,
                          mt: 2,
                          lineHeight: 1.4,
                          fontSize: '14px',
                        }}
                      >
                        {image.subtitle && (
                          <Typography
                            sx={{
                              fontStyle: 'italic',
                              fontSize: '14px',
                              mb: 0.5,
                              fontWeight: 500,
                            }}
                          >
                            {image.subtitle}
                          </Typography>
                        )}
                        {image.title && (
                          image.link ? (
                            <Link
                              href={image.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              sx={{ fontWeight: 700, fontSize: '14px' }}
                            >
                              {image.title}
                            </Link>
                          ) : (
                            <Typography sx={{ fontWeight: 700, fontSize: '14px' }}>
                              {image.title}
                            </Typography>
                          )
                        )}
                        {image.artist && (
                          <Typography sx={{ fontSize: '14px' }}>
                            {image.artist}
                          </Typography>
                        )}
                        {image.nationality && (
                          <Typography sx={{ fontSize: '14px' }}>
                            {image.nationality}
                          </Typography>
                        )}
                        {image.date && (
                          <Typography sx={{ fontSize: '14px' }}>
                            {image.date}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )
              )}
            </React.Fragment>
          ))}

          {/* Child Mortality Section */}
          <Card
            sx={{
              bgcolor: colors?.bgOverlayLight || 'rgba(0, 0, 0, 0.2)',
              border: `1px solid ${colors?.border}`,
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
                borderBottom: `1px solid ${colors?.border}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors?.linkColor,
                  m: 0,
                  textShadow: `0 0 8px ${colors?.linkShadow}`,
                  fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Child Mortality Progress
              </Typography>
            </Box>
            <CardContent>
              <Box
                sx={{
                  bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
                  p: 1.5,
                  borderRadius: 0.5,
                  color: colors?.textPrimary,
                  lineHeight: 1.4,
                  fontSize: '14px',
                }}
              >
                Each candle represents one percentage point decrease in the
                under-five child mortality of the country between 1989 and 2023.
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                <Candles count={1} />
              </Box>
            </CardContent>
          </Card>

          {/* Quiz Mode Controls Section */}
          <Card
            sx={{
              bgcolor: colors?.bgOverlayLight || 'rgba(0, 0, 0, 0.2)',
              border: `1px solid ${colors?.border}`,
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: colors?.bgBrownDark || 'rgb(87, 80, 72)',
                borderBottom: `1px solid ${colors?.border}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors?.linkColor,
                  m: 0,
                  textShadow: `0 0 8px ${colors?.linkShadow}`,
                  fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Quiz Mode Controls
              </Typography>
            </Box>
            <CardContent>
              <Stack spacing={1}>
                {[
                  { icon: '←', label: 'Rotate globe left' },
                  { icon: '→', label: 'Rotate globe right' },
                  { icon: '+', label: 'Zoom in to see details' },
                  { icon: '−', label: 'Zoom out to see full globe' },
                  { icon: 'Skip', label: 'Get a new country to find' },
                  { icon: 'Show Me', label: 'Reveal the answer and its location' },
                ].map((control, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 0.5,
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 'auto',
                        px: 1.5,
                        py: 0.75,
                        fontSize: '12px',
                        borderColor: colors?.linkColor,
                        color: colors?.linkColor,
                      }}
                    >
                      {control.icon}
                    </Button>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: colors?.textSecondary,
                        lineHeight: 1.3,
                      }}
                    >
                      {control.label}
                    </Typography>
                  </Box>
                ))}

                {/* Toggle Controls */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 0.5,
                  }}
                >
                  <FormControlLabel
                    control={<Switch size="small" />}
                    label="Quiz"
                    sx={{
                      m: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors?.linkColor,
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: colors?.textSecondary,
                      lineHeight: 1.3,
                    }}
                  >
                    Turn Quiz Mode on/off
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 0.5,
                  }}
                >
                  <FormControlLabel
                    control={<Switch size="small" defaultChecked />}
                    label="Hint"
                    sx={{
                      m: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors?.linkColor,
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: colors?.textSecondary,
                      lineHeight: 1.3,
                    }}
                  >
                    Show/hide the country and neighboring countries
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeOverlay;
