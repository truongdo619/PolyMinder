import React, { useEffect, useState, useContext } from "react";
import type { Highlight } from "./react-pdf-highlighter-extended";
import "./style/Sidebar.css";
import { CommentedHighlight } from "./types";
import "../../src/style/TextHighlight.css";
import EditNoteIcon from '@mui/icons-material/EditNote';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogContentText from '@mui/material/DialogContentText';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Tooltip from '@mui/material/Tooltip';
import SplitButton from './SplitButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditedEntityComponent from './EditedEntityComponent';
import { GlobalContext } from './GlobalState';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosSetup';
import Pagination from '@mui/material/Pagination';
import { Box, List, ListItem, ListItemIcon, ListItemText, Checkbox, Typography } from '@mui/material';

interface EventSidebarProps {
  highlights: Array<CommentedHighlight>;
  getHighlightById: (id: string) => CommentedHighlight | undefined;
  setIsActive: (active: boolean) => void;
  setHighlights: React.Dispatch<React.SetStateAction<Array<CommentedHighlight>>>; // Add this line
  selectedMode: string;
  paraHighlights: Array<CommentedHighlight>; // <-- new prop
}

const updateHash = (highlight: Highlight) => {
  document.location.hash += `#highlight-${highlight.id}`;
};

// Define the type for paragraph
interface Paragraph {
  entities: Array<[string, any, any]>; // Adjust the tuple type as needed
  // Add other properties if necessary
}

const EventSidebar = ({ highlights, getHighlightById, setIsActive, setHighlights, selectedMode, paraHighlights }: EventSidebarProps) => {
  const globalContext = useContext(GlobalContext);
  
  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }
  const { bratOutput, documentId, updateId, setBratOutput, setDocumentId, setUpdateId, fileName, setFileName } = globalContext;
  const navigateTo = useNavigate();
  const convertedBratOutput: Record<string, [string, any, any]> = {}; // Update the type
  bratOutput.forEach((paragraph: Paragraph, index: number) => {
    paragraph.entities.forEach(entity => {
      const convertedEntityId = `para${index}_${entity[0]}`; // Combine paragraph index with entity ID
      convertedBratOutput[convertedEntityId] = entity;
    });
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [maxDialogWidth, setMaxDialogWidth] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | false>('lg');
  const [selectedHighlight, setSelectedHighlight] = useState<CommentedHighlight | null>(null);
  const [editableComment, setEditableComment] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);

  const [editingRelationIndex, setEditingRelationIndex] = useState<number | null>(null);
  const [editedRelationType, setEditedRelationType] = useState<string>('');

  const [newRelationType, setNewRelationType] = useState<string>('');
  const [newRelationTarget, setNewRelationTarget] = useState<string>('');
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  // State for "adjust your selection" dialog
  const [openParaSelection, setOpenParaSelection] = useState(false);
  // Track which paragraphs are selected (default all checked)
  const [paragraphSelections, setParagraphSelections] = useState<boolean[]>(
    paraHighlights.map(ph => ph.visible !== undefined ? ph.visible : true)
  );


  // State to track if the "add relation" row should be shown
  const [showAddRelationRow, setShowAddRelationRow] = useState(false);

  // Define state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30; // Set items per page to 30

  // Calculate total pages based on highlights length and itemsPerPage
  const totalPages = Math.ceil(highlights.length / itemsPerPage);

  // Determine the highlights to display on the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHighlights = highlights.slice(startIndex, startIndex + itemsPerPage);

  const [allParagraphsSelected, setAllParagraphsSelected] = useState(true);

  // Updated paragraph checkbox handler to keep the "All" box in sync:
  const handleParagraphCheckbox = (index: number) => {
    setParagraphSelections((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      // Update the "All" checkbox state if any box is unchecked
      setAllParagraphsSelected(updated.every(Boolean));
      return updated;
    });
  };

  // New function to toggle all paragraphs on/off:
  const handleAllParagraphsToggle = () => {
    const newVal = !allParagraphsSelected;
    setAllParagraphsSelected(newVal);
    setParagraphSelections(paragraphSelections.map(() => newVal));
  };


  // Handle page change
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // Reset currentPage to 1 whenever selectedMode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMode]);

    
  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
    // console.log(highlight);
    setSelectedHighlight(highlight);
  };

  const editClick = (highlight: CommentedHighlight) => {
    // setSelectedHighlight(highlight);
    setDialogOpen(true);
  };
  
  useEffect(() => {
    if (selectedHighlight) {
      setEditableComment(selectedHighlight.comment || '');
      setSelectionStart(convertedBratOutput[selectedHighlight.id][2][0][0]);
      setSelectionEnd(convertedBratOutput[selectedHighlight.id][2][0][1]);
    }
  }, [selectedHighlight]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedHighlight(null);
    setTabValue(0);
    setShowAddRelationRow(false);
    setNewRelationType('');
    setNewRelationTarget('');
    setConfirmStatusOpen(false);
  };

  const handleOpenParaSelection = () => {
    setOpenParaSelection(true);
  };
  
  const handleCloseParaSelection = () => {
    setOpenParaSelection(false);
  };
  
  
  // When user hits "Save & Reload" in that dialog
  // Here we simply filter out any highlights that belong
  // to unchecked paragraphs. Adjust as needed.

  const handleSaveParagraphSelection = async () => {
    try {
      setIsActive(true);
      const data = {
        document_id: documentId,
        update_id: updateId,
        visible_list: paragraphSelections
      };

      console.log("Payload to /set-visible:", data);
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/set-visible`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // After success, set new highlights
      // If you need, also update other states (bratOutput, fileName, etc.)
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id); // Store documentId in GlobalState
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);
      setFileName(response.data.filename);
      navigateTo('/result', { 
        state: { 
          highlights: response.data.pdf_format_output, 
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`
        }
      });
    } catch (error) {
      console.error("Error updating visible list:", error);
    } finally {
      setOpenParaSelection(false);
      setIsActive(false);
    }
  };


  const handleRelationSaveAndReload = async () => {
    setIsActive(true);
  
    // Prepare data for the server
    const data = {
      document_id: documentId,
      update_id: updateId,
      entity_id: selectedHighlight?.id,
      relations: selectedHighlight?.relations,
    };
    
    // console.log('data:', data);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/update-relations`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // console.log('Relations updated successfully:', response.data);
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id); // Update documentId in GlobalState
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);
  
      // Navigate to the result page to display the updated highlights
      navigateTo('/result', { 
        state: { 
          highlights: response.data.pdf_format_output, 
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}` 
        }
      });
    } catch (error) {
      console.error('Error updating relations:', error);
    } finally {
      setSelectedHighlight(null);
      setDialogOpen(false);
      setConfirmOpen(false);
      setIsActive(false);
    }
  };

  const handleEntitySelectionChange = (start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
    console.log("Selection changed:", start, end);
  };

  useEffect(() => {
    const hash = document.location.hash.split("#")[document.location.hash.split("#").length - 1];
  
    // Find the index of hightlight in the highlights array using the ids
    const highlightIndex = highlights.findIndex((highlight) => `highlight-${highlight.id}` === hash);
    if (highlightIndex !== -1){
      setCurrentPage(Math.floor(highlightIndex / itemsPerPage) + 1);
    }
    // Set delay to ensure the element is rendered before scrolling
    setTimeout(() => {
      if (hash) {
        const highlightElement = document.getElementById(hash);
        if (highlightElement) {
          highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
  }, [document.location.hash]);


  const handleStarClick = (highlight: CommentedHighlight) => {
    // setSelectedHighlight(highlight);
    setConfirmStatusOpen(true);
  };


  const handleConfirmStar = async () => {
    if (!selectedHighlight) return;

    try {
      setIsActive(true);
      const newStatus = selectedHighlight.edit_status === "confirmed" ? "none" : "confirmed";
      const data = {
        document_id: documentId,
        update_id: updateId,
        id: selectedHighlight.id,
      };

      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/change-edit-status`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Status updated successfully:', response.data);
      // Update the local highlights with the new status
      setHighlights((prevHighlights) => 
        prevHighlights.map((highlight) =>
          highlight.id === selectedHighlight.id
            ? { ...highlight, edit_status: newStatus }
            : highlight
        )
      );

      console.log('Status updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setConfirmStatusOpen(false);
      setSelectedHighlight(null);
      setIsActive(false);
    }
  };

  const renderStarButton = (highlight) => {
    const isConfirmed = highlight.edit_status === "confirmed";
    return (
      <Tooltip title={isConfirmed ? "This item has been confirmed by the user" : "This item has not been confirmed yet"}>
        <IconButton 
          color="primary" 
          aria-label={isConfirmed ? "confirmed" : "unconfirmed"} 
          onClick={() => handleStarClick(highlight)}
        >
          {isConfirmed ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
    );
  };


  return (
    <div className="sidebar" style={{ width: "20vw", maxWidth: "1000px" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          Found <span className="total_entities_span">{highlights.length}</span> events in this document.
        </h2>
        <p>
          <small>
            
          </small>
        </p>

        <p style={{ fontSize: "15px", marginTop: "10px" }}>
          📝 To annotate results for specific sections of the document, please{" "}
          <span
            style={{
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "none",
              fontWeight: "bold",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            onClick={handleOpenParaSelection}
          >
            adjust your selection
          </span>
          .
        </p>

      </div>

      {/* Render paginated highlights */}
      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "10px" }}>
        {currentHighlights.map((highlight, index) => (
          <li
            key={index}
            id={`highlight-${highlight.id}`}
            className={`sidebar__highlight ${document.location.hash.split("#")[document.location.hash.split("#").length - 1] === `highlight-${highlight.id}` ? 'sidebar__highlight--selected' : ''}`}
            onClick={() => handleHighlightClick(highlight)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <div style={{ flex: 1, width: '100%', overflow: "hidden" }}>
              <div className="highlight_item_header">
                <p className={"entity_point EVENT"}>&nbsp;&nbsp;</p>
                <strong>{"EVENT " + (index+1)}</strong>
              </div>
              
              <div style={{marginBottom: "0.5rem", marginTop: "0.5rem"}}><b>🔹Type: </b>PropetyInfo<br/></div>
                <div style={{marginBottom: "0.5rem"}}><b>🔹Trigger: </b>"glass transition temperature"<br/></div>
                <div><b>🔹Arguments:</b><br/></div>
                <ul style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <li style={{ margin: "10px 0"  }}>
                      <span style={{ marginLeft: "0rem",  }}>Polymer: poly[iminoethyleneimino(2-phenoxyterephthaloyl)]</span>
                    </li>
                    <li style={{ margin: "10px 0"  }}>
                      <span style={{ marginLeft: "0rem" }}>Value: 111.0 F</span>
                    </li>
                    <li style={{ margin: "10px 0"  }}>
                      <span style={{ marginLeft: "0rem" }}>Condition: at 25°C and a frequency of 1 Hz</span>
                    </li>
                    <li style={{ margin: "10px 0"  }}>
                      <span style={{ marginLeft: "0rem" }}>Char_method: isothermogravimetric analysis</span>
                    </li>
              </ul>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '1.0rem' }}>
              <Tooltip title="Click to revise annotation">
                <IconButton color="primary" aria-label="edit paragraph" onClick={() => editClick(highlight)}>
                  <EditNoteIcon />
                </IconButton>
              </Tooltip>
              {/* Add a star button with a tooltip */}
              {highlight.comment && renderStarButton(highlight)}

              <div className="highlight__location" style={{ marginLeft: 'auto' }}>
                Page {highlight.position.boundingRect.pageNumber}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      {/* MUI Pagination Controls */}
      <div
        className="pagination-controls"
        style={{
          position: "fixed",
          bottom: 0,
          width: "18vw",
          maxWidth: "1000px",
          padding: "10px 0",
          backgroundColor: "white",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Pagination 
          count={totalPages} 
          page={currentPage} 
          siblingCount={0}
          onChange={handlePageChange} 
          color="primary" 
          variant="outlined" 
          shape="rounded"
        />
      </div>



    </div>
  );
};

export default EventSidebar;
