import React, { useContext } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ResultComponent from './ResultComponent';
import DragAndDrop from './PDFUploadComponent';
import { GlobalProvider } from './GlobalState';
import HomePage from './HomePage/HomePage';
import DocsPage from './DocsPage/DocsPage';
import SignInPage from './SignInPage/SignInPage';
import SignUpPage from './SignUpPage/SignUpPage';
import DocumentListPage from './DocumentListPage/DocumentListPage';
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
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <DragAndDrop />
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
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GlobalProvider>
  );
};

export default App;
