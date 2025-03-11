// src/PDFUploadComponent.tsx
import React, { useState, useContext } from 'react';
import axiosInstance from './axiosSetup';
import LoadingOverlay from 'react-loading-overlay-ts';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from "react-drag-drop-files";
import { Typography, Container, Avatar, Box, Button, Grid } from '@mui/material';
import { GlobalContext } from './GlobalState';
import "./style/PDFUpload.css";
// import logo from './assets/images/logos_matsci-ie.jpg';
import logo from './assets/images/logos_matsci-ie.png';

const fileTypes = ["PDF"];

function DragAndDrop() {
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const globalContext = useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }

  const { setBratOutput, setDocumentId, setFileName, setUpdateId } = globalContext;

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
      setUpdateId(response.data.update_id);
      setFileName(file.name);
      navigate('/result', { 
        state: { 
          highlights: response.data.pdf_format_output, 
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${file.name}` 
        }
      });
    } catch (error) {
      setIsActive(false);
      console.error('Error uploading file:', error);
    }
  };

  const handleSamplePDF = async (pdfPath: string) => {
    setIsActive(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(pdfPath);
      const blob = await response.blob();
      const file = new File([blob], pdfPath.split('/').pop() || './pdfs/yoonessi2011.pdf', { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/process-pdf-v3/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsActive(false);
      setBratOutput(uploadResponse.data.brat_format_output);
      setDocumentId(uploadResponse.data.document_id);
      setFileName(file.name);
      navigate('/result', { 
        state: { 
          highlights: uploadResponse.data.pdf_format_output, 
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${file.name}` 
        }
      });
    } catch (error) {
      setIsActive(false);
      console.error('Error processing sample PDF:', error);
    }
  };

  return (
    <Container>
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" marginBottom={2} style={{ marginTop: "5vh" }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Avatar src={logo} alt="Logo" sx={{ width: 56, height: 56, marginRight: 2, borderRadius: "0" }} />
          <Typography variant="h4" component="h1" align="center">
            Material Science Information Extraction
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
      <Grid container spacing={2} justifyContent="center" style={{ marginTop: "4vh" }}>
        <Grid item>
          <FileUploader 
            handleChange={handleChange} 
            name="file" 
            types={fileTypes} 
            classes="custom-fileUploader" 
          />
        </Grid>
        </Grid>
        <Grid container spacing={2} justifyContent="center" style={{ marginTop: "1vh" }}>
          <Grid item>
            <Button variant="contained" onClick={() => handleSamplePDF("./pdfs/yoonessi2011.pdf")}>
              Example 1
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={() => handleSamplePDF("./pdfs/namazi2011.pdf")}>
              Example 2
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={() => handleSamplePDF("./pdfs/S0032386108001122.pdf")}>
              Example 3
            </Button>
          </Grid>
        </Grid>
      </LoadingOverlay>
    </Container>
  );
}

export default DragAndDrop;
