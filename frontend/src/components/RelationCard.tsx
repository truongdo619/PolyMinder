import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Relation, RelationTypeDef, EntityTypeDef, getContrastColor } from '../lib/settingsHelpers';

interface EntityChipProps {
  type: string;
  text: string;
  entityTypes: EntityTypeDef[];
}

const EntityChip = ({ type, text, entityTypes }: EntityChipProps) => {
  const def = entityTypes.find(e => e.type === type);
  const bg = def?.bgColor ?? '#ccc';
  const label = `${type}`;
  const fullLabel = text.length > 18 ? text.slice(0, 18) + '…' : text;
  return (
    <Tooltip title={`${type}: ${text}`} placement="top" arrow>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
        <Chip
          size="small"
          label={label}
          sx={{
            bgcolor: bg,
            color: getContrastColor(bg),
            fontSize: '0.65rem',
            fontWeight: 700,
            height: 18,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
        <Box component="span" sx={{ fontSize: '0.68rem', color: '#555', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {fullLabel}
        </Box>
      </Box>
    </Tooltip>
  );
};

interface RelationCardProps {
  relation: Relation;
  sourceType: string;
  sourceText: string;
  availableRelationTypes: RelationTypeDef[];
  entityTypes: EntityTypeDef[];
  onChange: (updated: Relation) => void;
  onDelete: () => void;
}

const RelationCard = ({
  relation,
  sourceType,
  sourceText,
  availableRelationTypes,
  entityTypes,
  onChange,
  onDelete,
}: RelationCardProps) => {
  const [editing, setEditing] = useState(false);

  const handleTypeChange = (newType: string) => {
    onChange({ ...relation, type: newType });
    setEditing(false);
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.75,
      py: 1,
      px: 0.5,
      borderBottom: '1px solid #f0f0f0',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <EntityChip type={sourceType} text={sourceText} entityTypes={entityTypes} />

      {editing ? (
        <Select
          size="small"
          value={relation.type}
          onChange={e => handleTypeChange(e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
          sx={{ minWidth: 120, fontSize: '0.75rem' }}
        >
          {availableRelationTypes.map(rt => (
            <MenuItem key={rt.type} value={rt.type} sx={{ fontSize: '0.8rem' }}>{rt.type}</MenuItem>
          ))}
        </Select>
      ) : (
        <Tooltip title="Click to change relation type" placement="top">
          <Box
            component="span"
            onClick={() => setEditing(true)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              fontStyle: 'italic',
              fontSize: '0.72rem',
              color: '#6c63ff',
              cursor: 'pointer',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              border: '1px dashed #c5c0ff',
              bgcolor: '#f5f4ff',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#eceaff', borderColor: '#6c63ff' },
            }}
          >
            {relation.type}
          </Box>
        </Tooltip>
      )}

      <Box component="span" sx={{ fontSize: '0.72rem', color: '#999' }}>▶</Box>

      <EntityChip type={relation.arg_type} text={relation.arg_text} entityTypes={entityTypes} />

      <IconButton
        size="small"
        color="error"
        onClick={onDelete}
        sx={{ ml: 'auto', p: 0.25, flexShrink: 0, opacity: 0.6, '&:hover': { opacity: 1 } }}
      >
        <DeleteIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};

export default RelationCard;
