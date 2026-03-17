import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Paper,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import axiosInstance from '../axiosSetup';
import { 
  SmartToy as RobotIcon, 
  Storage as DbIcon, 
  ContentCopy as CopyIcon,
  Description as TextIcon,
  Code as JsonIcon,
  Visibility as EyeIcon,
  Close as CloseIcon,
  MergeType as MergeIcon,
  EditNote as EditNoteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import BratEmbeddingDefault from '../pdf_highlighter/components/BratEmbeddingDefault';
import SplitButton from './SplitButton';
import EditedEntityComponent from './EditedEntityComponent';
import { GlobalContext } from '../GlobalState';
import MergePreviewDialog, {
  MergePreviewData,
  MergeOptions,
  MergeResult,
  getSampleMergePreviewData
} from './MergePreviewDialog';

// Re-export for backwards compatibility
export type { MergeOptions, MergeResult, MergePreviewData };

// ⬇️ Define interfaces based on the API response structure
export interface ParagraphObject {
  text: string;
  entities: any[]; // BRAT format list
  relations: any[]; // BRAT format list
  raw_json: string;
}

export interface ComparisonData {
  llm_text: ParagraphObject;
  model_output: ParagraphObject;
}

// Merge API response structure (similar to /get-document/{document_id})
export interface MergeApiResponse {
  brat_format_output: any[];
  tables: any[];
  document_id: string;
  update_id: number;
  filename: string;
  llm_texts: any[];
  pdf_format_output: any[];
}

interface TwoSideComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  // ⬇️ Now accepts the full API response object instead of raw highlights
  data: ComparisonData | null;
  modelParaId: number;
  // Required props for merge API
  documentId: string | null;
  updateId: number;
  llmTextId: string;
  // Callback when merge is successful - receives the updated data
  onMergeSuccess?: (response: MergeApiResponse) => void;
  onMerge?: (options: MergeOptions) => Promise<MergeResult>;
  onEntityUpdate?: (side: 'llm' | 'model', entityIndex: number, updatedEntity: any, updatedRelations: any[]) => void;
}

// Interface for parsed entity
interface ParsedEntity {
  id: string;
  type: string;
  text: string;
  start: number;
  end: number;
  relations: ParsedRelation[];
}

interface ParsedRelation {
  id: string;
  type: string;
  arg1_id: string;
  arg2_id: string;
  arg1_text?: string;
  arg2_text?: string;
  arg1_type?: string;
  arg2_type?: string;
}

// Helper function to parse BRAT format entities and relations
const parseBratData = (entities: any[], relations: any[], text: string): ParsedEntity[] => {
  // Create entity map
  const entityMap: Record<string, ParsedEntity> = {};
  
  entities.forEach(entity => {
    const [id, type, spans] = entity;
    const [start, end] = spans[0];
    entityMap[id] = {
      id,
      type,
      text: text.slice(start, end),
      start,
      end,
      relations: []
    };
  });

  // Parse relations and attach to entities
  relations.forEach(relation => {
    const [relId, relType, args] = relation;
    const [arg1, arg2] = args;
    const [, arg1_id] = arg1;
    const [, arg2_id] = arg2;
    
    const parsedRelation: ParsedRelation = {
      id: relId,
      type: relType,
      arg1_id,
      arg2_id,
      arg1_text: entityMap[arg1_id]?.text,
      arg2_text: entityMap[arg2_id]?.text,
      arg1_type: entityMap[arg1_id]?.type,
      arg2_type: entityMap[arg2_id]?.type
    };

    // Add relation to arg1 entity
    if (entityMap[arg1_id]) {
      entityMap[arg1_id].relations.push(parsedRelation);
    }
  });

  return Object.values(entityMap);
};

// --- Sub-components ---

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Copy JSON"}>
      <IconButton size="small" onClick={handleCopy} sx={{ ml: 1 }}>
        <CopyIcon fontSize="small" color={copied ? "success" : "action"} />
      </IconButton>
    </Tooltip>
  );
};

const SectionHeader = ({ icon, title, action }: { icon: React.ReactNode, title: string, action?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 'auto' }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', ml: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
        {title}
      </Typography>
    </Box>
    {action}
  </Box>
);

// Entity Edit Dialog Component
interface EntityEditDialogProps {
  open: boolean;
  onClose: () => void;
  entity: ParsedEntity | null;
  allEntities: ParsedEntity[];
  entityTypes: string[];
  relationTypes: string[];
  onSave: (updatedEntity: ParsedEntity, tabValue: number) => Promise<void>;
  onDelete: (entity: ParsedEntity) => void;
  side: 'llm' | 'model';
  paragraphText: string;
}

const EntityEditDialog: React.FC<EntityEditDialogProps> = ({
  open,
  onClose,
  entity,
  allEntities,
  entityTypes,
  relationTypes,
  onSave,
  onDelete,
  side,
  paragraphText
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [editableType, setEditableType] = useState('');
  const [editableRelations, setEditableRelations] = useState<ParsedRelation[]>([]);
  const [showAddRelationRow, setShowAddRelationRow] = useState(false);
  const [newRelationType, setNewRelationType] = useState('');
  const [newRelationTarget, setNewRelationTarget] = useState('');
  const [editingRelationIndex, setEditingRelationIndex] = useState<number | null>(null);
  const [editedRelationType, setEditedRelationType] = useState('');
  const [selectionStart, setSelectionStart] = useState<number>(0);
  const [selectionEnd, setSelectionEnd] = useState<number>(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (entity) {
      setEditableType(entity.type);
      setEditableRelations([...entity.relations]);
      setSelectionStart(entity.start);
      setSelectionEnd(entity.end);
    }
  }, [entity]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEntitySelectionChange = (start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const handleSave = async () => {
    if (entity) {
      const updatedEntity: ParsedEntity = {
        ...entity,
        type: editableType,
        start: selectionStart,
        end: selectionEnd,
        text: paragraphText.slice(selectionStart, selectionEnd),
        relations: editableRelations
      };
      
      // Pass both the entity and the current tab to the save handler
      // Tab 0 = Entity, Tab 1 = Relations
      await onSave(updatedEntity, tabValue);
    }
    handleClose();
  };

  const handleClose = () => {
    setTabValue(0);
    setShowAddRelationRow(false);
    setNewRelationType('');
    setNewRelationTarget('');
    setConfirmDeleteOpen(false);
    onClose();
  };

  const handleDelete = () => {
    if (entity) {
      onDelete(entity);
    }
    setConfirmDeleteOpen(false);
    handleClose();
  };

  const handleEditRelation = (index: number) => {
    setEditingRelationIndex(index);
    setEditedRelationType(editableRelations[index].type);
  };

  const handleSaveRelationType = () => {
    if (editingRelationIndex !== null) {
      const updated = [...editableRelations];
      updated[editingRelationIndex].type = editedRelationType;
      setEditableRelations(updated);
      setEditingRelationIndex(null);
    }
  };

  const handleDeleteRelation = (index: number) => {
    const updated = [...editableRelations];
    updated.splice(index, 1);
    setEditableRelations(updated);
  };

  const handleAddRelation = () => {
    if (newRelationType && newRelationTarget) {
      const targetEntity = allEntities.find(e => e.id === newRelationTarget);
      if (targetEntity && entity) {
        const newRelation: ParsedRelation = {
          id: `R${Date.now()}`,
          type: newRelationType,
          arg1_id: entity.id,
          arg2_id: newRelationTarget,
          arg1_text: entity.text,
          arg2_text: targetEntity.text,
          arg1_type: editableType,
          arg2_type: targetEntity.type
        };
        setEditableRelations([...editableRelations, newRelation]);
        setNewRelationType('');
        setNewRelationTarget('');
        setShowAddRelationRow(false);
      }
    }
  };

  if (!entity) return null;

  const sideLabel = side === 'llm' ? 'LLM Output' : 'Base Output';
  const isModelSide = side === 'model';
  const currentEntity = entity; // Create non-null reference for TypeScript

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle style={{ textAlign: 'center' }}>
          Edit Highlight - {sideLabel}
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
            {tabValue === 0
              ? `Edit entity type and position. Changes will update the ${isModelSide ? 'base output' : 'LLM output'}.`
              : `Edit relations. Changes will update the ${isModelSide ? 'base output' : 'LLM output'}.`}
          </Typography>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Entity and Relation tabs">
            <Tab label="Entity" />
            <Tab label="Relation" />
          </Tabs>

          {/* Entity Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0} id="entity-tabpanel" aria-labelledby="entity-tab">
            <FormControl fullWidth margin="normal">
              <InputLabel id="entity-type-label">Entity Type</InputLabel>
              <Select
                labelId="entity-type-label"
                value={editableType}
                onChange={(e) => setEditableType(e.target.value)}
                label="Entity Type"
                fullWidth
              >
                {entityTypes.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <EditedEntityComponent
              text={paragraphText}
              defaultStart={currentEntity.start}
              defaultEnd={currentEntity.end}
              onTextChange={(newText) => { console.log("Text changed:", newText); }}
              onSelectionChange={handleEntitySelectionChange}
              entityType={editableType}
            />
          </Box>

          {/* Relations Tab */}
          <Box role="tabpanel" hidden={tabValue !== 1} id="relation-tabpanel" aria-labelledby="relation-tab">
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table sx={{ minWidth: 650 }} aria-label="relations table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>Subject Entity</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Relation</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Object Entity</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editableRelations.map((relation, index) => (
                    <TableRow key={relation.id}>
                      <TableCell>
                        <SplitButton
                          filledText={editableType}
                          outlinedText={
                            paragraphText.slice(selectionStart, selectionEnd).length > 30
                              ? `${paragraphText.slice(selectionStart, selectionEnd).slice(0, 30).trim()}...`
                              : paragraphText.slice(selectionStart, selectionEnd)
                          }
                          entityType={editableType}
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
                              {relationTypes.map(rt => (
                                <MenuItem key={rt} value={rt}>{rt}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <span 
                            onClick={() => handleEditRelation(index)}
                            style={{ cursor: 'pointer' }}
                          >
                            {relation.type}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <SplitButton
                          filledText={relation.arg2_type || ''}
                          outlinedText={
                            (relation.arg2_text || '').length > 30
                              ? `${(relation.arg2_text || '').slice(0, 30).trim()}...`
                              : relation.arg2_text || ''
                          }
                          entityType={relation.arg2_type || ''}
                        />
                      </TableCell>
                      <TableCell>
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
                          filledText={editableType}
                          outlinedText={
                            paragraphText.slice(selectionStart, selectionEnd).length > 30
                              ? `${paragraphText.slice(selectionStart, selectionEnd).slice(0, 30).trim()}...`
                              : paragraphText.slice(selectionStart, selectionEnd)
                          }
                          entityType={editableType}
                        />
                      </TableCell>
                      <TableCell style={{ minWidth: '110px' }}>
                        <FormControl fullWidth>
                          <InputLabel id="relation-type-label">Relation Type</InputLabel>
                          <Select
                            labelId="relation-type-label"
                            value={newRelationType}
                            label="Relation Type"
                            onChange={(e) => setNewRelationType(e.target.value)}
                          >
                            {relationTypes.map(rt => (
                              <MenuItem key={rt} value={rt}>{rt}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell style={{ minWidth: '110px' }}>
                        <FormControl fullWidth>
                          <InputLabel id="relation-target-label">Target Entity</InputLabel>
                          <Select
                            label="Target Entity"
                            labelId="relation-target-label"
                            value={newRelationTarget}
                            onChange={(e) => setNewRelationTarget(e.target.value)}
                          >
                            {allEntities.filter(e => e.id !== currentEntity.id).map(e => (
                              <MenuItem key={e.id} value={e.id}>
                                {e.type}: {e.text.length > 30 ? `${e.text.slice(0, 30)}...` : e.text}
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
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
              <IconButton
                color="primary"
                onClick={() => setShowAddRelationRow(true)}
                style={{
                  borderRadius: '50%',
                  border: '2px solid',
                  padding: '0px',
                }}
              >
                <AddIcon />
              </IconButton>
            </div>
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'space-between', padding: "20px" }}>
          {tabValue === 0 && (
            <Button onClick={() => setConfirmDeleteOpen(true)} color="error" variant="contained">
              Delete Entity
            </Button>
          )}
          <div></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleClose} color="primary" variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleSave} color="primary" variant="contained">
              {tabValue === 1 
                ? `Save Relations & Reload`
                : `Save Entity & Reload`}
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle style={{ textAlign: 'center' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this highlight?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Add Entity Dialog Component
interface AddEntityDialogProps {
  open: boolean;
  onClose: () => void;
  entityTypes: string[];
  onSave: (newEntity: { type: string; start: number; end: number; text: string }) => void;
  side: 'llm' | 'model';
  paragraphText: string;
}

const AddEntityDialog: React.FC<AddEntityDialogProps> = ({
  open,
  onClose,
  entityTypes,
  onSave,
  side,
  paragraphText
}) => {
  const [entityType, setEntityType] = useState('');
  const [selectionStart, setSelectionStart] = useState<number>(0);
  const [selectionEnd, setSelectionEnd] = useState<number>(0);

  useEffect(() => {
    if (open && entityTypes.length > 0) {
      setEntityType(entityTypes[0]);
      setSelectionStart(0);
      setSelectionEnd(0);
    }
  }, [open, entityTypes]);

  const handleSelectionChange = (start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const handleSave = () => {
    if (selectionStart !== selectionEnd && entityType) {
      onSave({
        type: entityType,
        start: selectionStart,
        end: selectionEnd,
        text: paragraphText.slice(selectionStart, selectionEnd)
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setEntityType(entityTypes.length > 0 ? entityTypes[0] : '');
    setSelectionStart(0);
    setSelectionEnd(0);
    onClose();
  };

  const sideLabel = side === 'llm' ? 'LLM Output' : 'Base Output';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle style={{ textAlign: 'center' }}>
        Add New Entity - {sideLabel}
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel id="new-entity-type-label">Entity Type</InputLabel>
          <Select
            labelId="new-entity-type-label"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            label="Entity Type"
            fullWidth
          >
            {entityTypes.map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <EditedEntityComponent
          text={paragraphText}
          defaultStart={selectionStart}
          defaultEnd={selectionEnd}
          onTextChange={(newText) => { console.log("Text changed:", newText); }}
          onSelectionChange={handleSelectionChange}
          entityType={entityType}
        />

        {selectionStart === selectionEnd && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Please select a span of text to create an entity.
          </Typography>
        )}
      </DialogContent>
      <DialogActions style={{ justifyContent: 'flex-end', padding: "20px" }}>
        <Button onClick={handleClose} color="primary" variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={selectionStart === selectionEnd || !entityType}
        >
          Add Entity
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Entity List Item Component
interface EntityListItemProps {
  entity: ParsedEntity;
  headerColor: string;
  onEditClick: () => void;
}

const EntityListItem: React.FC<EntityListItemProps> = ({ entity, headerColor, onEditClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 1,
        borderLeft: `4px solid ${headerColor}`,
        '&:hover': { bgcolor: '#f5f5f5' }
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <span className={`entity_point ${entity.type}`} style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}></span>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {entity.type}
            </Typography>
            {entity.relations.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                ({entity.relations.length} relation{entity.relations.length > 1 ? 's' : ''})
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: expanded ? 'normal' : 'nowrap'
            }}
          >
            {entity.text}
          </Typography>

          {/* Relations */}
          {entity.relations.length > 0 && (
            <Collapse in={expanded}>
              <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                {entity.relations.map((rel, idx) => (
                  <Box key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {rel.type}
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 1 }}>
                      <strong>{rel.arg2_type}:</strong> {rel.arg2_text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Edit entity">
            <IconButton size="small" color="primary" onClick={onEditClick}>
              <EditNoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {entity.relations.length > 0 && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// Entity List Section Component
interface EntityListSectionProps {
  entities: ParsedEntity[];
  headerColor: string;
  onEntityEdit: (entity: ParsedEntity) => void;
  onAddEntity: () => void;
}

const EntityListSection: React.FC<EntityListSectionProps> = ({ entities, headerColor, onEntityEdit, onAddEntity }) => {
  return (
    <Box>
      {entities.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No entities found
        </Typography>
      ) : (
        entities.map((entity) => (
          <EntityListItem
            key={entity.id}
            entity={entity}
            headerColor={headerColor}
            onEditClick={() => onEntityEdit(entity)}
          />
        ))
      )}

      {/* Add New Entity Button */}
      {/* <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
        <Tooltip title="Add new entity">
          <IconButton
            color="primary"
            onClick={onAddEntity}
            sx={{
              borderRadius: '50%',
              border: '2px solid',
              padding: '4px',
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
       */}

    </Box>
  );
};

const ComparisonColumn = ({ 
  title, 
  subtitle,
  headerColor, 
  headerIcon,
  paragraphData,
  parsedEntities,
  onEntityEdit,
  onAddEntity,
  showEntityList
}: { 
  title: string, 
  subtitle?: string,
  headerColor: string, 
  headerIcon: React.ReactNode,
  paragraphData: ParagraphObject,
  parsedEntities: ParsedEntity[],
  onEntityEdit: (entity: ParsedEntity) => void,
  onAddEntity: () => void,
  showEntityList: boolean
}) => {
  return (
    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card 
        variant="outlined" 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          borderRadius: 2,
          overflow: 'hidden',
          borderColor: 'divider'
        }}
      >
        {/* Column Header */}
        <Box sx={{ 
          bgcolor: headerColor, 
          color: '#fff', 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1
        }}>
          {headerIcon}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {subtitle}
                </Typography>
            )}
          </Box>
        </Box>

        <CardContent sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2,
          bgcolor: '#fafafa',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' },
        }}>
          
          {/* 1. Source Text */}
          <SectionHeader icon={<TextIcon fontSize="small" />} title="Source Text" />
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: '#fff',
              minHeight: '80px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              borderLeft: `4px solid ${headerColor}`
            }}
          >
            {paragraphData.text || <Typography color="text.disabled" variant="body2">No text content available.</Typography>}
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* 2. Brat Visualization */}
          <SectionHeader icon={<EyeIcon fontSize="small" />} title="Visualization" />
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1, 
              bgcolor: '#fff', 
              overflowX: 'auto',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center', 
              justifyContent: 'flex-start' 
            }}
          >
             {paragraphData.text ? (
               <Box sx={{ width: '100%' }}>
                 {/* Pass the paragraphData directly as it matches docData structure */}
                 <BratEmbeddingDefault docData={paragraphData} />
               </Box>
             ) : (
               <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', width: '100%', textAlign: 'center' }}>
                 Visualization unavailable (missing entities/text)
               </Typography>
             )}
          </Paper>

          {/* 3. Entity List (shown when edit mode is active) */}
          {showEntityList && (
            <>
              <Divider sx={{ my: 3 }} />
              <SectionHeader 
                icon={<EditNoteIcon fontSize="small" />} 
                title={`Entities (${parsedEntities.length})`} 
              />
              <EntityListSection
                entities={parsedEntities}
                headerColor={headerColor}
                onEntityEdit={onEntityEdit}
                onAddEntity={onAddEntity}
              />
            </>
          )}

          {/* 4. Raw JSON (hidden when edit mode is active) */}
          {!showEntityList && (
            <>
              <Divider sx={{ my: 3 }} />
              <SectionHeader 
                icon={<JsonIcon fontSize="small" />} 
                title="Raw JSON" 
                action={<CopyButton text={paragraphData.raw_json} />} 
              />
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#282c34', // Dark theme for code
                  color: '#abb2bf',
                  borderRadius: 2,
                  position: 'relative'
                }}
              >
                <pre style={{ margin: 0, fontFamily: 'Consolas, Monaco, "Andale Mono", monospace', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {paragraphData.raw_json}
                </pre>
              </Paper>
            </>
          )}

        </CardContent>
      </Card>
    </Grid>
  );
};

// --- Main Dialog Component ---

const TwoSideComparisonDialog: React.FC<TwoSideComparisonDialogProps> = ({
  open,
  onClose,
  data,
  modelParaId,
  documentId,
  updateId,
  llmTextId,
  onMergeSuccess,
  onMerge,
  onEntityUpdate,
}) => {
  // Local comparison data state (synced with prop)
  const [currentData, setCurrentData] = useState<ComparisonData | null>(data);

  // Sync local state when prop changes
  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  // Merge Preview Dialog state
  const [isMergePreviewOpen, setIsMergePreviewOpen] = useState(false);
  const [mergePreviewData, setMergePreviewData] = useState<MergePreviewData | null>(null);
  const [isMergePreviewLoading, setIsMergePreviewLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  const [showEntityList, setShowEntityList] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addEntityDialogOpen, setAddEntityDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<ParsedEntity | null>(null);
  const [selectedSide, setSelectedSide] = useState<'llm' | 'model'>('llm');
  
  // Snackbar state for error messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error');

  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
    };
  }, []);

  // Get settings and state setters from global context
  const globalContext = useContext(GlobalContext);
  const settings = globalContext?.settings;

  // Entity and relation types from settings
  type EntityDef = { type: string; labels?: string[]; [k: string]: any };
  type RelationDef = { type: string; labels?: string[]; [k: string]: any };

  const entityTypes = useMemo<string[]>(
    () => ((settings?.entity_types as EntityDef[] | undefined)?.map(e => e.type)) ?? [
      'POLYMER', 'POLYMER_FAMILY', 'MONOMER', 'PROP_NAME', 'PROP_VALUE',
      'MATERIAL_AMOUNT', 'CONDITION', 'REF_EXP', 'OTHER'
    ],
    [settings?.entity_types]
  );

  const relationTypes = useMemo<string[]>(
    () => {
      const base = ((settings?.relation_types as RelationDef[] | undefined)?.map(r => r.type)) ?? [
        "has_property", "has_value", "has_amount", "has_condition",
        "abbreviation_of", "refers_to", "synthesised_by", "characterized_by"
      ];
      return base;
    },
    [settings?.relation_types]
  );

  // Parse entities from BRAT format (use currentData instead of data)
  const llmEntities = useMemo(() => {
    if (!currentData?.llm_text) return [];
    return parseBratData(currentData.llm_text.entities || [], currentData.llm_text.relations || [], currentData.llm_text.text || '');
  }, [currentData?.llm_text]);

  const modelEntities = useMemo(() => {
    if (!currentData?.model_output) return [];
    return parseBratData(currentData.model_output.entities || [], currentData.model_output.relations || [], currentData.model_output.text || '');
  }, [currentData?.model_output]);

  // --- Merge Preview Handlers ---
  const handleOpenMergePreview = async () => {
    setIsMergePreviewOpen(true);
    setIsMergePreviewLoading(true);
    setMergeResult(null);
    
    try {
      // TODO: Replace with actual API call
      // const response = await axiosInstance.post('/merge-preview', { ... });
      // setMergePreviewData(response.data);
      
      // For now, use sample data
      if (currentData) {
        const sampleData = getSampleMergePreviewData(currentData.llm_text, currentData.model_output);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setMergePreviewData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching merge preview:', error);
      setMergePreviewData(null);
    } finally {
      setIsMergePreviewLoading(false);
    }
  };

  const handleCloseMergePreview = () => {
    setIsMergePreviewOpen(false);
    setMergePreviewData(null);
    setMergeResult(null);
  };

  const handleConfirmMergeFromPreview = async () => {
    setIsMerging(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // Prepare the payload for merge API
      const payload = {
        document_id: documentId,
        update_id: updateId,
        llm_text_id: llmTextId,
        paragraph_id: modelParaId
      };

      // Call the merge API
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/merge_LLM_result`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Set success result
      setMergeResult({
        success: true,
        message: 'Merge completed successfully!',
        mergedEntities: mergePreviewData?.merge_info?.new_entities_added,
        mergedRelations: mergePreviewData?.merge_info?.new_relations_added
      });


      // Call the onMergeSuccess callback with the response data
      if (onMergeSuccess) {
        onMergeSuccess(response.data);
      }

      mergeTimerRef.current = setTimeout(() => {
        handleCloseMergePreview();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error during merge:', error);
      setMergeResult({
        success: false,
        message: error.response?.data?.message || 'An unexpected error occurred during merge.'
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleToggleEditMode = () => {
    setShowEntityList(!showEntityList);
  };

  const handleEntityEdit = (entity: ParsedEntity, side: 'llm' | 'model') => {
    setSelectedEntity(entity);
    setSelectedSide(side);
    setEditDialogOpen(true);
  };

  const handleAddEntity = (side: 'llm' | 'model') => {
    setSelectedSide(side);
    setAddEntityDialogOpen(true);
  };

  const handleAddEntitySave = (newEntity: { type: string; start: number; end: number; text: string }) => {
    // Handle new entity creation - can be extended with onEntityAdd prop if needed
    console.log('Add new entity:', newEntity, 'side:', selectedSide);
    setAddEntityDialogOpen(false);
  };

  const handleEntitySave = async (updatedEntity: ParsedEntity, tabValue: number) => {
    try {
      setIsMerging(true);
      const token = localStorage.getItem('accessToken');
      let response;

      if (selectedSide === 'llm') {
        // LLM side: Use LLM-specific API endpoints
        // Tab 0 = Entity, Tab 1 = Relations
        if (tabValue === 1) {
          // Update LLM relations
          const payload = {
            document_id: documentId,
            update_id: updateId,
            entity_id: `${llmTextId}_${updatedEntity.id}`,
            llm_text_id: llmTextId,
            paragraph_id: modelParaId,
            relations: updatedEntity.relations.map(rel => ({
              type: rel.type,
              arg_type: rel.arg2_type || '',
              arg_id: `${llmTextId}_${rel.arg2_id}`,
              arg_text: rel.arg2_text || ''
            }))
          };

          response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/update-LLM-output-relation`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('LLM relations updated successfully:', response.data);
          
        } else {
          // Update LLM entity (type, position)
          const payload = {
            document_id: documentId,
            update_id: updateId,
            id: updatedEntity.id,
            head_pos: updatedEntity.start,
            tail_pos: updatedEntity.end,
            type: updatedEntity.type,
            user_comment: '',
            llm_text_id: llmTextId,
            paragraph_id: modelParaId
          };

          response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/update-LLM-output-entity`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('LLM entity updated successfully:', response.data);
        }
        
        // Call onMergeSuccess to refresh the document state
        if (onMergeSuccess) {
          onMergeSuccess(response.data);
        }

        // Close dialogs
        setEditDialogOpen(false);
        setSelectedEntity(null);
        
        // Close comparison dialog to return to main view
        onClose();
        
      } else {
        // Model side: Use existing model API endpoints
        // Tab 0 = Entity, Tab 1 = Relations
        if (tabValue === 1) {
          // Update model relations
          const payload = {
            document_id: documentId,
            update_id: updateId,
            entity_id: `para${modelParaId}_${updatedEntity.id}`,
            relations: updatedEntity.relations.map(rel => ({
              type: rel.type,
              arg_type: rel.arg2_type || '',
              arg_id: `para${modelParaId}_${rel.arg2_id}`,
              arg_text: rel.arg2_text || ''
            }))
          };

          response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/update-relations`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('Model relations updated successfully:', response.data);
          
        } else {
          // Update model entity (type, position)
          const payload = {
            document_id: documentId,
            update_id: updateId,
            id: `para${modelParaId}_${updatedEntity.id}`,
            head_pos: updatedEntity.start,
            tail_pos: updatedEntity.end,
            type: updatedEntity.type,
            user_comment: ''
          };

          response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/update-entity`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('Model entity updated successfully:', response.data);
        }
        
        // Call onMergeSuccess to refresh the document state
        if (onMergeSuccess) {
          onMergeSuccess(response.data);
        }

        // Close dialogs
        setEditDialogOpen(false);
        setSelectedEntity(null);
        
        // Close comparison dialog to return to main view
        onClose();
      }
      
    } catch (error) {
      console.error('Error updating entity/relations:', error);
      setSnackbarMessage('Failed to update. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsMerging(false);
    }
  };

  const handleEntityDelete = async (entity: ParsedEntity) => {
    try {
      setIsMerging(true);
      const token = localStorage.getItem('accessToken');
      let response;

      if (selectedSide === 'llm') {
        // LLM side: Use LLM-specific delete API
        const payload = {
          document_id: documentId,
          update_id: updateId,
          ids: [entity.id],
          llm_text_id: llmTextId,
          paragraph_id: modelParaId
        };

        response = await axiosInstance.post(
          `${import.meta.env.VITE_BACKEND_URL}/delete-LLM-output-entity`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('LLM entity deleted successfully:', response.data);
        
        // Call onMergeSuccess to refresh the document state
        if (onMergeSuccess) {
          onMergeSuccess(response.data);
        }

        // Close dialogs
        setEditDialogOpen(false);
        setSelectedEntity(null);
        
        // Close comparison dialog to return to main view
        onClose();
        
      } else {
        // Model side: Use existing model delete API
        const payload = {
          document_id: documentId,
          update_id: updateId,
          ids: [`para${modelParaId}_${entity.id}`]
        };

        response = await axiosInstance.post(
          `${import.meta.env.VITE_BACKEND_URL}/delete-entity`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('Model entity deleted successfully:', response.data);
        
        // Call onMergeSuccess to refresh the document state
        if (onMergeSuccess) {
          onMergeSuccess(response.data);
        }

        // Close dialogs
        setEditDialogOpen(false);
        setSelectedEntity(null);
        
        // Close comparison dialog to return to main view
        onClose();
      }
      
    } catch (error) {
      console.error('Error deleting entity:', error);
      setSnackbarMessage('Failed to delete entity. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsMerging(false);
    }
  };

  // Get paragraph text for the selected side
  const getSelectedParagraphText = () => {
    if (selectedSide === 'llm') {
      return currentData?.llm_text?.text || '';
    }
    return currentData?.model_output?.text || '';
  };

  if (!currentData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        style: { height: '90vh', borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2,
        borderBottom: '1px solid #eee'
      }}>
        <Box>
            <Typography variant="h6" fontWeight="bold">
            Extraction Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
            Compare and merge LLM additional content into base extraction results
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={showEntityList ? "Hide entity list" : "Show entity list for editing"}>
              <IconButton 
                onClick={handleToggleEditMode}
                color={showEntityList ? "primary" : "default"}
                sx={{ 
                  border: showEntityList ? '2px solid' : '1px solid #ccc',
                  borderRadius: 1
                }}
              >
                <EditNoteIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
                <CloseIcon />
            </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, height: '100%', overflow: 'hidden', bgcolor: '#f0f2f5' }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          
          {/* Left: LLM (additional content to merge into base) */}
          <ComparisonColumn
            title="LLM Output"
            subtitle="Additional content to compare & merge"
            headerColor="#1976d2" // Blue
            headerIcon={<RobotIcon />}
            paragraphData={currentData.llm_text}
            parsedEntities={llmEntities}
            onEntityEdit={(entity) => handleEntityEdit(entity, 'llm')}
            onAddEntity={() => handleAddEntity('llm')}
            showEntityList={showEntityList}
          />

          {/* Right: Base extraction results */}
          <ComparisonColumn
            title="Base Output"
            subtitle={`Paragraph ID: ${modelParaId}`}
            headerColor="#ed6c02" // Orange
            headerIcon={<DbIcon />}
            paragraphData={currentData.model_output}
            parsedEntities={modelEntities}
            onEntityEdit={(entity) => handleEntityEdit(entity, 'model')}
            onAddEntity={() => handleAddEntity('model')}
            showEntityList={showEntityList}
          />

        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid #ddd', p: 2, bgcolor: '#fff', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close Comparison
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleOpenMergePreview}
            variant="contained"
            color="primary"
            startIcon={<MergeIcon />}
          >
            Merge LLM into Base
          </Button>
        </Box>
      </DialogActions>

      {/* Merge Preview Dialog */}
      <MergePreviewDialog
        open={isMergePreviewOpen}
        onClose={handleCloseMergePreview}
        previewData={mergePreviewData}
        isLoading={isMergePreviewLoading}
        isMerging={isMerging}
        mergeResult={mergeResult}
        onConfirmMerge={handleConfirmMergeFromPreview}
        entityTypes={entityTypes}
        relationTypes={relationTypes}
      />

      {/* Entity Edit Dialog */}
      <EntityEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedEntity(null);
        }}
        entity={selectedEntity}
        allEntities={selectedSide === 'llm' ? llmEntities : modelEntities}
        entityTypes={entityTypes}
        relationTypes={relationTypes}
        onSave={handleEntitySave}
        onDelete={handleEntityDelete}
        side={selectedSide}
        paragraphText={getSelectedParagraphText()}
      />

      {/* Add Entity Dialog */}
      <AddEntityDialog
        open={addEntityDialogOpen}
        onClose={() => setAddEntityDialogOpen(false)}
        entityTypes={entityTypes}
        onSave={handleAddEntitySave}
        side={selectedSide}
        paragraphText={getSelectedParagraphText()}
      />

      {/* Error/Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default TwoSideComparisonDialog;