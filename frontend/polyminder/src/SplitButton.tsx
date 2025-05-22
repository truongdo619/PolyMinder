import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const entityTypeColors = {
  INORGANIC: { backgroundColor: '#00ffff', borderColor: '#00ffff', textColor: 'white' },
  REF_EXP: { backgroundColor: '#bd0ea5', borderColor: '#bd0ea5', textColor: 'white' },
  CONDITION: { backgroundColor: '#ffe000', borderColor: '#ffe000', textColor: 'white' },
  MATERIAL_AMOUNT: { backgroundColor: '#a0522d', borderColor: '#a0522d', textColor: 'white' },
  ORGANIC: { backgroundColor: '#ff00ff', borderColor: '#ff00ff', textColor: 'white' },
  POLYMER: { backgroundColor: '#ff4500', borderColor: '#ff4500', textColor: 'white' },
  PROP_NAME: { backgroundColor: '#1e90ff', borderColor: '#1e90ff', textColor: 'white' },
  CHAR_METHOD: { backgroundColor: 'rgb(160, 119, 138)', borderColor: 'rgb(160, 119, 138)', textColor: 'white' },
  POLYMER_FAMILY: { backgroundColor: '#00ff00', borderColor: '#00ff00', textColor: 'white' },
  PROP_VALUE: { backgroundColor: '#ffd700', borderColor: '#ffd700', textColor: 'white' },
  MONOMER: { backgroundColor: '#B8BDD3', borderColor: '#B8BDD3', textColor: 'white' },
  OTHER_MATERIAL: { backgroundColor: '#1976d2', borderColor: '#1976d2', textColor: 'white' },
  COMPOSITE: { backgroundColor: '#00ff88', borderColor: '#00ff88', textColor: 'white' },
  SYN_METHOD: { backgroundColor: '#f09bc5', borderColor: '#f09bc5', textColor: 'white' },
  default: { backgroundColor: 'primary', borderColor: 'primary', textColor: 'white' },
};

const SplitButton = ({ filledText, outlinedText, entityType = 'default' }) => {
  const colors = entityTypeColors[entityType] || entityTypeColors.default;

  return (
    <Button
      variant="outlined"
      sx={{
        borderColor: colors.borderColor,
        display: 'flex',
        alignItems: 'center',
        padding: 0,
        overflow: 'hidden',
        borderRadius: '4px',
        minWidth: 50, // Adjust width as needed
      }}
    >
      <Box
        sx={{
          backgroundColor: colors.backgroundColor,
          color: colors.textColor,
          padding: '4px',
          borderTopLeftRadius: '4px',
          borderBottomLeftRadius: '4px',
          textTransform: 'none',
        }}
      >
        <Typography  variant="body2" component="body2">
          {filledText}
        </Typography>
      </Box>
      <Box
        sx={{
          borderColor: colors.borderColor,
          padding: '4px',
          borderTopRightRadius: '4px',
          borderBottomRightRadius: '4px',
          textTransform: 'none',
        }}
      >
        <Typography variant="body2" component="body2" color={colors.borderColor}>
          {outlinedText}
        </Typography>
      </Box>
    </Button>
  );
};

export default SplitButton;
