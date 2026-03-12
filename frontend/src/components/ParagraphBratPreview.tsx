import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BratEmbeddingDefault from '../pdf_highlighter/components/BratEmbeddingDefault';
import { CommentedHighlight } from '../types';
import { Relation } from '../lib/settingsHelpers';

interface ParagraphBratPreviewProps {
  paragraphData: { text: string; entities: unknown[]; relations?: unknown[] };
  highlight: CommentedHighlight;
  currentEntityType: string;
  currentRelations: Relation[];
  currentHeadPos: number;
  currentTailPos: number;
}

type EntityTuple = [string, string, [[number, number]]];

const MIN_HEIGHT = 80;
const DEFAULT_HEIGHT = 180;
const MAX_HEIGHT = 600;

const ParagraphBratPreview = ({
  paragraphData,
  highlight,
  currentEntityType,
  currentRelations,
  currentHeadPos,
  currentTailPos,
}: ParagraphBratPreviewProps) => {
  const [showRelatedOnly, setShowRelatedOnly] = useState(false);
  const [debouncedHead, setDebouncedHead] = useState(currentHeadPos);
  const [debouncedTail, setDebouncedTail] = useState(currentTailPos);
  const [resizeCounter, setResizeCounter] = useState(0);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const lastWidthRef = useRef(0);

  // Debounce span changes (300 ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHead(currentHeadPos);
      setDebouncedTail(currentTailPos);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentHeadPos, currentTailPos]);

  // Watch container width via ResizeObserver.
  // On the FIRST measurement we just record the width (BRAT already reads the DOM
  // width itself on initial mount — forcing a remount here would destroy a working render).
  // On subsequent measurements we only trigger a remount when the width changes by >10 px
  // (i.e. the sidebar was actually resized), debounced by 300 ms.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(entries => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w === 0) return;
      // First real measurement — just record, don't remount
      if (lastWidthRef.current === 0) {
        lastWidthRef.current = w;
        return;
      }
      // Only remount if width actually changed (sidebar resized)
      if (Math.abs(w - lastWidthRef.current) > 10) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          lastWidthRef.current = w;
          setResizeCounter(c => c + 1);
        }, 300);
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  // ── Drag-to-resize logic ──
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
  }, [panelHeight]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientY - dragStartY.current;
      setPanelHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, dragStartHeight.current + delta)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const localEntityId = highlight.id.split('_')[1];

  // Stable key that captures ALL state affecting BRAT output — including
  // relation types and targets, not just the count.
  const relationsKey = currentRelations.map(r => `${r.type}:${r.arg_id}`).join(',');
  const previewKey = `${highlight.id}|${currentEntityType}|${debouncedHead}|${debouncedTail}|${relationsKey}|${showRelatedOnly}|${resizeCounter}`;

  // Memoize docData so BratEmbeddingDefault's useEffect([docData]) only fires
  // when the actual content changes, not on every parent re-render.
  const docData = useMemo(() => {
    const modifiedEntities = (paragraphData.entities as EntityTuple[]).map(entity => {
      if (entity[0] !== localEntityId) return entity;
      return [entity[0], currentEntityType, [[debouncedHead, debouncedTail]]] as EntityTuple;
    });

    const modifiedRelations = currentRelations.map((rel, i) => [
      `R${i + 1}`,
      rel.type,
      [['Arg1', localEntityId], ['Arg2', rel.arg_id.split('_')[1]]],
    ]);

    const relatedEntityIds = new Set([
      localEntityId,
      ...currentRelations.map(rel => rel.arg_id.split('_')[1]),
    ]);

    const displayEntities = showRelatedOnly
      ? modifiedEntities.filter(e => relatedEntityIds.has(e[0]))
      : modifiedEntities;

    return {
      text: paragraphData.text,
      entities: displayEntities,
      relations: modifiedRelations,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, paragraphData.text, paragraphData.entities]);

  return (
    <Accordion
      defaultExpanded
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        bgcolor: '#fafafa',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{
          minHeight: 32,
          px: 1.25,
          py: 0,
          '& .MuiAccordionSummary-content': { my: 0.6, display: 'flex', alignItems: 'center', gap: 0.5 },
        }}
      >
        <VisibilityIcon sx={{ fontSize: 13, color: '#888' }} />
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ color: '#666', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}
        >
          Paragraph Context
        </Typography>
        <ToggleButton
          value="related"
          selected={showRelatedOnly}
          onChange={() => setShowRelatedOnly(v => !v)}
          onClick={e => e.stopPropagation()}
          size="small"
          sx={{
            fontSize: '0.6rem',
            py: 0.2,
            px: 0.75,
            height: 18,
            lineHeight: 1,
            border: '1px solid #bbb !important',
            borderRadius: '4px !important',
            color: showRelatedOnly ? '#fff' : '#666',
            bgcolor: showRelatedOnly ? '#6c63ff !important' : 'transparent',
            '&:hover': { bgcolor: showRelatedOnly ? '#5a52d5 !important' : '#f0f0f0 !important' },
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          {showRelatedOnly ? 'All' : 'Related'}
        </ToggleButton>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 0, py: 0, borderTop: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}>
        {/* BRAT scrollable area — height controlled by drag handle */}
        <div
          ref={containerRef}
          style={{
            width: '100%',
            overflow: 'auto',
            height: panelHeight,
            padding: '4px 2px',
            // Prevent text selection while dragging
            userSelect: isDragging ? 'none' : undefined,
          }}
        >
          <BratEmbeddingDefault key={previewKey} docData={docData} />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            height: 8,
            cursor: 'row-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDragging ? '#e0e0e0' : '#f0f0f0',
            borderTop: '1px solid #e0e0e0',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            transition: isDragging ? 'none' : 'background 0.15s',
            flexShrink: 0,
          }}
          title="Drag to resize"
        >
          {/* Three-dot grip indicator */}
          <div style={{
            width: 28,
            height: 3,
            borderRadius: 2,
            background: isDragging ? '#999' : '#c0c0c0',
            transition: isDragging ? 'none' : 'background 0.15s',
          }} />
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

export default ParagraphBratPreview;
