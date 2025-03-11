import React, { useState, useEffect, useRef, useContext } from "react";
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
import { Divider, Tooltip } from "@mui/material";
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import { styled } from '@mui/system';
import axiosInstance from './axiosSetup';
import { GlobalContext } from './GlobalState';
import { useNavigate } from 'react-router-dom';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/* ----------------------------------
 *   INTERFACES & UTIL FUNCTIONS
 * ---------------------------------- */

interface ParagraphSidebarProps {
  highlights: Array<CommentedHighlight>;
  getHighlightById: (id: string) => CommentedHighlight | undefined;
  setIsActive: (active: boolean) => void;
  setHighlights: React.Dispatch<React.SetStateAction<Array<CommentedHighlight>>>;
}

const updateHash = (highlight: Highlight) => {
  const hash = document.location.hash;
  const parts = hash.split('#');
  document.location.hash = parts[0] + "#" + parts[1] + "#highlight-" + highlight.id;
};

/**
 * Moves item at `from` index to `to` index in an array.
 * This helper is used to reorder paragraphs by up/down buttons.
 */
const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr; // Out of bounds, no change
  const newArr = [...arr];
  const item = newArr.splice(from, 1)[0];
  newArr.splice(to, 0, item);
  return newArr;
};

const ParagraphSidebar = ({
  highlights,
  getHighlightById,
  setIsActive,
  setHighlights
}: ParagraphSidebarProps) => {

  /* ----------------------------------
   *   STYLES
   * ---------------------------------- */
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

      &:focus-visible {
        outline: 0;
      }
    `
  );

  /* ----------------------------------
   *   STATE
   * ---------------------------------- */
  const [openEdit, setOpenEdit] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<CommentedHighlight | null>(null);

  // NEW: reorder dialog
  const [openReorder, setOpenReorder] = useState(false);
  // We copy the highlights to a local reorderable array
  const [reorderedHighlights, setReorderedHighlights] =
    useState<CommentedHighlight[]>(highlights);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const globalContext = useContext(GlobalContext);
  const navigateTo = useNavigate();

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }

  const { documentId, updateId, setBratOutput, setDocumentId, setUpdateId } = globalContext;


  /* ----------------------------------
   *   HANDLERS
   * ---------------------------------- */
  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
  };

  const editClick = (highlight: CommentedHighlight) => {
    setCurrentHighlight(highlight);
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setCurrentHighlight(null);
  };

  const handleSaveEdit = async () => {
    if (!currentHighlight || !textareaRef.current || !documentId) return;

    setIsActive(true);

    // Update the content of the edited highlight
    currentHighlight.content.text = textareaRef.current.value;

    // Construct data to send to backend
    const data = {
      document_id: documentId,
      update_id: updateId,
      paragraphs: highlights.map((highlight) => {
        if (highlight.id === currentHighlight?.id) {
          return textareaRef.current?.value || highlight.content.text;
        }
        return highlight.content.text;
      }),
    };

    console.log('data for edit:', data);

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
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      // The response presumably returns the new PDF format output in correct order
      setHighlights(response.data.pdf_format_output);

      // Navigate to your /result route
      navigateTo('/result', {
        state: {
          highlights: response.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`,
        },
      });
    } catch (error) {
      console.error('Error updating paragraphs:', error);
    } finally {
      setIsActive(false);
      handleCloseEdit();
    }
  };

  // Open reorder dialog
  const handleOpenReorder = () => {
    // Make a fresh copy of current highlights
    setReorderedHighlights([...highlights]);
    setOpenReorder(true);
  };

  // Close reorder dialog
  const handleCloseReorder = () => {
    setOpenReorder(false);
  };

  // When user clicks up/down, reorder the array
  const moveHighlightUp = (index: number) => {
    const newOrder = moveItem(reorderedHighlights, index, index - 1);
    setReorderedHighlights(newOrder);
  };

  const moveHighlightDown = (index: number) => {
    const newOrder = moveItem(reorderedHighlights, index, index + 1);
    setReorderedHighlights(newOrder);
  };

  // Save new order to backend
  const handleSaveReorder = async () => {
    if (!documentId) return;

    setIsActive(true);

    // Extract the text from each highlight in the new order
    const newParagraphsOrder = reorderedHighlights.map((h) => h.para_id);

    const data = {
      document_id: documentId,
      update_id: updateId,
      paragraphs: newParagraphsOrder, // new array in new order
    };

    console.log('data for reorder:', data);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/reorder-paragraph`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Paragraphs reordered successfully:', response.data);
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);

      // Optional: navigate to a result page if needed
      // or you can just stay on the same page but reflect the new order
      navigateTo('/result', {
        state: {
          highlights: response.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`,
        },
      });
    } catch (error) {
      console.error('Error reordering paragraphs:', error);
    } finally {
      setIsActive(false);
      handleCloseReorder();
    }
  };

  // Scroll to highlight if hash found
  useEffect(() => {
    const parts = document.location.hash.split("#");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const highlightElement = document.getElementById(lastPart);
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlights]); // If highlights change, re-check

  return (
    <div className="sidebar" style={{ width: "20vw", maxWidth: "1000px" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          Found <span className="total_entities_span">{highlights.length}</span> paragraphs in this document.
        </h2>

        <p style={{ fontSize: "15px", marginTop: "10px" }}>
            📝 If the paragraphs seem out of order, you can{" "}
            <span
              style={{
                color: "#007bff",
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              onClick={handleOpenReorder}
            >
              revise the order
            </span>
            .
          </p>
      </div>

      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "10px" }}>
        {highlights.map((highlight, index) => {
          const isSelected = document.location.hash.split("#").slice(-1)[0] === `highlight-${highlight.id}`;
          return (
            <li
              key={highlight.id}
              id={`highlight-${highlight.id}`}
              className={`sidebar__highlight ${isSelected ? 'sidebar__highlight--selected' : ''}`}
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

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  alignItems: 'center',
                  marginTop: '1rem'
                }}
              >
                <IconButton
                  color="primary"
                  aria-label="edit paragraph"
                  onClick={(e) => {
                    e.stopPropagation();
                    editClick(highlight);
                  }}
                >
                  <EditNoteIcon />
                </IconButton>
                <div className="highlight__location" style={{ marginLeft: 'auto' }}>
                  Page {highlight.position.boundingRect.pageNumber}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ----------------------------------------
       *  EDIT TEXT DIALOG
       * ---------------------------------------- */}
      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="md">
        <DialogTitle sx={{ textAlign: "center" }}>
          Edit Text - Paragraph {currentHighlight ? currentHighlight.para_id + 1 : ''}
        </DialogTitle>
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
          <Button onClick={handleCloseEdit} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} color="primary" variant="contained">
            Save & Reload
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------------------------------
       *  REORDER DIALOG
       * ---------------------------------------- */}
      <Dialog open={openReorder} onClose={handleCloseReorder} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>Reorder Paragraphs</DialogTitle>
        <Divider />
        <DialogContent dividers>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {reorderedHighlights.map((highlight, index) => (
              <Tooltip key={highlight.id} title={highlight.content.text} arrow>
                <li
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#e0e0e0"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#f9f9f9"}
                >
                  <div>
                    <strong>Paragraph {highlight.para_id + 1}</strong>:
                    {" "}
                    {highlight.content.text.slice(0, 80)}...
                  </div>
                  <div>
                    <IconButton
                      disabled={index === 0} // can't go up if first item
                      onClick={() => moveHighlightUp(index)}
                    >
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton
                      disabled={index === reorderedHighlights.length - 1} // can't go down if last item
                      onClick={() => moveHighlightDown(index)}
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                  </div>
                </li>
              </Tooltip>
            ))}
          </ul>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleCloseReorder} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSaveReorder} color="primary" variant="contained">
            Save & Reload
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ParagraphSidebar;
