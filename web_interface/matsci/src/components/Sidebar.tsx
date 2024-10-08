import React, { useEffect, useState, useContext } from "react";
import type { Highlight } from "../react-pdf-highlighter-extended";
import "../style/Sidebar.css";
import { CommentedHighlight } from "../types";
import "../../../pdf-highlighter/style/TextHighlight.css";
import EditNoteIcon from '@mui/icons-material/EditNote';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogContentText from '@mui/material/DialogContentText';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import SplitButton from './SplitButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditedEntityComponent from './EditedEntityComponent';
import { GlobalContext } from '../GlobalState';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosSetup';

interface SidebarProps {
  highlights: Array<CommentedHighlight>;
  getHighlightById: (id: string) => CommentedHighlight | undefined;
  setIsActive: (active: boolean) => void;
  setHighlights: React.Dispatch<React.SetStateAction<Array<CommentedHighlight>>>; // Add this line
}

const updateHash = (highlight: Highlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

// Define the type for paragraph
interface Paragraph {
  entities: Array<[string, any, any]>; // Adjust the tuple type as needed
  // Add other properties if necessary
}

const Sidebar = ({ highlights, getHighlightById, setIsActive, setHighlights }: SidebarProps) => {
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

  // State to track if the "add relation" row should be shown
  const [showAddRelationRow, setShowAddRelationRow] = useState(false);

  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
    setSelectedHighlight(highlight);
  };

  const editClick = (highlight: CommentedHighlight) => {
    setSelectedHighlight(highlight);
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
  };

  const handleEntitySaveAndReload = async () => {
    setIsActive(true);
    const data = {
        document_id: documentId,
        update_id: updateId,
        id: selectedHighlight?.id,
        head_pos: selectionStart,
        tail_pos: selectionEnd,
        type: editableComment
    };
    console.log('data:', data);
    console.log('selectedHighlight:', selectedHighlight);
    try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/update-entity`,
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
        setUpdateId(response.data.update_id);
        setHighlights(response.data.pdf_format_output);
        setFileName(response.data.filename);
        navigateTo('/result', { 
          state: { 
            highlights: response.data.pdf_format_output, 
            url: `${import.meta.env.VITE_BACKEND_URL}/statics/${response.data.filename}`
          }
        });
    } catch (error) {
        console.error('Error updating paragraphs:', error);
    } finally {
        setSelectedHighlight(null);
        setDialogOpen(false);
        setConfirmOpen(false);
        setIsActive(false);
    }
  };

  const handleDelete = async () => {
    setIsActive(true);
    const data = {
        document_id: documentId,
        update_id: updateId,
        ids: [selectedHighlight?.id],
    };
    console.log('data:', data);
    console.log('selectedHighlight:', selectedHighlight);
    try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/delete-entity`,
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
        setUpdateId(response.data.update_id);
        setHighlights(response.data.pdf_format_output);
        setFileName(response.data.filename);
        navigateTo('/result', { 
          state: { 
            highlights: response.data.pdf_format_output, 
            url: `${import.meta.env.VITE_BACKEND_URL}/statics/${response.data.filename}`
          }
        });
    } catch (error) {
        console.error('Error updating paragraphs:', error);
    } finally {
        setSelectedHighlight(null);
        setDialogOpen(false);
        setConfirmOpen(false);
        setIsActive(false);
    }
    

  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditRelation = (index: number) => {
    if (selectedHighlight && selectedHighlight.relations) {
      setEditingRelationIndex(index);
      setEditedRelationType(selectedHighlight.relations[index].type || '');
    }
  };

  const handleDeleteRelation = (index: number) => {
    if (selectedHighlight && selectedHighlight.relations) {
      selectedHighlight.relations.splice(index, 1); // Remove the relation at the specified index
      setHighlights([...highlights]); // Trigger a re-render by updating the highlights
    }
  };

  const handleRelationTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedRelationType(event.target.value);
  };

  const handleSaveRelationType = () => {
    if (selectedHighlight && selectedHighlight.relations && editingRelationIndex !== null) {
      selectedHighlight.relations[editingRelationIndex].type = editedRelationType;
      setEditingRelationIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingRelationIndex(null);
  };

  const handleAddRelation = () => {
    if (newRelationType && newRelationTarget) {
      const newRelation = {
        type: newRelationType,
        arg_id: newRelationTarget,
        arg_type: getHighlightById(newRelationTarget)?.comment || '',
        arg_text: getHighlightById(newRelationTarget)?.content.text || '',
      };
      if (selectedHighlight) {
        if (!selectedHighlight.relations) {
          selectedHighlight.relations = [];
        }
        selectedHighlight.relations.push(newRelation);
      }
      setNewRelationType('');
      setNewRelationTarget('');
    }
  };

  const handleAddButtonClick = () => {
    setShowAddRelationRow(true);
  };

  
  const handleSaveAndReload = () => {
    if (tabValue === 0) {
      handleEntitySaveAndReload();
    } else if (tabValue === 1) {
      setDialogOpen(false);
      handleRelationSaveAndReload();
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
    
    console.log('data:', data);
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
  
      console.log('Relations updated successfully:', response.data);
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id); // Update documentId in GlobalState
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);
  
      // Navigate to the result page to display the updated highlights
      navigateTo('/result', { 
        state: { 
          highlights: response.data.pdf_format_output, 
          url: `${import.meta.env.VITE_BACKEND_URL}/statics/${response.data.filename}` 
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
    const hash = document.location.hash;
    if (hash) {
      const highlightElement = document.getElementById(hash.substring(1));
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, []);

  return (
    <div className="sidebar" style={{ width: "20vw", maxWidth: "1000px" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          Found <span className="total_entities_span">{highlights.length}</span> entities in this document.
        </h2>
        <p>
          <small>
            To highlight a new entity, select the text you want and click "Add Highlight".
          </small>
        </p>
      </div>

      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "10px" }}>
        {highlights.map((highlight, index) => (
          <li
            key={index}
            id={`highlight-${highlight.id}`}
            className={`sidebar__highlight ${document.location.hash === `#highlight-${highlight.id}` ? 'sidebar__highlight--selected' : ''}`}
            onClick={() => handleHighlightClick(highlight)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <div style={{ flex: 1, width: '100%' }}>
              <div className="highlight_item_header">
                <p className={"entity_point " + highlight.comment}>&nbsp;&nbsp;</p>
                <strong>{highlight.comment}</strong>
              </div>
              {highlight.content.text && (
                <blockquote>
                  {`${highlight.content.text.slice(0, 90).trim()}`}
                </blockquote>
              )}
              <ul>
                {highlight.relations &&
                  highlight.relations.map((relation, index) => (
                    <li key={index}>
                      <i style={{ marginLeft: "2rem" }}>{relation.type}</i>
                      <br />
                      <strong style={{ marginLeft: "4rem" }}>
                        {getHighlightById(relation.arg_id)?.comment}:{relation.arg_text}
                      </strong>
                    </li>
                  ))}
              </ul>
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

      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        fullWidth={true}
        maxWidth={maxDialogWidth}
      >
        <DialogTitle style={{ textAlign: 'center' }}>Edit Highlight</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Entity and Relation tabs">
            <Tab label="Entity" />
            <Tab label="Relation" />
          </Tabs>
          <Box role="tabpanel" hidden={tabValue !== 0} id="entity-tabpanel" aria-labelledby="entity-tab">
            {selectedHighlight ? (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel id="entity-type-label">Entity Type</InputLabel>
                <Select
                  labelId="entity-type-label"
                  value={editableComment}
                  onChange={(e) => setEditableComment(e.target.value)}
                  label="Entity Type"
                  fullWidth
                >
                  <MenuItem value={"INORGANIC"}>INORGANIC</MenuItem>
                  <MenuItem value={"CHAR_METHOD"}>CHAR_METHOD</MenuItem>
                  <MenuItem value={"PROP_NAME"}>PROP_NAME</MenuItem>
                  <MenuItem value={"POLYMER"}>POLYMER</MenuItem>
                  <MenuItem value={"POLYMER_FAMILY"}>POLYMER_FAMILY</MenuItem>
                  <MenuItem value={"ORGANIC"}>ORGANIC</MenuItem>
                  <MenuItem value={"MATERIAL_AMOUNT"}>MATERIAL_AMOUNT</MenuItem>
                  <MenuItem value={"CONDITION"}>CONDITION</MenuItem>
                  <MenuItem value={"REF_EXP"}>REF_EXP</MenuItem>
                  <MenuItem value={"PROP_VALUE"}>PROP_VALUE</MenuItem>
                  <MenuItem value={"MONOMER"}>MONOMER</MenuItem>
                  <MenuItem value={"OTHER_MATERIAL"}>OTHER_MATERIAL</MenuItem>
                  <MenuItem value={"COMPOSITE"}>COMPOSITE</MenuItem>
                  <MenuItem value={"SYN_METHOD"}>SYN_METHOD</MenuItem>
                </Select>
              </FormControl>
              
              <EditedEntityComponent  
                text={bratOutput[parseInt(selectedHighlight.id.split("_")[0].match(/\d+/)?.[0] || "0", 10)].text}
                defaultStart={convertedBratOutput[selectedHighlight.id][2][0][0]} 
                defaultEnd={convertedBratOutput[selectedHighlight.id][2][0][1]}
                onTextChange={(newText) => {console.log("Text changed:", newText)}}   
                onSelectionChange={handleEntitySelectionChange}
                entityType={editableComment}
              />
              {/* <TextField
                label="Content"
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                multiline
                fullWidth
                margin="normal"
                variant="outlined"/> */}
            </>
            ) : (
              <p>No highlight selected.</p>
            )}
          </Box>

          <Box role="tabpanel" hidden={tabValue !== 1} id="relation-tabpanel" aria-labelledby="relation-tab">
            {selectedHighlight ? (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{fontWeight: "bold"}}>Subject Entity</TableCell>
                      <TableCell style={{fontWeight: "bold"}}>Relation</TableCell>
                      <TableCell style={{fontWeight: "bold"}}>Object Entity</TableCell>
                      <TableCell style={{fontWeight: "bold"}}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedHighlight.relations ?? []).map((relation, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <SplitButton 
                              filledText={selectedHighlight.comment} 
                              outlinedText={
                                (selectedHighlight.content.text ?? '').length > 30 
                                  ? `${(selectedHighlight.content.text ?? '').slice(0, 30).trim()}...` 
                                  : selectedHighlight.content.text ?? ''
                              } 
                              entityType={selectedHighlight.comment} 
                            />
                          </TableCell>
                          <TableCell style={{ fontStyle: 'italic', minWidth: '110px' }}>
                            {editingRelationIndex === index ? (
                              <FormControl fullWidth>
                                <Select
                                  value={editedRelationType}
                                  onChange={(e) => setEditedRelationType(e.target.value)}
                                  onBlur={handleSaveRelationType}
                                  autoFocus
                                >
                                  <MenuItem value="has_property">has_property</MenuItem>
                                  <MenuItem value="has_value">has_value</MenuItem>
                                  <MenuItem value="has_amount">has_amount</MenuItem>
                                  <MenuItem value="has_condition">has_condition</MenuItem>
                                  <MenuItem value="abbreviation_of">abbreviation_of</MenuItem>
                                  <MenuItem value="refers_to">refers_to</MenuItem>
                                  <MenuItem value="synthesised_by">synthesised_by</MenuItem>
                                  <MenuItem value="characterized_by">characterized_by</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              <span onClick={() => handleEditRelation(index)}>{relation.type}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <SplitButton 
                              filledText={relation.arg_type} 
                              outlinedText={
                                relation.arg_text.length > 30
                                  ? `${relation.arg_text.slice(0, 30).trim()}...` 
                                  : relation.arg_text
                              } 
                              entityType={relation.arg_type} 
                            />
                          </TableCell>
                          <TableCell>
                            {/* <IconButton aria-label="delete relation" onClick={() => {}}>
                              <DeleteIcon />
                            </IconButton> */}
                            <IconButton aria-label="delete relation" onClick={() => handleDeleteRelation(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {showAddRelationRow && (
                      <TableRow>
                        <TableCell>
                          <SplitButton 
                            filledText={selectedHighlight.comment} 
                            outlinedText={
                              (selectedHighlight.content.text ?? '').length > 30 
                                ? `${(selectedHighlight.content.text ?? '').slice(0, 30).trim()}...` 
                                : selectedHighlight.content.text ?? ''
                            } 
                            entityType={selectedHighlight.comment} 
                          />
                        </TableCell>
                        <TableCell  style={{ minWidth: '110px' }}>
                        <FormControl fullWidth>
                          <InputLabel id="relation-type-label">Relation Type</InputLabel>
                          <Select
                            labelId="relation-type-label"
                            value={newRelationType}
                            label="Relation Type"
                            onChange={(e) => setNewRelationType(e.target.value)}
                          >
                            <MenuItem value={"has_property"}>has_property</MenuItem>
                            <MenuItem value={"has_value"}>has_value</MenuItem>
                            <MenuItem value={"has_amount"}>has_amount</MenuItem>
                            <MenuItem value={"has_condition"}>has_condition</MenuItem>
                            <MenuItem value={"abbreviation_of"}>abbreviation_of</MenuItem>
                            <MenuItem value={"refers_to"}>refers_to</MenuItem>
                            <MenuItem value={"synthesised_by"}>synthesised_by</MenuItem>
                            <MenuItem value={"characterized_by"}>characterized_by</MenuItem>
                          </Select>
                        </FormControl>
                        </TableCell>
                        <TableCell  style={{ minWidth: '110px' }}>
                          <FormControl fullWidth>
                            <InputLabel id="relation-target-label">Target Entity</InputLabel>
                            <Select label="Target Entity" labelId="relation-target-label" value={newRelationTarget} onChange={(e) => setNewRelationTarget(e.target.value)}>
                              {highlights
                              .filter((highlight) => selectedHighlight.id.split("_")[0] === highlight.id.split("_")[0] && highlight.id !== selectedHighlight.id).map((highlight) => (
                                <MenuItem key={highlight.id} value={highlight.id}>
                                  {highlight.comment + ': ' + highlight.content.text}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Button variant="contained" color="primary" onClick={handleAddRelation}>
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <p>No highlight selected.</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
              <IconButton 
                color="primary" 
                onClick={handleAddButtonClick} 
                style={{
                  borderRadius: '50%',  // Round border
                  border: '2px solid',   // Add border
                  padding: '0px',       // Ensure sufficient padding for round shape
                }}
              >
                <AddIcon />
              </IconButton>
            </div>
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'space-between', padding: "20px" }}>
          {tabValue === 0 && (
              <Button onClick={() => setConfirmOpen(true)} color="error" variant="contained">
                Delete
              </Button>
          )}
          <div></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleDialogClose} color="primary" variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleSaveAndReload} color="primary" variant="contained">
              Save & Reload
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle style={{ textAlign: 'center' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this highlight?
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

export default Sidebar;
