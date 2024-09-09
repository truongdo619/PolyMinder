// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ResultComponent from './ResultPage';
import DragAndDrop from './PDFUploadPage';
import { GlobalProvider } from './GlobalState';
import { authenticate } from './authenticate';
import LoadingOverlay from 'react-loading-overlay-ts';

const App = () => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const authInProgress = useRef(false); // Ref to track if authentication is in progress

  useEffect(() => {
    // const token = localStorage.getItem('accessToken');
    // if (token) {
    //   setAuthenticated(true);
    //   setLoading(false);
    // } else {
      if (!authInProgress.current) {
        authInProgress.current = true; // Set the ref to true to indicate the authentication process has started

        const login = async () => {
          const isAuth = await authenticate('admin', '1');
          setAuthenticated(isAuth);
          setLoading(false);
        };
        login();
      }
    // }
  }, []);

  if (loading) {
    return (
      <LoadingOverlay
        active={loading}
        spinner
        text='Loading ...'
        styles={{
          overlay: (base) => ({
            ...base,
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            top: 0,
            left: 0,
            zIndex: 9999, // Ensure it covers all elements
          }),
        }}
      />
    );
  }

  return (
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DragAndDrop />} />
          <Route
            path="/result"
            element={isAuthenticated ? <ResultComponent /> : <Navigate to="/" />}
          />
        </Routes>
      </Router>
    </GlobalProvider>
  );
};

export default App;
