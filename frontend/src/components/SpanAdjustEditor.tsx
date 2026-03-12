import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface SpanAdjustEditorProps {
  paragraphText: string;
  headPos: number;
  tailPos: number;
  entityType: string;
  onChange: (headPos: number, tailPos: number) => void;
}

const SpanAdjustEditor = ({ paragraphText, headPos, tailPos, entityType, onChange }: SpanAdjustEditorProps) => {
  const [localHead, setLocalHead] = useState(headPos);
  const [localTail, setLocalTail] = useState(tailPos);

  useEffect(() => {
    setLocalHead(headPos);
    setLocalTail(tailPos);
  }, [headPos, tailPos]);

  const handleHeadChange = (val: number) => {
    const newHead = Math.max(0, Math.min(val, localTail));
    setLocalHead(newHead);
    onChange(newHead, localTail);
  };

  const handleTailChange = (val: number) => {
    const newTail = Math.max(localHead, Math.min(val, paragraphText.length));
    setLocalTail(newTail);
    onChange(localHead, newTail);
  };

  const contextStart = Math.max(0, localHead - 40);
  const contextEnd = Math.min(paragraphText.length, localTail + 40);
  const before = paragraphText.slice(contextStart, localHead);
  const selected = paragraphText.slice(localHead, localTail);
  const after = paragraphText.slice(localTail, contextEnd);
  const charCount = localTail - localHead;

  return (
    <Accordion
      defaultExpanded={false}
      disableGutters
      elevation={0}
      sx={{ border: '1px solid #e8e8e8', borderRadius: '6px !important', '&:before': { display: 'none' } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
        sx={{ minHeight: 36, px: 1.5, py: 0, '& .MuiAccordionSummary-content': { my: 0.75 } }}
      >
        <Typography variant="caption" fontWeight={600} sx={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Adjust Span (optional)
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0.5, pb: 1.5 }}>
        {/* Paragraph preview */}
        <Box sx={{
          mb: 1.5,
          p: 1,
          bgcolor: '#f9f9f9',
          borderRadius: 1,
          border: '1px solid #eee',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          lineHeight: 1.7,
          color: '#555',
          wordBreak: 'break-all',
        }}>
          {contextStart > 0 && <span style={{ color: '#bbb' }}>…</span>}
          <span style={{ color: '#999' }}>{before}</span>
          <span
            className={entityType}
            style={{
              borderRadius: 3,
              padding: '1px 3px',
              fontWeight: 700,
              outline: '2px solid currentColor',
              outlineOffset: 1,
            }}
          >
            {selected || '(empty)'}
          </span>
          <span style={{ color: '#999' }}>{after}</span>
          {contextEnd < paragraphText.length && <span style={{ color: '#bbb' }}>…</span>}
        </Box>

        {/* Inputs row */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Start"
            type="number"
            size="small"
            value={localHead}
            onChange={e => handleHeadChange(parseInt(e.target.value) || 0)}
            inputProps={{ min: 0, max: localTail }}
            sx={{ width: 85 }}
          />
          <TextField
            label="End"
            type="number"
            size="small"
            value={localTail}
            onChange={e => handleTailChange(parseInt(e.target.value) || 0)}
            inputProps={{ min: localHead, max: paragraphText.length }}
            sx={{ width: 85 }}
          />
          <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
            {charCount} char{charCount !== 1 ? 's' : ''}
            {selected ? ` · "${selected.slice(0, 16)}${selected.length > 16 ? '…' : ''}"` : ''}
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default SpanAdjustEditor;
