import React, { Suspense, useContext, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { GlobalProvider } from './GlobalState';
import { AuthProvider, AuthContext } from './AuthContext';

import HomePage from './HomePage/HomePage';
import SignInPage from './SignInPage/SignInPage';
import ForgotPasswordPage from './SignInPage/ForgotPasswordPage';
import ResetPasswordPage from './SignInPage/ResetPasswordPage';
import SignUpPage from './SignUpPage/SignUpPage';
import ProfilePage from './ProfilePage/ProfilePage';
import ContactSupportPage from './ContactSupportPage/ContactSupportPage';

import setting from '../settings.json';
import { injectDynamicCSS } from './injectStyles';
import './style/Guidance.css';
import { GuidanceProvider } from './components/GuidanceSystem';

const DocumentListPage = React.lazy(() => import('./DocumentListPage/DocumentListPage'));
const ResultComponent = React.lazy(() => import('./components/ResultComponent'));
const DocsPage = React.lazy(() => import('./DocsPage/DocsPage'));

const PageFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/signin" />;
};

const App = () => {
  useEffect(() => {
    injectDynamicCSS(setting);
  }, []);

  return (
    <GuidanceProvider>
    <GlobalProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<ContactSupportPage />} />

            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/result"
              element={
                <ProtectedRoute>
                  <ResultComponent />
                </ProtectedRoute>
              }
            />

            {/* Redirect /docs routes */}
            <Route path="/docs" element={<Navigate to="/docs/v3.3/getting-started/overview" replace />} />
            <Route path="/docs/:version" element={<Navigate to="getting-started/overview" replace />} />
            <Route path="/docs/:version/:section" element={<Navigate to="overview" replace />} />
            <Route path="/docs/:version/:section/:page" element={<DocsPage />} />
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </GlobalProvider>
    </GuidanceProvider>
  );
};

export default App;
