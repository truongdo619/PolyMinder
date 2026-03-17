import React, { useState } from 'react';
import { PaletteMode } from '@mui/material';
import {
  ThemeProvider,
  createTheme,
} from '@mui/material/styles';
import {
  CssBaseline,
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';
import LoadingOverlay from 'react-loading-overlay-ts';

import getLPTheme from '../lib/getLPTheme';
import AppAppBar from '../HomePage/components/AppAppBar';
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

export default function ContactSupportPage() {
  const [mode, setMode] = useState<PaletteMode>('light');
  const [showCustomTheme, _setShowCustomTheme] = useState(true);

  const LPtheme = createTheme(getLPTheme(mode));
  const defaultTheme = createTheme({ palette: { mode } });

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error'>('success');

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActive(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_PDF_BACKEND_URL}/contact-support`, {
        name,
        email,
        content: message,
      });
      
      if (response.data.msg === 'done') {
        setNotification('Thank you! Your message has been sent.');
        setNotificationSeverity('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      console.error('Error sending support message:', error);
      setNotification('Oops! Something went wrong. Please try again.');
      setNotificationSeverity('error');
    }
    setIsActive(false);
    setOpenSnackbar(true);
  };

  return (
    <LoadingOverlay
      active={isActive}
      spinner
      text='Processing ...'
      styles={{
        overlay: (base) => ({
          ...base,
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          zIndex: 9999,
        }),
      }}
    >
      <ThemeProvider theme={showCustomTheme ? LPtheme : defaultTheme}>
        <CssBaseline />
        <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />

          <Box
            sx={{
              bgcolor: 'background.default',
              color: 'text.primary',
              minHeight: '100vh',
              py: 4,
              mt: 12,
            }}
          >
            <Container maxWidth="sm">
              <Typography variant="h4" gutterBottom>
                How can we help?
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", color: '#6b7280', mb: 4, textAlign: 'center' }}>
                Have questions or need assistance? Send us a message and we'll get back to you shortly.
              </Typography>

              <Box 
                component="form" 
                onSubmit={handleSubmit}
                sx={{
                  backgroundColor: mode === 'light' ? '#ffffff' : '#111827',
                  p: { xs: 3, sm: 5 },
                  borderRadius: '16px',
                  boxShadow: mode === 'light' 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 24px 48px -12px rgba(0, 0, 0, 0.1)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 24px 48px -12px rgba(0, 0, 0, 0.8)',
                  border: mode === 'light' ? '1px solid #f3f4f6' : '1px solid #1f2937',
                  '& .MuiOutlinedInput-root': {
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: '8px',
                    backgroundColor: mode === 'light' ? '#f9fafb' : '#1f2937',
                    '& fieldset': {
                      borderColor: mode === 'light' ? '#e5e7eb' : '#374151',
                    },
                    '&:hover fieldset': {
                      borderColor: mode === 'light' ? '#d1d5db' : '#4b5563',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: mode === 'light' ? '#9ca3af' : '#6b7280',
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Inter', sans-serif",
                    color: mode === 'light' ? '#6b7280' : '#9ca3af',
                  }
                }}
              >
                <TextField
                  label="Your Name"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <TextField
                  label="Your Email Address"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <TextField
                  label="How can we help?"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button 
                    type="submit" 
                    variant="contained"
                    fullWidth
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      py: 1.5,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      backgroundColor: mode === 'light' ? '#111827' : '#f9fafb',
                      color: mode === 'light' ? '#ffffff' : '#111827',
                      boxShadow: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: mode === 'light' ? '#374151' : '#e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }
                    }}
                  >
                    Send Message
                  </Button>
                </Box>
              </Box>
            </Container>
          </Box>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={notificationSeverity}
            sx={{ width: '100%' }}
          >
            {notification}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </LoadingOverlay>
  );
}
