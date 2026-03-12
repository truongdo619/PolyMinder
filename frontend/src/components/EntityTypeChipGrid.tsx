import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import { EntityTypeDef, getContrastColor } from '../lib/settingsHelpers';

interface EntityTypeChipGridProps {
  value: string;
  onChange: (type: string) => void;
  entityTypes: EntityTypeDef[];
}

const EntityTypeChipGrid = ({ value, onChange, entityTypes }: EntityTypeChipGridProps) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
      {entityTypes.map(et => {
        const selected = et.type === value;
        const fg = getContrastColor(et.bgColor);
        return (
          <Chip
            key={et.type}
            label={et.type}
            size="small"
            icon={selected ? <CheckIcon sx={{ fontSize: '12px !important', color: `${fg} !important`, ml: '6px !important' }} /> : undefined}
            onClick={() => onChange(et.type)}
            sx={{
              height: 26,
              fontSize: '0.72rem',
              fontWeight: selected ? 700 : 500,
              letterSpacing: selected ? '0.01em' : 0,
              backgroundColor: selected ? et.bgColor : 'rgba(0,0,0,0.04)',
              color: selected ? fg : '#444',
              border: `1.5px solid ${selected ? et.bgColor : 'rgba(0,0,0,0.15)'}`,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              boxShadow: selected ? `0 1px 4px ${et.bgColor}55` : 'none',
              '& .MuiChip-label': { px: selected ? 0.75 : 1 },
              '&:hover': {
                backgroundColor: et.bgColor,
                color: fg,
                borderColor: et.bgColor,
                boxShadow: `0 2px 6px ${et.bgColor}66`,
              },
            }}
          />
        );
      })}
    </Box>
  );
};

export default EntityTypeChipGrid;
