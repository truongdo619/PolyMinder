import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ResultComponent from './ResultComponent';
import DragAndDrop from './PDFUploadComponent';
import { GlobalProvider } from './GlobalState';
import HomePage from './HomePage/HomePage';
import DocsPage from './DocsPage/DocsPage';
import SignInPage from './SignInPage/SignInPage';
import SignUpPage from './SignUpPage/SignUpPage';
import DocumentListPage from './DocumentListPage/DocumentListPage';

const App = () => {
  
  const token = localStorage.getItem('accessToken');
  // Set deault state to if user is authenticated or not
  const [isAuthenticated, setAuthenticated] = useState(token ? true : false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    };

    // Initial check on mount
    checkAuth();

    // Set up a listener for changes to localStorage
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/documents"
            element={isAuthenticated ? <DocumentListPage /> : <Navigate to="/signin" />}
          />
          <Route
            path="/upload"
            element={isAuthenticated ? <DragAndDrop /> : <Navigate to="/signin" />}
          />
          <Route
            path="/result"
            element={isAuthenticated ? <ResultComponent /> : <Navigate to="/signin" />}
          />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </Router>
    </GlobalProvider>
  );
};

export default App;
