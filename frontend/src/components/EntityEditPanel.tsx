import React, { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LabelIcon from '@mui/icons-material/Label';
import { CommentedHighlight } from '../types';
import { GlobalContext } from '../GlobalState';
import {
  EntityTypeDef,
  RelationTypeDef,
  Relation,
  EntityEditSaveData,
  toRelations,
  getRelationTypesForSource,
  getContrastColor,
} from '../lib/settingsHelpers';
import EntityTypeChipGrid from './EntityTypeChipGrid';
import RelationCard from './RelationCard';
import AddRelationRow from './AddRelationRow';
import SpanAdjustEditor from './SpanAdjustEditor';
import ParagraphBratPreview from './ParagraphBratPreview';

interface EntityEditPanelProps {
  highlight: CommentedHighlight;
  allHighlights: CommentedHighlight[];
  paragraphText: string;
  headPos: number;
  tailPos: number;
  paragraphData: { text: string; entities: unknown[]; relations?: unknown[] } | null;
  onSave: (data: EntityEditSaveData) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

const SectionHeader = ({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.5,
    py: 0.75,
    bgcolor: '#f5f5f5',
    borderTop: '1px solid #e8e8e8',
    borderBottom: '1px solid #e8e8e8',
    flexShrink: 0,
  }}>
    <Box sx={{ color: '#666', display: 'flex', alignItems: 'center', fontSize: 16 }}>{icon}</Box>
    <Typography variant="caption" fontWeight={600} sx={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', fontSize: '0.7rem' }}>
      {label}
    </Typography>
    {action}
  </Box>
);

const EntityEditPanel = ({
  highlight,
  allHighlights,
  paragraphText,
  headPos,
  tailPos,
  paragraphData,
  onSave,
  onDelete,
  onClose,
}: EntityEditPanelProps) => {
  const globalContext = useContext(GlobalContext);
  if (!globalContext) throw new Error('GlobalContext required');
  const { settings } = globalContext;

  const entityTypes = (settings?.entity_types as EntityTypeDef[] | undefined) ?? [];
  const allRelationTypes = (settings?.relation_types as RelationTypeDef[] | undefined) ?? [];

  const [entityType, setEntityType] = useState(highlight.comment ?? '');
  const [userComment, setUserComment] = useState(highlight.user_comment ?? '');
  const [currentHeadPos, setCurrentHeadPos] = useState(headPos);
  const [currentTailPos, setCurrentTailPos] = useState(tailPos);
  const [relations, setRelations] = useState<Relation[]>(toRelations(highlight.relations ?? []));
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const paraHighlights = allHighlights.filter(h =>
    h.id.split('_')[0] === highlight.id.split('_')[0]
  );

  const availableRelationTypes = getRelationTypesForSource(allRelationTypes, entityType);

  // Track whether anything has actually changed
  const origRelations = toRelations(highlight.relations ?? []);
  const hasChanges =
    entityType !== (highlight.comment ?? '') ||
    userComment !== (highlight.user_comment ?? '') ||
    currentHeadPos !== headPos ||
    currentTailPos !== tailPos ||
    JSON.stringify(relations) !== JSON.stringify(origRelations);

  const currentTypeDef = entityTypes.find(e => e.type === entityType);
  const typeBg = currentTypeDef?.bgColor ?? '#888';
  const typeFg = getContrastColor(typeBg);

  const handleRelationChange = (index: number, updated: Relation) => {
    setRelations(prev => prev.map((r, i) => (i === index ? updated : r)));
  };

  const handleRelationDelete = (index: number) => {
    setRelations(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRelation = (relation: Relation) => {
    setRelations(prev => [...prev, relation]);
    setShowAddRelation(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ entityType, userComment, headPos: currentHeadPos, tailPos: currentTailPos, relations });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const entityText = highlight.content.text ?? '';
  const shortTitle = entityText.length > 36 ? entityText.slice(0, 36) + '…' : entityText;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: '#fff' }}>

      {/* ── Header ── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1.25,
        borderBottom: '2px solid #e0e0e0',
        flexShrink: 0,
        bgcolor: '#fafafa',
      }}>
        <Chip
          label={entityType}
          size="small"
          sx={{
            bgcolor: typeBg,
            color: typeFg,
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#222' }}
          title={entityText}
        >
          "{shortTitle}"
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0, color: '#666' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* BRAT preview */}
        {paragraphData && (
          <Box sx={{ px: 0.5, py: 1 }}>
            <ParagraphBratPreview
              paragraphData={paragraphData}
              highlight={highlight}
              currentEntityType={entityType}
              currentRelations={relations}
              currentHeadPos={currentHeadPos}
              currentTailPos={currentTailPos}
            />
          </Box>
        )}

        {/* Entity Type section */}
        <SectionHeader icon={<LabelIcon sx={{ fontSize: 16 }} />} label="Entity Type" />
        <Box sx={{ px: 1.5, py: 1.25 }}>
          <EntityTypeChipGrid value={entityType} onChange={setEntityType} entityTypes={entityTypes} />
        </Box>

        {/* Relations section */}
        <SectionHeader
          icon={<AccountTreeIcon sx={{ fontSize: 16 }} />}
          label={`Relations${relations.length > 0 ? ` (${relations.length})` : ''}`}
          action={
            <IconButton
              size="small"
              onClick={() => setShowAddRelation(v => !v)}
              title="Add relation"
              sx={{ p: 0.25, color: showAddRelation ? 'primary.main' : '#666' }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          }
        />
        <Box sx={{ px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {relations.length === 0 && !showAddRelation && (
            <Typography variant="caption" color="textSecondary" sx={{ py: 0.5, display: 'block' }}>
              No relations. Click + to add one.
            </Typography>
          )}
          {relations.map((rel, i) => (
            <RelationCard
              key={i}
              relation={rel}
              sourceType={entityType}
              sourceText={entityText}
              availableRelationTypes={availableRelationTypes}
              entityTypes={entityTypes}
              onChange={updated => handleRelationChange(i, updated)}
              onDelete={() => handleRelationDelete(i)}
            />
          ))}
          {showAddRelation && (
            <AddRelationRow
              sourceHighlight={{ ...highlight, comment: entityType }}
              paragraphHighlights={paraHighlights}
              allRelationTypes={allRelationTypes}
              entityTypes={entityTypes}
              onAdd={handleAddRelation}
              onCancel={() => setShowAddRelation(false)}
            />
          )}
        </Box>

        {/* Span adjustment */}
        <Divider />
        <Box sx={{ px: 1.5, py: 1 }}>
          <SpanAdjustEditor
            paragraphText={paragraphText}
            headPos={currentHeadPos}
            tailPos={currentTailPos}
            entityType={entityType}
            onChange={(h, t) => { setCurrentHeadPos(h); setCurrentTailPos(t); }}
          />
        </Box>

        {/* User note */}
        <Divider />
        <Box sx={{ px: 1.5, py: 1 }}>
          <TextField
            label="User Note (optional)"
            value={userComment}
            onChange={e => setUserComment(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
          />
        </Box>

      </Box>

      {/* ── Footer ── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        py: 1,
        borderTop: '2px solid #e0e0e0',
        gap: 1,
        flexShrink: 0,
        bgcolor: '#fafafa',
      }}>
        {confirmDelete ? (
          <>
            <Typography variant="body2" sx={{ flex: 1, color: 'error.main', fontWeight: 500 }}>
              Delete this entity?
            </Typography>
            <Button size="small" variant="outlined" onClick={() => setConfirmDelete(false)}>No</Button>
            <Button size="small" color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              onClick={() => setConfirmDelete(true)}
              sx={{ minWidth: 80 }}
            >
              Delete
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" onClick={onClose} sx={{ minWidth: 70 }}>Cancel</Button>
            <Button
              size="small"
              color="primary"
              variant="contained"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              sx={{ minWidth: 70 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default EntityEditPanel;
