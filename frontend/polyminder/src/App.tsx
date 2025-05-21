import React, { useContext } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ResultComponent from './ResultComponent';
// import DragAndDrop from './PDFUploadComponent';
import { GlobalProvider } from './GlobalState';
import HomePage from './HomePage/HomePage';
import DocsPage from './DocsPage/DocsPage';
import SignInPage from './SignInPage/SignInPage';
import ForgotPasswordPage from './SignInPage/ForgotPasswordPage';
import ResetPasswordPage from './SignInPage/ResetPasswordPage';
import SignUpPage from './SignUpPage/SignUpPage';
import ProfilePage from './ProfilePage/ProfilePage';
import DocumentListPage from './DocumentListPage/DocumentListPage';
import ContactSupportPage from './ContactSupportPage/ContactSupportPage';
import { AuthProvider, AuthContext } from './AuthContext'; // Import AuthContext

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/signin" />;
};

const App = () => {
  return (
    <GlobalProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<ContactSupportPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentListPage />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <DragAndDrop />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/result"
              element={
                <ProtectedRoute>
                  <ResultComponent />
                </ProtectedRoute>
              }
            />
            {/* <Route path="/docs" element={<DocsPage />} /> */}


            {/* Redirect plain /docs → latest getting‑started */}
            <Route path="/docs" element={<Navigate to="/docs/v3.1/getting-started/overview" replace />} />
            <Route path="/docs/:version" element={<Navigate to="getting-started/overview" replace />} />
            <Route path="/docs/:version/:section" element={<Navigate to="overview" replace />} />

            {/* main docs route */}
            <Route path="/docs/:version/:section/:page" element={<DocsPage />} />

            
          </Routes>
        </Router>
      </AuthProvider>
    </GlobalProvider>
  );
};

export default App;
