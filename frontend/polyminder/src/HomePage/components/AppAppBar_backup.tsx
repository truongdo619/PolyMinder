import * as React from 'react';
import { PaletteMode } from '@mui/material';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';  // User Icon
import Tooltip from '@mui/material/Tooltip'; // Import Tooltip component
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { logout } from '../../authenticate';
import Snackbar from '@mui/material/Snackbar'; // For notification
import Alert from '@mui/material/Alert'; // For styled alert messages

const logoStyle = {
  width: '205px',
  height: 'auto',
  cursor: 'pointer',
  paddingLeft: '20px'
};

interface AppAppBarProps {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

function AppAppBar({ mode, toggleColorMode }: AppAppBarProps) {
  const [open, setOpen] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false); // For notification state
  const navigate = useNavigate();

  const [isAuthenticated, setAuthenticated] = React.useState(false);
  const [username, setUsername] = React.useState<string | null>(null); // State to store username

  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUsername = localStorage.getItem('username'); // Assuming username is stored in localStorage
    if (token) {
      setAuthenticated(true);
      setUsername(storedUsername); // Set the username when authenticated
    }
  }, []);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    navigate('/signin');
  };

  // Function to handle navigation to /documents
  const handleDocumentsNavigation = () => {
    // console.log('isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      // If not authenticated, show the notification and redirect to sign-in
      setShowNotification(true);
      setTimeout(() => {
        navigate('/signin'); // Redirect to sign-in page after 3 seconds
      }, 1000); // 3-second delay before redirecting
    } else {
      navigate('/documents');
      }
    };

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{
          boxShadow: 0,
          bgcolor: 'transparent',
          backgroundImage: 'none',
          mt: 2,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            variant="regular"
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              borderRadius: '999px',
              bgcolor:
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.4)'
                  : 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(24px)',
              maxHeight: 40,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                theme.palette.mode === 'light'
                  ? `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`
                  : '0 0 1px rgba(2, 31, 59, 0.7), 1px 1.5px 2px -1px rgba(2, 31, 59, 0.65), 4px 4px 12px -2.5px rgba(2, 31, 59, 0.65)',
            })}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                ml: '-18px',
                px: 0,
              }}
            >
              <img
                src={logo}
                style={logoStyle}
                alt="logo of sitemark"
                onClick={() => navigate('/')}
              />

              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <MenuItem onClick={handleDocumentsNavigation} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">
                    Documents
                  </Typography>
                </MenuItem>

                <MenuItem onClick={() => navigate('/docs')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">
                    Manual
                  </Typography>
                </MenuItem>

                <MenuItem onClick={() => window.open('https://youtu.be/Q6RR7kQHSvU', '_blank')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">
                    Video Demo
                  </Typography>
                </MenuItem>

                <MenuItem onClick={() => navigate('/home')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">
                    FAQ
                  </Typography>
                </MenuItem>

              </Box>

            </Box>
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 0.5,
                alignItems: 'center',
              }}
            >
              {isAuthenticated ? (
                <>
                  <Tooltip title={username || 'User'}>
                    <span>
                      <Button color="primary" variant="text" size="small" onClick={() => navigate('/profile')}>
                        <AccountCircle />
                      </Button>
                    </span>
                  </Tooltip>
                  <Button color="primary" variant="outlined" size="small" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button color="primary" variant="text" size="small" onClick={() => navigate('/signin')}>
                    Sign in
                  </Button>
                  <Button color="primary" variant="contained" size="small" onClick={() => navigate('/signup')}>
                    Sign up
                  </Button>
                </>
              )}
            </Box>
            <Box sx={{ display: { sm: '', md: 'none' } }}>
              <Button
                variant="text"
                color="primary"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ minWidth: '30px', p: '4px' }}
              >
                <MenuIcon />
              </Button>
              <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                <Box
                  sx={{
                    minWidth: '60dvw',
                    p: 2,
                    backgroundColor: 'background.paper',
                    flexGrow: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'end',
                      flexGrow: 1,
                    }}
                  >
                  </Box>
                  <MenuItem onClick={handleDocumentsNavigation}>
                    Documents
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/docs')}>
                    Manual
                  </MenuItem>
                  <MenuItem onClick={() => window.open('https://youtu.be/Q6RR7kQHSvU', '_blank')}>
                    Video Demo
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/home')}>
                    FAQ
                  </MenuItem>
                  <Divider />

                  {isAuthenticated ? (
                    <>
                      <MenuItem>
                        <Button color="primary" variant="text" onClick={() => navigate('/profile')} sx={{ width: '100%' }}>
                          <AccountCircle /> {/* Replaced Profile text with User Icon */}
                        </Button>
                      </MenuItem>
                      <MenuItem>
                        <Button color="primary" variant="outlined" onClick={() => {
                          handleLogout();
                          navigate('/signin');
                        }} sx={{ width: '100%' }}>
                          Logout
                        </Button>
                      </MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem>
                        <Button color="primary" variant="contained" onClick={() => navigate('/signup')} sx={{ width: '100%' }}>
                          Sign up
                        </Button>
                      </MenuItem>
                      <MenuItem>
                        <Button color="primary" variant="outlined" onClick={() => navigate('/signin')} sx={{ width: '100%' }}>
                          Sign in
                        </Button>
                      </MenuItem>
                    </>
                  )}
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Snackbar
        open={showNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
      >
        <Alert severity="warning" sx={{ width: '100%' }}>
          You need to sign in to access the Documents page.
        </Alert>
      </Snackbar>
    </div>
  );
}

export default AppAppBar;
