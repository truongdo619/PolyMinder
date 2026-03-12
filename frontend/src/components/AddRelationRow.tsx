import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import { CommentedHighlight } from '../types';
import {
  Relation,
  RelationTypeDef,
  EntityTypeDef,
  getRelationTypesForSource,
  getValidTargetTypesForRelation,
} from '../lib/settingsHelpers';

interface AddRelationRowProps {
  sourceHighlight: CommentedHighlight;
  paragraphHighlights: CommentedHighlight[];
  allRelationTypes: RelationTypeDef[];
  entityTypes: EntityTypeDef[];
  onAdd: (relation: Relation) => void;
  onCancel: () => void;
}

const AddRelationRow = ({
  sourceHighlight,
  paragraphHighlights,
  allRelationTypes,
  entityTypes: _entityTypes,
  onAdd,
  onCancel,
}: AddRelationRowProps) => {
  const [relationType, setRelationType] = useState('');
  const [targetId, setTargetId] = useState('');

  const sourceType = sourceHighlight.comment ?? '';
  const validRelationTypes = getRelationTypesForSource(allRelationTypes, sourceType);
  const validTargetTypes = relationType ? getValidTargetTypesForRelation(allRelationTypes, relationType) : [];
  const validTargets = paragraphHighlights.filter(h =>
    h.id !== sourceHighlight.id &&
    (validTargetTypes.includes('<ENTITY>') || validTargetTypes.includes(h.comment ?? ''))
  );

  const handleAdd = () => {
    const target = paragraphHighlights.find(h => h.id === targetId);
    if (!relationType || !targetId || !target) return;
    onAdd({
      type: relationType,
      arg_id: targetId,
      arg_type: target.comment ?? '',
      arg_text: target.content.text ?? '',
    });
    setRelationType('');
    setTargetId('');
  };

  return (
    <Box sx={{ border: '1px solid #e0d8ff', borderRadius: 1.5, p: 1.25, mt: 1, bgcolor: '#faf9ff' }}>
      <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
        + New Relation
      </Typography>
      {validRelationTypes.length === 0 ? (
        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No valid relation types for this entity type.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Relation Type</InputLabel>
            <Select
              value={relationType}
              label="Relation Type"
              onChange={e => { setRelationType(e.target.value); setTargetId(''); }}
              sx={{ fontSize: '0.8rem' }}
            >
              {validRelationTypes.map(rt => (
                <MenuItem key={rt.type} value={rt.type} sx={{ fontSize: '0.8rem' }}>{rt.type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }} disabled={!relationType}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Target Entity</InputLabel>
            <Select
              value={targetId}
              label="Target Entity"
              onChange={e => setTargetId(e.target.value)}
              sx={{ fontSize: '0.8rem' }}
            >
              {validTargets.length === 0 ? (
                <MenuItem disabled sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No valid targets</MenuItem>
              ) : (
                validTargets.map(h => (
                  <MenuItem key={h.id} value={h.id} sx={{ fontSize: '0.8rem' }}>
                    {h.comment}: {(h.content.text ?? '').slice(0, 22)}{(h.content.text ?? '').length > 22 ? '…' : ''}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              variant="contained"
              size="small"
              disabled={!relationType || !targetId}
              onClick={handleAdd}
              sx={{ minWidth: 56, fontSize: '0.78rem' }}
            >
              Add
            </Button>
            <Button size="small" onClick={onCancel} sx={{ fontSize: '0.78rem' }}>Cancel</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AddRelationRow;
