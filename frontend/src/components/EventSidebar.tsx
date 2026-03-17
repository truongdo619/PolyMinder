import React, { useEffect, useState, useContext } from "react";
import { GuidanceBanner, useGuidanceContext } from './GuidanceSystem';
import type { Highlight } from "../react-pdf-highlighter-extended";
import "../style/Sidebar.css";
import { CommentedHighlight } from "../types";
import "../pdf_highlighter/style/TextHighlight.css";
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
import { GlobalContext } from '../GlobalState';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosSetup';
import Pagination from '@mui/material/Pagination';
import { Box, List, ListItem, Checkbox, Typography, Snackbar, Alert } from '@mui/material';

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
  const { bratOutput, documentId, updateId, setBratOutput, setDocumentId, setUpdateId, setFileName } = globalContext;
  const navigateTo = useNavigate();
  const convertedBratOutput: Record<string, [string, any, any]> = {}; // Update the type
  bratOutput.forEach((paragraph: Paragraph, index: number) => {
    paragraph.entities.forEach(entity => {
      const convertedEntityId = `para${index}_${entity[0]}`; // Combine paragraph index with entity ID
      convertedBratOutput[convertedEntityId] = entity;
    });
  });

  const guidance = useGuidanceContext();

  const [selectedHighlight, setSelectedHighlight] = useState<CommentedHighlight | null>(null);

  // helper to shorten long texts
  const shortTxt = (t: string) => (t.length > 30 ? t.slice(0, 30).trim() + '…' : t);

  
  const [showAddArgRow, setShowAddArgRow] = useState(false);
  const [newArgEntity,  setNewArgEntity]  = useState('');
  // ────────────────────────────────────────────────
  //  EVENT-EDIT STATE
  // ────────────────────────────────────────────────
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CommentedHighlight | null>(null);

  // trigger editing
  const [_editableTriggerText, setEditableTriggerText] = useState('');
  const [triggerStart, setTriggerStart] = useState<number | null>(null);
  const [triggerEnd, setTriggerEnd] = useState<number | null>(null);

  // argument editing
  type EventArg = { entityId: string; role: string; text: string; };
  const [eventArgs, setEventArgs] = useState<EventArg[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);


  // helpers
  const openEventDialog = (ev: CommentedHighlight) => {

    // console.log("CommentedHighlight", ev);
    // console.log("highlights", highlights);
    // console.log(bratOutput[
    //               parseInt(ev.id.split('_')[0].match(/\d+/)?.[0] ?? '0', 10)
    //             ])

    // console.log(convertedBratOutput);
    setSelectedEvent(ev);
    
    setEditableTriggerText(ev.content.text ?? '');
    setTriggerStart(convertedBratOutput[ev.id][2][0][0]);
    setTriggerEnd(convertedBratOutput[ev.id][2][0][1]);

    setEventArgs(
      (ev.event_infor?.arguments ?? []).map(([entityId, role, , text]) => ({
        entityId,
        role: role.toUpperCase(),
        text
      }))
    );

    setEventDialogOpen(true);
  };

  const closeEventDialog = () => {
    setEventDialogOpen(false);
    setSelectedEvent(null);
    setEventArgs([]); 
  };

  // useEffect(() => {
  //   console.log('eventArgs updated →', eventArgs);
  // }, [eventArgs]);


  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error'>('success');

    const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };


  // State for "adjust your selection" dialog
  const [openParaSelection, setOpenParaSelection] = useState(false);
  
  // Track which paragraphs are selected (default all checked)
  const [paragraphSelections, setParagraphSelections] = useState<boolean[]>(
    paraHighlights.map(ph => ph.visible !== undefined ? ph.visible : true)
  );

  
  const handleOpenParaSelection = () => {
    setOpenParaSelection(true);
  };
  
  const handleCloseParaSelection = () => {
    setOpenParaSelection(false);
  };

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


  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
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
    openEventDialog(highlight);
  };

  
  // ————————————————————————————————————————————————
  //  SAVE-&-RELOAD HELPER
  // ————————————————————————————————————————————————
  const saveEditedEvent = async () => {
    if (!selectedEvent) return;
    setIsActive(true);

    try {
      const payload = {
        document_id: documentId,
        update_id: updateId,
        para_id: selectedEvent.para_id,
        trigger_new_head: triggerStart,
        trigger_new_tail: triggerEnd,
        event: {
          'event_id': selectedEvent.event_infor?.event_id,
          'trigger_id': selectedEvent.event_infor?.trigger_id,
          arguments: eventArgs.map(({ role, entityId }) => [role, entityId]),
        },
      };

      const token = localStorage.getItem('accessToken');
      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/edit-event`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // refresh global state & navigate
      setBratOutput(res.data.brat_format_output);
      setDocumentId(res.data.document_id);
      setUpdateId(res.data.update_id);
      setHighlights(res.data.pdf_format_output);
      navigateTo('/result', {
        state: {
          highlights: res.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${res.data.filename}`,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsActive(false);
      closeEventDialog();
    }
  };

  const renderStarButton = (highlight: CommentedHighlight) => {
    const isConfirmed = highlight.edit_status === "confirmed";
    return (
      <Tooltip title={isConfirmed ? "This item has been confirmed by the user" : "This item has not been confirmed yet"}>
        <IconButton 
          color="primary" 
          aria-label={isConfirmed ? "confirmed" : "unconfirmed"} 
          onClick={(e) => {e.stopPropagation(); handleStarClick(highlight)}}
        >
          {isConfirmed ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
    );
  };
  

  const handleStarClick = (highlight: CommentedHighlight) => {
    setSelectedHighlight(highlight);
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

  
  const handleDelete = async () => {
    // We need to know which event we’re deleting
    const event = selectedEvent;            // or fall back to selectedHighlight if you prefer
    if (!event) {
      setNotification('No event selected for deletion.');
      setNotificationSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    setIsActive(true);

    try {
      const payload = {
        document_id: documentId,
        update_id:   updateId,
        para_id:     event.para_id,
        event_id:    event.event_infor?.event_id,
      };

      const token = localStorage.getItem('accessToken');
      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/delete-event`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      /* ——— refresh global state & jump back to /result ——— */
      setBratOutput(res.data.brat_format_output);
      setDocumentId(res.data.document_id);
      setUpdateId(res.data.update_id);
      setHighlights(res.data.pdf_format_output);
      setFileName(res.data.filename);

      navigateTo('/result', {
        state: {
          highlights: res.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${res.data.filename}`,
        },
      });

      setNotification('Event deleted successfully!');
      setNotificationSeverity('success');
    } catch (err) {
      console.error(err);
      setNotification('Failed to delete event.');
      setNotificationSeverity('error');
    } finally {
      setOpenSnackbar(true);
      setIsActive(false);
      setConfirmOpen(false);   // close the confirm dialog
      closeEventDialog();      // close the edit dialog if it was open
      setSelectedEvent(null);  // clear local selection
    }
  };

  const handleDialogClose = () => {
    setConfirmStatusOpen(false);
  };


  return (
    <div className="sidebar" style={{ width: "100%", height: "100vh", overflowY: "auto" }}>
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

      {guidance.shouldShow('events-intro') && (
        <GuidanceBanner
          id="events-intro"
          title="Events Mode"
          description="Events capture structured actions in the text — such as synthesis steps or measurement procedures. Each event groups related entities from a paragraph."
          actionLabel="Got it"
          onDismiss={guidance.dismiss}
          visible={true}
        />
      )}

      {guidance.shouldShow('events-paragraph-filter') && (
        <GuidanceBanner
          id="events-paragraph-filter"
          title="Filter by Paragraph"
          description='Use "Adjust your selection" above to choose which paragraphs contribute to event detection. Unchecking a paragraph excludes it from results.'
          actionLabel="Got it"
          onDismiss={guidance.dismiss}
          visible={true}
        />
      )}

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
              
              <div style={{marginBottom: "0.5rem", marginTop: "0.5rem"}}><b>🔹Type: </b>{highlight.trigger}<br/></div>
                <div style={{marginBottom: "0.5rem"}}><b>🔹Trigger: </b>{highlight.content.text}<br/></div>
                <div><b>🔹Arguments:</b><br/></div>
                {/* <ul style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                </ul> */}
                <ul
                  style={{
                    fontSize: "0.8rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {highlight.event_infor?.arguments?.map((arg, idx) => {
                    // arg structure: [id, arg_type, span, extra, text]
                    const [_argID, argType, , argText] = arg;

                    // Nicely format the arg type, e.g. VALUE → Value
                    const label =
                      argType.charAt(0).toUpperCase() + argType.slice(1).toLowerCase();

                    return (
                      <li key={idx} style={{ margin: "10px 0" }}>
                        <span style={{ marginLeft: "0rem" }}>
                          {label}: {argText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
            </div>

            {/* <div style={{ flex: 1, width: '100%', overflow: "hidden" }}>
              <div className="highlight_item_header">
                <p className={"entity_point " + highlight.comment}>&nbsp;&nbsp;</p>
                <strong>{highlight.comment}</strong>
              </div>
              
              <div style={{marginBottom: "0.5rem"}}><b>🔹Trigger: </b>{`${highlight.content.text.slice(0, 60).trim()}`}<br/></div>
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
            </div> */}


            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '1.0rem' }}>
              <Tooltip title="Click to revise annotation">
                <IconButton color="primary" aria-label="edit paragraph" onClick={(e) => {e.stopPropagation(); editClick(highlight)}}>
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
          position: "sticky",
          bottom: 0,
          width: "100%",
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

    {/* ───────────────────────────────── Dialog: Edit Event ───────────────────────── */}
    <Dialog
      open={eventDialogOpen}
      onClose={closeEventDialog}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ textAlign: 'center' }}>Edit Event</DialogTitle>
      <DialogContent dividers>

        {/* Trigger editor */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Trigger<span style={{ color: 'crimson' }}>*</span>
          </Typography>

          {selectedEvent && (
            <EditedEntityComponent
              text={
                bratOutput[
                  parseInt(selectedEvent.id.split('_')[0].match(/\d+/)?.[0] ?? '0', 10)
                ].text
              }
              defaultStart={triggerStart ?? 0}
              defaultEnd={triggerEnd ?? 0}
              onSelectionChange={(s, e) => {
                setTriggerStart(s);
                setTriggerEnd(e);
              }}
              entityType={selectedEvent.comment} // cosmetic
              onTextChange={(t) => setEditableTriggerText(t)}
            />
          )}
        </Box>

        {/* Arguments table */}
        <Typography variant="subtitle1" gutterBottom>
          Arguments<span style={{ color: 'crimson' }}>*</span>
        </Typography>
        {/* ─── Argument list (SplitButton style) ─────────────────────────────── */}
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Argument</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {eventArgs.map((arg, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <SplitButton
                      filledText={arg.role}
                      outlinedText={shortTxt(arg.text)}
                      entityType={arg.role}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setEventArgs(prev => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {/* add-row: entity picker only */}
              {showAddArgRow && (
                <TableRow>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <InputLabel id="arg-entity">Choose Entity</InputLabel>
                      <Select
                        labelId="arg-entity"
                        value={newArgEntity}
                        label="Choose Entity"
                        onChange={e => setNewArgEntity(e.target.value as string)}
                      >
                        {selectedEvent && (() => {
                          /* ── work out the paragraph index of the selected event ── */
                          const paraIdx =
                            parseInt(
                              selectedEvent.id.split("_")[0].match(/\d+/)?.[0] ?? "0",
                              10,
                            );

                          /* ── pull that paragraph’s entities straight from bratOutput ── */
                          const triggerLocalId = selectedEvent.id.split("_")[1];   // e.g. "T33"

                          return bratOutput[paraIdx].entities
                            /* 1️⃣  skip the trigger entity */
                            .filter((ent: string[]) => ent[0] !== triggerLocalId)
                            .map((ent: string[]) => {
                              const [localId, entType, , , entText] = ent;
                              const globalId = `para${paraIdx}_${localId}`;
                              return (
                                <MenuItem key={globalId} value={globalId}>
                                  {entType}: {shortTxt(entText)}
                                </MenuItem>
                              );
                            });
                        })()}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!newArgEntity}
                      onClick={() => {
                        /* look up the entity we just chose */
                        if (!selectedEvent) return;
                        const paraIdx =
                        parseInt(
                          selectedEvent.id.split("_")[0].match(/\d+/)?.[0] ?? "0",
                          10,
                        );
                        const entity = bratOutput[paraIdx].entities.find(
                          (e: string[]) => `para${paraIdx}_${e[0]}` === newArgEntity,
                        );

                        if (!entity) return;                         // safety check
                        const [id, role, , , text] = entity;

                        setEventArgs(prev => [
                          ...prev,
                          { entityId: id, role, text },
                        ]);

                        setShowAddArgRow(false);
                        setNewArgEntity("");
                      }}
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* toggle “Add argument” */}
        <Box sx={{ mt: 1 }}>
          <IconButton 
            color="primary" 
            onClick={() => setShowAddArgRow(true)} 
            style={{
              borderRadius: '50%',  // Round border
              border: '2px solid',   // Add border
              padding: '0px',       // Ensure sufficient padding for round shape
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </DialogContent>

      <DialogActions style={{ justifyContent: 'space-between', padding: "20px" }}>
        
        <Button onClick={() => setConfirmOpen(true)} color="error" variant="contained">
          Delete
        </Button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={closeEventDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveEditedEvent}
          >
            Save & Reload
          </Button>
        </div>
      </DialogActions>
    </Dialog>

    {/* NEW Dialog: "Adjust Your Selection" */}
    <Dialog
    open={openParaSelection}
    onClose={handleCloseParaSelection}
    maxWidth="md"
    fullWidth
    PaperProps={{
      style: {
        borderRadius: '8px',
        backgroundColor: '#fafafa',
      },
    }}
    >
      <DialogTitle style={{ textAlign: 'center' }}>
        Adjust Your Paragraph Selection
      </DialogTitle>
      <Divider />
      <DialogContent dividers>
        {/* "Enable/Disable All" checkbox outside the paragraphs list */}
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
          <Checkbox
            checked={allParagraphsSelected}
            onChange={handleAllParagraphsToggle}
          />
          <Typography variant="body1">Enable/Disable All</Typography>
        </Box>

        {/* List of paragraphs with a tooltip and individual checkboxes */}
        <List>
          {paraHighlights.map((para, i) => {
            const paraText = para.content.text ?? '';
            const shortPreview =
              paraText.slice(0, 150) +
              (paraText.length > 150 ? "..." : "");
            return (
              <ListItem
                key={i}
                dense
                sx={{
                  userSelect: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#f9f9f9",
                  cursor: "pointer",
                  transition: "background 0.2s ease-in-out",
                  ":hover": {
                    backgroundColor: "#ececec",
                  },
                }}
              >
                <Tooltip title={paraText} arrow>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">
                      Paragraph {(para.para_id ?? 0) + 1} - {para.comment}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#555" }}>
                      {shortPreview}
                    </Typography>
                  </Box>
                </Tooltip>

                {/* Individual paragraph checkbox */}
                <Checkbox
                  edge="end"
                  checked={paragraphSelections[i]}
                  onChange={() => handleParagraphCheckbox(i)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleCloseParaSelection} color="primary" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSaveParagraphSelection} color="primary" variant="contained">
          Save & Reload
        </Button>
      </DialogActions>
    </Dialog>

    <Snackbar
      open={openSnackbar}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={handleCloseSnackbar}
        severity={notificationSeverity}
        sx={{ width: '100%' }}
      >
        {notification}
      </Alert>
    </Snackbar>

      <Dialog open={confirmStatusOpen} onClose={handleDialogClose}>
        <DialogTitle style={{ textAlign: 'center' }}>
          {selectedHighlight?.edit_status === "none" ? "Confirm Status Change" : "Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to {selectedHighlight?.edit_status === "none" ? "confirm this highlight?" : "unconfirm this highlight?"}
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmStar} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle style={{ textAlign: 'center' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default EventSidebar;
