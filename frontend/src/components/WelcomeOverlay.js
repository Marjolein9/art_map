/**
 * WelcomeOverlay Component - Simple mode selection dialog
 *
 * Shows initial welcome screen with Quiz Mode and Explore Mode buttons
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import muiTheme from '../theme/muiTheme';

const WelcomeOverlay = ({ onStartQuiz, onExplore }) => {
  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: 4
          }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Welcome to Art Map
            </Typography>

            <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mb: 2 }}>
              Choose how you'd like to explore art from around the world
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '300px' }}>
              <Button
                variant="contained"
                size="large"
                onClick={onStartQuiz}
                sx={{ py: 2 }}
              >
                Quiz Mode
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={onExplore}
                sx={{ py: 2 }}
              >
                Explore Mode
              </Button>
            </Box>

            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
              You can toggle between modes and adjust settings anytime
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default WelcomeOverlay;
