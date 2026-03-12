import React, { useState, useEffect, useRef, useContext } from "react";
import type { Highlight } from "../react-pdf-highlighter-extended";
import "../style/Sidebar.css";
import { CommentedHighlight } from "../types";
import "../pdf_highlighter/style/TextHighlight.css";
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
import axiosInstance from '../axiosSetup';
import { GlobalContext } from '../GlobalState';
import { useNavigate } from 'react-router-dom';

// Import from react-beautiful-dnd
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
// Import our custom StrictModeDroppable
import { StrictModeDroppable } from "./StrictModeDroppable";

interface LLMSidebarProps {
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

// Helper to reorder list items
const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const LLMSidebar = ({
  highlights,
  getHighlightById,
  setIsActive,
  setHighlights
}: LLMSidebarProps) => {

  /* ----------------------------
   *    Styled Textarea
   * ---------------------------- */

  // console.log("llm", highlights)

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

  /* ----------------------------
   *    State
   * ---------------------------- */
  const [openEdit, setOpenEdit] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<CommentedHighlight | null>(null);

  // Reordering
  const [openReorder, setOpenReorder] = useState(false);
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

  // Highlight Click
  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
  };

  // Open edit dialog
  const editClick = (highlight: CommentedHighlight) => {
    setCurrentHighlight(highlight);
    setOpenEdit(true);
  };

  // Close edit dialog
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setCurrentHighlight(null);
  };

  // Save changes to a single paragraph (Edit)
  const handleSaveEdit = async () => {
    if (!currentHighlight || !textareaRef.current || !documentId) return;

    setIsActive(true);

    // Update the content of the edited highlight
    currentHighlight.content.text = textareaRef.current.value;

    // Build data to send to backend
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

      // console.log('Paragraphs updated successfully:', response.data);
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
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

  /* --------------------------------
   *  REORDER DIALOG & DRAG-AND-DROP
   * -------------------------------- */

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

  // Final event after drag finishes
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const newOrder = reorder(
      reorderedHighlights,
      result.source.index,
      result.destination.index
    );
    setReorderedHighlights(newOrder);
  };

  // Save newly reordered paragraphs to backend
  const handleSaveReorder = async () => {
    if (!documentId) return;

    setIsActive(true);

    const newParagraphsOrder = reorderedHighlights.map((h) => h.para_id);

    const data = {
      document_id: documentId,
      update_id: updateId,
      paragraphs: newParagraphsOrder,
    };

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

      // console.log('Paragraphs reordered successfully:', response.data);
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);

      // Navigate to a result page (or stay in place if you want)
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
  }, [highlights]);

  return (
    <div className="sidebar" style={{ width: "20vw", maxWidth: "1000px" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          LLM Mode
        </h2>

        <div
          style={{
            backgroundColor: "#e8f4fd",
            border: "1px solid #b3d9f2",
            borderRadius: "8px",
            padding: "1rem",
            marginTop: "10px",
          }}
        >
          <p style={{ fontSize: "15px", margin: 0, color: "#1a5276" }}>
            🤖 <strong>Click on an LLM box</strong> on the PDF to run LLM extraction on that paragraph.
          </p>
          <p style={{ fontSize: "13px", marginTop: "8px", marginBottom: 0, color: "#5d6d7e" }}>
            Each highlighted block represents a paragraph. Click any block to open the LLM dialog and configure your extraction.
          </p>
        </div>

        <p style={{ fontSize: "14px", marginTop: "1rem", color: "#6c757d" }}>
          Found <span className="total_entities_span">{highlights.filter(h => h.comment === "BLOCK_LLM").length}</span> paragraphs
          {highlights.filter(h => h.comment !== "BLOCK_LLM").length > 0 && (
            <> and <span className="total_entities_span">{highlights.filter(h => h.comment !== "BLOCK_LLM").length}</span> extracted entities in this document.</>
          )}
        </p>
      </div>

      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "10px" }}>
        {highlights.map((highlight) => {
          const isSelected =
            document.location.hash.split("#").slice(-1)[0] === `highlight-${highlight.id}`;
          const isParagraph = highlight.comment === "BLOCK_LLM";

          return (
            <li
              key={highlight.id}
              id={`highlight-${highlight.id}`}
              className={`sidebar__highlight ${isSelected ? 'sidebar__highlight--selected' : ''}`}
              onClick={() => handleHighlightClick(highlight)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                ...(!isParagraph ? { marginLeft: '1rem', borderLeft: '3px solid #ccc', paddingLeft: '0.5rem' } : {}),
              }}
            >
              {isParagraph ? (
                /* ── Paragraph item ── */
                <>
                  <div style={{ flex: 1, width: '100%' }}>
                    <div className="highlight_item_header">
                      <p className="entity_point BLOCK_LLM">&nbsp;&nbsp;</p>
                      <strong>Paragraph {(highlight.para_id ?? 0) + 1}</strong>
                    </div>
                    {highlight.content.text && (
                      <blockquote>
                        {`${highlight.content.text.slice(0, 90).trim()} ...`}
                      </blockquote>
                    )}

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginTop: "0.3rem",
                        fontStyle: "italic",
                      }}
                    >
                      🤖 Click to run LLM
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      alignItems: 'center',
                      marginTop: '0.5rem'
                    }}
                  >
                    <div className="highlight__location" style={{ marginLeft: 'auto' }}>
                      Page {highlight.position.boundingRect.pageNumber}
                    </div>
                  </div>
                </>
              ) : (
                /* ── Entity item (Sidebar-style) ── */
                <>
                  <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
                    <div className="highlight_item_header">
                      <p className={"entity_point " + highlight.comment}>&nbsp;&nbsp;</p>
                      <strong>{highlight.comment}</strong>
                    </div>
                    {highlight.content.text && (
                      <blockquote style={{ fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {`${highlight.content.text.slice(0, 60).trim()}`}
                      </blockquote>
                    )}
                    {highlight.relations && highlight.relations.length > 0 && (
                      <ul style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {highlight.relations.map((relation: any, idx: number) => (
                          <li key={idx}>
                            <i style={{ marginLeft: "0rem" }}>{relation.type}</i>
                            <br />
                            <strong style={{ marginLeft: "1rem" }}>
                              {relation.arg_type}: {relation.arg_text}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      alignItems: 'center',
                      marginTop: '0.5rem'
                    }}
                  >
                    <div className="highlight__location" style={{ marginLeft: 'auto' }}>
                      Page {highlight.position.boundingRect.pageNumber}
                    </div>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>


    </div>
  );
};

export default LLMSidebar;
