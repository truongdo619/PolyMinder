import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from '../GlobalState';
import axiosInstance from '../axiosSetup';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import "../style/Toolbar.css";
import Tooltip from '@mui/material/Tooltip';

interface ToolbarProps {
  setPdfScaleValue: (value: number) => void;
  currentPage: number;
  totalPages: number;
  setIsActive: (active: boolean) => void;
}

const Toolbar = ({ setPdfScaleValue, currentPage, totalPages, setIsActive }: ToolbarProps) => {
  const globalContext = useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }

  const { documentId, setBratOutput, setDocumentId, setFileName, setUpdateId } = globalContext;

  const [zoom, setZoom] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [extractMode, setExtractMode] = useState<'ner_re' | 're_only'>('ner_re');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorSnack, setErrorSnack] = useState<string | null>(null);
  const navigate = useNavigate();

  const zoomIn = () => {
    if (zoom) {
      if (zoom < 4) {
        setPdfScaleValue(zoom + 0.1);
        setZoom(zoom + 0.1);
      }
    } else {
      setPdfScaleValue(1);
      setZoom(1);
    }
  };

  const zoomOut = () => {
    if (zoom) {
      if (zoom > 0.2) {
        setPdfScaleValue(zoom - 0.1);
        setZoom(zoom - 0.1);
      }
    } else {
      setPdfScaleValue(1);
      setZoom(1);
    }
  };

  const goToHomePage = () => {
    navigate("/documents");
  };

  const handleReloadClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    if (!isProcessing) setIsDialogOpen(false);
  };

  const handleDialogSubmit = async () => {
    setIsProcessing(true);
    setIsActive(true);

    const token = localStorage.getItem('accessToken');
    const endpoint = extractMode === 'ner_re'
      ? `/re-extract-all/${documentId}`
      : `/re-extract-relations/${documentId}`;

    try {
      const response = await axiosInstance.get(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      setFileName(response.data.filename);
      navigate('/result', {
        state: {
          highlights: response.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`
        }
      });
    } catch (error: any) {
      console.error('Error re-extracting:', error);
      setErrorSnack(error?.response?.data?.detail || 'Re-extraction failed. Please try again.');
    } finally {
      setIsActive(false);
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="Toolbar">
      <Tooltip title="Back to document list">
        <IconButton onClick={goToHomePage} className="HomeButton">
          <HomeIcon />
        </IconButton>
      </Tooltip>

      <div className="PageNumber">
        Page {currentPage} / {totalPages}
      </div>
      <div className="ZoomControls">
        <Tooltip title="Re-extract entities and relations">
          <IconButton onClick={handleReloadClick} className="ReloadButton">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom out">
          <button onClick={zoomOut}>-</button>
        </Tooltip>
        <Tooltip title="Zoom in">
          <button onClick={zoomIn}>+</button>
        </Tooltip>
        {zoom ? `${(zoom * 100).toFixed(0)}%` : "Auto"}
      </div>

      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Re-extract Entities & Relations</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Choose which models to run. This will overwrite current annotations.
          </DialogContentText>
          <RadioGroup
            value={extractMode}
            onChange={(e) => setExtractMode(e.target.value as 'ner_re' | 're_only')}
          >
            <FormControlLabel
              value="ner_re"
              control={<Radio />}
              label="Re-extract entities and relations (NER + RE)"
              disabled={isProcessing}
            />
            <FormControlLabel
              value="re_only"
              control={<Radio />}
              label="Re-extract relations only (RE)"
              disabled={isProcessing}
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isProcessing}>Cancel</Button>
          <Button
            onClick={handleDialogSubmit}
            color="primary"
            variant="contained"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isProcessing ? 'Processing…' : 'Run'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!errorSnack}
        autoHideDuration={6000}
        onClose={() => setErrorSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorSnack(null)} variant="filled">
          {errorSnack}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Toolbar;
