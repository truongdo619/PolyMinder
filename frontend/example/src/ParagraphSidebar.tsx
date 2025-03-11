import React, { useState, useEffect, useRef } from "react";
import type { Highlight } from "./react-pdf-highlighter-extended";
import "./style/Sidebar.css";
import { CommentedHighlight } from "./types";
import "../../src/style/TextHighlight.css";
import EditNoteIcon from '@mui/icons-material/EditNote';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { Divider } from "@mui/material";
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import { styled } from '@mui/system';
import axiosInstance from './axiosSetup';
import { GlobalContext } from './GlobalState';
import { useNavigate } from 'react-router-dom';

interface ParagraphSidebarProps {
  highlights: Array<CommentedHighlight>;
  getHighlightById: (id: string) => CommentedHighlight | undefined;
  setIsActive: (active: boolean) => void;
  setHighlights: React.Dispatch<React.SetStateAction<Array<CommentedHighlight>>>; // Add this line
}


const updateHash = (highlight: Highlight) => {
  const hash = document.location.hash;
  const parts = hash.split('#');
  document.location.hash = parts[0] + "#" + parts[1] + "#highlight-" + highlight.id;
};

const ParagraphSidebar = ({ highlights, getHighlightById, setIsActive, setHighlights }: ParagraphSidebarProps) => {
  const blue = {
    100: '#DAECFF',
    200: '#b6daff',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    900: '#003A75',
  };

  const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
  };

  const Textarea = styled(BaseTextareaAutosize)(
    ({ theme }) => `
    box-sizing: border-box;
    width: 50rem;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 8px 12px;
    border-radius: 8px;
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
    background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    box-shadow: 0px 2px 2px ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};

    &:hover {
      border-color: ${blue[400]};
    }

    &:focus {
      border-color: ${blue[400]};
      box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
    }

    // firefox
    &:focus-visible {
      outline: 0;
    }
  `,
  );

  const [open, setOpen] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<CommentedHighlight | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const globalContext = React.useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }

  const { documentId } = globalContext;

  const { setBratOutput, setDocumentId, setUpdateId } = globalContext;

  const navigateTo = useNavigate();

  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
  };

  const editClick = (highlight: CommentedHighlight) => {
    setCurrentHighlight(highlight);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentHighlight(null);
  };

  const handleSave = async () => {
    console.log('currentHighlight:', currentHighlight);
    console.log('textareaRef:', textareaRef.current);
    console.log('documentId:', documentId);
    if (currentHighlight && textareaRef.current && documentId) {
        setIsActive(true);

        // Update the content of the edited highlight
        currentHighlight.content.text = textareaRef.current.value;

        // Create a data object to hold documentId and paragraph texts
        const data = {
            document_id: documentId,
            paragraphs: highlights.map((highlight) => {
              if (highlight.id === currentHighlight?.id) {
                  return textareaRef.current?.value || highlight.content.text;
              }
              return highlight.content.text;
            }),
        };

        console.log('data:', data);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axiosInstance.post(
                `${import.meta.env.VITE_BACKEND_URL}/edit-paragraph`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log('Paragraphs updated successfully:', response.data);
            setBratOutput(response.data.brat_format_output);
            setDocumentId(response.data.document_id); // Store documentId in GlobalState
            setUpdateId(response.data.update_id); // Store updateId in GlobalState
            setHighlights(response.data.pdf_format_output);
            navigateTo('/result', { 
              state: { 
                highlights: response.data.pdf_format_output, 
                url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`
              }
            });
        } catch (error) {
            console.error('Error updating paragraphs:', error);
        } finally {
            setIsActive(false);
            handleClose();
        }
    }
};

  useEffect(() => {
    const hash = document.location.hash.split("#")[document.location.hash.split("#").length - 1]
    if (hash) {
      const highlightElement = document.getElementById(hash);
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
      } 
    }
  }, []); // Ensuring it runs again if highlights change

  return (
    <div className="sidebar" style={{ width: "20vw", maxWidth: "1000px" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          Found <span className="total_entities_span">{highlights.length}</span> paragraphs in this document.
        </h2>
      </div>

      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "10px" }}>
        {highlights.map((highlight, index) => (
          <li
            key={index}
            id={`highlight-${highlight.id}`}      
            className={`sidebar__highlight ${document.location.hash.split("#")[document.location.hash.split("#").length - 1] === `highlight-${highlight.id}` ? 'sidebar__highlight--selected' : ''}`}
            onClick={() => handleHighlightClick(highlight)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <div style={{ flex: 1, width: '100%' }}>
              <div className="highlight_item_header">
                <p className={"entity_point " + highlight.comment}>&nbsp;&nbsp;</p>
                <strong>{highlight.comment + " " + (highlight.para_id + 1)}</strong>
              </div>
              {highlight.content.text && (
                <blockquote>
                  {`${highlight.content.text.slice(0, 90).trim()} ...`}
                </blockquote>
              )}
              {highlight.content.image && (
                <div className="highlight__image__container" style={{ marginTop: "0.5rem" }}>
                  <img
                    src={highlight.content.image}
                    alt={"Screenshot"}
                    className="highlight__image"
                  />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '1.0rem' }}>
              <IconButton color="primary" aria-label="edit paragraph" onClick={() => editClick(highlight)}>
                <EditNoteIcon />
              </IconButton>
              <div className="highlight__location" style={{ marginLeft: 'auto' }}>
                Page {highlight.position.boundingRect.pageNumber}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <DialogTitle sx={{ textAlign:"center" }}>Edit Text - Paragraph {currentHighlight ? currentHighlight.para_id + 1 : ''}</DialogTitle>
        <Divider />
        <DialogContent>
          <Textarea
            aria-label="maximum height"
            defaultValue={currentHighlight ? currentHighlight.content.text : ''}
            ref={textareaRef}
          />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save & Reload
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ParagraphSidebar;
