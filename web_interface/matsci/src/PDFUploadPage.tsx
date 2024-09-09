// src/PDFUploadComponent.tsx
import React, { useState, useContext } from 'react';
import axiosInstance from './axiosSetup';
import LoadingOverlay from 'react-loading-overlay-ts';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from "react-drag-drop-files";
import { Typography, Container, Avatar, Box } from '@mui/material';
import { GlobalContext } from './GlobalState';
import "./style/PDFUpload.css";
import logo from './assets/images/logos_matsci-ie.jpg';

const fileTypes = ["PDF"];

function DragAndDrop() {
  const [isActive, setIsActive] = useState(false);
  const navigateTo = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const globalContext = useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }

  const { setBratOutput, setDocumentId, setFileName } = globalContext;

  const handleChange = async (file: File) => {
    setFile(file);
    setIsActive(true);

    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/process-pdf-v3/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      setIsActive(false);
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id); // Store documentId in GlobalState
      setFileName(file.name);
      navigateTo('/result', { 
        state: { 
          highlights: response.data.pdf_format_output, 
          url: `${import.meta.env.VITE_BACKEND_URL}/statics/${file.name}` 
        }
      });
    } catch (error) {
      setIsActive(false);
      console.error('Error uploading file:', error);
    }
  };

  return (
    <Container>
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" marginBottom={2} style={{ marginTop: "5vh" }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Avatar src={logo} alt="Logo" sx={{ width: 56, height: 56, marginRight: 2 }} />
          <Typography variant="h4" component="h1" align="center">
            Material Science - Information Extraction
          </Typography>
        </Box>
        <Typography variant="h6" component="h1" gutterBottom align="center">
          Upload a PDF file to extract information
        </Typography>
      </Box>
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
            zIndex: 9999, // Ensure it covers all elements
          })
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "4vh" }}>
          <FileUploader 
            handleChange={handleChange} 
            name="file" 
            types={fileTypes} 
            classes="custom-fileUploader" 
          />
        </div>
      </LoadingOverlay>
    </Container>
  );
}

export default DragAndDrop;
