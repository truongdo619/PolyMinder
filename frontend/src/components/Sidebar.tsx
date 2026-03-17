import React, { useEffect, useState, useContext } from "react";
import type { Highlight } from "../react-pdf-highlighter-extended";
import "../style/Sidebar.css";
import { CommentedHighlight } from "../types";
import "../pdf_highlighter/style/TextHighlight.css";
import EditNoteIcon from '@mui/icons-material/EditNote';
import CommentIcon from "@mui/icons-material/Comment";
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Tooltip from '@mui/material/Tooltip';
import { GlobalContext } from '../GlobalState';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosSetup';
import Pagination from '@mui/material/Pagination';
import { Box, List, ListItem, Snackbar, Checkbox, Typography, Alert, Chip, Badge } from '@mui/material';
import { GuidanceBanner, useGuidanceContext } from './GuidanceSystem';
import { EntityEditSaveData, toRelations, EntityTypeDef, getContrastColor } from '../lib/settingsHelpers';
import EntityEditPanel from './EntityEditPanel';

interface SidebarProps {
  highlights: Array<CommentedHighlight>;
  getHighlightById: (id: string) => CommentedHighlight | undefined;
  setIsActive: (active: boolean) => void;
  setHighlights: React.Dispatch<React.SetStateAction<Array<CommentedHighlight>>>;
  selectedMode: string;
  paraHighlights: Array<CommentedHighlight>;
}

interface MatchedEntity {
  entity_id: string;
  entity_text: string;
  entity_type: string;
  para_id: number;
  page_number: number[];
  short_text?: string;
  head?: number;
  tail?: number;
}

const updateHash = (highlight: Highlight) => {
  document.location.hash += `#highlight-${highlight.id}`;
};

interface Paragraph {
  entities: Array<[string, unknown, unknown]>;
}

const Sidebar = ({ highlights, getHighlightById: _getHighlightById, setIsActive, setHighlights, selectedMode, paraHighlights }: SidebarProps) => {
  const globalContext = useContext(GlobalContext);
  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }
  const { bratOutput, documentId, updateId, setBratOutput, setDocumentId, setUpdateId, setFileName, settings } = globalContext;
  const entityTypeDefs = (settings?.entity_types as EntityTypeDef[] | undefined) ?? [];
  const navigateTo = useNavigate();
  const guidance = useGuidanceContext();

  const convertedBratOutput: Record<string, [string, unknown, [[number, number]]]> = {};
  bratOutput.forEach((paragraph: Paragraph, index: number) => {
    paragraph.entities.forEach((entity: [string, unknown, unknown]) => {
      const convertedEntityId = `para${index}_${entity[0]}`;
      convertedBratOutput[convertedEntityId] = entity as [string, unknown, [[number, number]]];
    });
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<CommentedHighlight | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error'>('success');
  const [matchedEntities, setMatchedEntities] = useState<MatchedEntity[]>([]);
  const [UpdateContentMatchedEntities, setUpdateContentMatchedEntities] = useState<Record<string, unknown>>({});
  const [confirmUpdateMatchedEntitiesOpen, setConfirmUpdateMatchedEntitiesOpen] = useState(false);
  const [isReviewingMatchedEntities, setIsReviewingMatchedEntities] = useState(false);
  const [matchedEntitiesSelections, setMatchedEntitiesSelections] = useState<boolean[]>([]);
  const [allMatchedEntitiesSelected, setAllMatchedEntitiesSelected] = useState(true);

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const [openParaSelection, setOpenParaSelection] = useState(false);
  const [paragraphSelections, setParagraphSelections] = useState<boolean[]>(
    paraHighlights.map(ph => ph.visible !== undefined ? ph.visible : true)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const totalPages = Math.ceil(highlights.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHighlights = highlights.slice(startIndex, startIndex + itemsPerPage);
  const [allParagraphsSelected, setAllParagraphsSelected] = useState(true);

  const handleParagraphCheckbox = (index: number) => {
    setParagraphSelections((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      setAllParagraphsSelected(updated.every(Boolean));
      return updated;
    });
  };

  const handleAllParagraphsToggle = () => {
    const newVal = !allParagraphsSelected;
    setAllParagraphsSelected(newVal);
    setParagraphSelections(paragraphSelections.map(() => newVal));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMode]);

  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
    setSelectedHighlight(highlight as CommentedHighlight);
  };

  const editClick = (highlight: CommentedHighlight) => {
    setSelectedHighlight(highlight);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedHighlight(null);
    setConfirmStatusOpen(false);
  };

  const handleOpenParaSelection = () => setOpenParaSelection(true);
  const handleCloseParaSelection = () => setOpenParaSelection(false);

  const handleSaveParagraphSelection = async () => {
    try {
      setIsActive(true);
      const data = {
        document_id: documentId,
        update_id: updateId,
        visible_list: paragraphSelections,
      };
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/set-visible`,
        data,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);
      setFileName(response.data.filename);
      navigateTo('/result', {
        state: {
          highlights: response.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`,
        },
      });
    } catch (error) {
      console.error("Error updating visible list:", error);
    } finally {
      setOpenParaSelection(false);
      setIsActive(false);
    }
  };

  const handleSaveMatchedEntitiesSelection = async () => {
    setIsActive(true);
    const list_update = matchedEntities
      .filter((_, i) => matchedEntitiesSelections[i])
      .map(({ para_id, page_number, entity_id }) => ({ para_id, page_number, entity_id }));

    if (list_update.length === 0) {
      setNotification('No entities selected.');
      setNotificationSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      list_update,
      old_entity: (UpdateContentMatchedEntities as Record<string, unknown>).old_entity,
      new_entity: (UpdateContentMatchedEntities as Record<string, unknown>).new_entity,
      document_id: documentId,
      update_id: updateId,
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/apply-update`,
        payload,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);
      setFileName(response.data.filename);
      navigateTo('/result', {
        state: {
          highlights: response.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`,
        },
      });
      setNotification('Selected entities updated successfully.');
      setNotificationSeverity('success');
    } catch (error) {
      console.error(error);
      setNotification('Failed to update selected entities.');
      setNotificationSeverity('error');
    } finally {
      setOpenSnackbar(true);
      setConfirmUpdateMatchedEntitiesOpen(false);
      setIsReviewingMatchedEntities(false);
      setIsActive(false);
    }
  };

  const handlePanelSave = async (data: EntityEditSaveData) => {
    if (!selectedHighlight) return;
    setIsActive(true);
    const originalHighlights = [...highlights];
    let currentUpdateId = updateId;
    let currentDocumentId = documentId;

    const bratEntry = convertedBratOutput[selectedHighlight.id];
    const origHead = bratEntry ? bratEntry[2][0][0] : 0;
    const origTail = bratEntry ? bratEntry[2][0][1] : 0;

    const entityChanged =
      data.entityType !== selectedHighlight.comment ||
      data.userComment !== (selectedHighlight.user_comment ?? '') ||
      data.headPos !== origHead ||
      data.tailPos !== origTail;

    const relationsChanged =
      JSON.stringify(data.relations) !== JSON.stringify(toRelations(selectedHighlight.relations ?? []));

    // Optimistic update
    setHighlights(prev =>
      prev.map(h =>
        h.id === selectedHighlight.id
          ? { ...h, comment: data.entityType, user_comment: data.userComment, relations: data.relations }
          : h
      )
    );
    setDialogOpen(false);

    try {
      const token = localStorage.getItem('accessToken');

      if (entityChanged) {
        const response = await axiosInstance.post(
          `${import.meta.env.VITE_BACKEND_URL}/update-entity`,
          {
            document_id: currentDocumentId,
            update_id: currentUpdateId,
            id: selectedHighlight.id,
            head_pos: data.headPos,
            tail_pos: data.tailPos,
            type: data.entityType,
            user_comment: data.userComment,
          },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
        );
        setBratOutput(response.data.brat_format_output);
        setDocumentId(response.data.document_id);
        setUpdateId(response.data.update_id);
        setHighlights(response.data.pdf_format_output);
        setFileName(response.data.filename);
        currentUpdateId = response.data.update_id;
        currentDocumentId = response.data.document_id;

        const matched = response.data.matched_entities || [];
        setUpdateContentMatchedEntities(response.data.update_content_matched_entities || {});
        if (matched.length > 0) {
          setMatchedEntities(matched);
          setConfirmUpdateMatchedEntitiesOpen(true);
        }
      }

      if (relationsChanged) {
        const response = await axiosInstance.post(
          `${import.meta.env.VITE_BACKEND_URL}/update-relations`,
          {
            document_id: currentDocumentId,
            update_id: currentUpdateId,
            entity_id: selectedHighlight.id,
            relations: data.relations,
          },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
        );
        setBratOutput(response.data.brat_format_output);
        setDocumentId(response.data.document_id);
        setUpdateId(response.data.update_id);
        setHighlights(response.data.pdf_format_output);
        setFileName(response.data.filename);
      }

      setNotification('Saved successfully.');
      setNotificationSeverity('success');
      setOpenSnackbar(true);
    } catch (err) {
      setHighlights(originalHighlights);
      setNotification('Failed to save. Changes reverted.');
      setNotificationSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsActive(false);
      setSelectedHighlight(null);
    }
  };

  const handlePanelDelete = async () => {
    if (!selectedHighlight) return;
    setIsActive(true);
    const originalHighlights = [...highlights];

    setHighlights(prev => prev.filter(h => h.id !== selectedHighlight.id));
    setDialogOpen(false);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/delete-entity`,
        { document_id: documentId, update_id: updateId, ids: [selectedHighlight.id] },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      setBratOutput(response.data.brat_format_output);
      setDocumentId(response.data.document_id);
      setUpdateId(response.data.update_id);
      setHighlights(response.data.pdf_format_output);
      setFileName(response.data.filename);
      setNotification('Entity deleted.');
      setNotificationSeverity('success');
      setOpenSnackbar(true);
    } catch (err) {
      setHighlights(originalHighlights);
      setNotification('Failed to delete. Changes reverted.');
      setNotificationSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsActive(false);
      setSelectedHighlight(null);
    }
  };

  useEffect(() => {
    const hash = document.location.hash.split("#")[document.location.hash.split("#").length - 1];
    const highlightIndex = highlights.findIndex((highlight) => `highlight-${highlight.id}` === hash);
    if (highlightIndex !== -1) {
      setCurrentPage(Math.floor(highlightIndex / itemsPerPage) + 1);
    }
    const timerId = setTimeout(() => {
      if (hash) {
        const highlightElement = document.getElementById(hash);
        if (highlightElement) {
          highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
    return () => clearTimeout(timerId);
  }, [document.location.hash]);

  const handleStarClick = (highlight: CommentedHighlight) => {
    setSelectedHighlight(highlight);
    setConfirmStatusOpen(true);
  };

  const handleConfirmStar = async () => {
    if (!selectedHighlight) return;
    try {
      setIsActive(true);
      const currentStatus = (selectedHighlight as CommentedHighlight & { edit_status?: string }).edit_status;
      const newStatus = currentStatus === "confirmed" ? "none" : "confirmed";
      const data = { document_id: documentId, update_id: updateId, id: selectedHighlight.id };
      const token = localStorage.getItem('accessToken');
      await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/change-edit-status`,
        data,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      setHighlights(prevHighlights =>
        prevHighlights.map(h =>
          h.id === selectedHighlight.id
            ? { ...h, edit_status: newStatus } as CommentedHighlight
            : h
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setConfirmStatusOpen(false);
      setSelectedHighlight(null);
      setIsActive(false);
    }
  };

  const renderStarButton = (highlight: CommentedHighlight) => {
    const isConfirmed = (highlight as CommentedHighlight & { edit_status?: string }).edit_status === "confirmed";
    return (
      <Tooltip title={isConfirmed ? "This item has been confirmed by the user" : "This item has not been confirmed yet"}>
        <IconButton
          color="primary"
          aria-label={isConfirmed ? "confirmed" : "unconfirmed"}
          onClick={(e) => { e.stopPropagation(); handleStarClick(highlight); }}
        >
          {isConfirmed ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
    );
  };

  const entityList = (
    <>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          Found <span className="total_entities_span">{highlights.length}</span> entities in this document.
        </h2>
        <p style={{ fontSize: "15px", marginTop: "10px" }}>
          🌟 To highlight a new entity, select the text you want and click "Add Highlight".
        </p>
        <p style={{ fontSize: "15px", marginTop: "10px" }}>
          📝 To annotate results for specific sections of the document, please{" "}
          <span
            style={{ color: "#007bff", cursor: "pointer", textDecoration: "none", fontWeight: "bold" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            onClick={handleOpenParaSelection}
          >
            adjust your selection
          </span>
          .
        </p>
      </div>

      {highlights.length === 0 && selectedMode === 'Entities' && guidance.shouldShow('entities-empty') && (
        <GuidanceBanner id="entities-empty" title="No Entities Yet" description='Select text in the PDF and click "Add highlight" to create your first entity.' actionLabel="Got it" onDismiss={guidance.dismiss} visible={true} />
      )}
      {highlights.length === 0 && selectedMode === 'Relations' && guidance.shouldShow('relations-empty') && (
        <GuidanceBanner id="relations-empty" title="No Relations Found" description="No relationships were extracted yet. Relations link entities (e.g. has_property, has_value). If you have added or edited entities, try re-running the RE model from the toolbar." actionLabel="Got it" onDismiss={guidance.dismiss} visible={true} severity="warning" />
      )}
      {highlights.length > 0 && selectedMode === 'Entities' && guidance.shouldShow('entities-intro') && (
        <GuidanceBanner id="entities-intro" title="Entities Extracted" description="Click any entity to scroll to it in the PDF. Right-click for edit and delete options." actionLabel="Got it" onDismiss={guidance.dismiss} visible={true} />
      )}
      {highlights.length > 5 && selectedMode === 'Entities' && guidance.shouldShow('confirm-entities-hint') && (
        <GuidanceBanner id="confirm-entities-hint" title="Confirm Correct Entities" description="Click the star icon to mark entities you have verified as correct." actionLabel="Got it" onDismiss={guidance.dismiss} visible={true} />
      )}

      {highlights.length === 0 && !guidance.shouldShow('entities-empty') && selectedMode === 'Entities' && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3, px: 2 }}>
          No entities yet. Select text in the PDF and click "Add highlight" to create one.
        </Typography>
      )}
      {highlights.length === 0 && !guidance.shouldShow('relations-empty') && selectedMode === 'Relations' && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3, px: 2 }}>
          No relations found. Add entities first, then run the RE model from the toolbar.
        </Typography>
      )}

      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "6px" }}>
        {currentHighlights.map((highlight, index) => {
          const typeDef = entityTypeDefs.find(e => e.type === highlight.comment);
          const typeBg = typeDef?.bgColor ?? '#888';
          const typeFg = getContrastColor(typeBg);
          const isSelected = document.location.hash.split("#")[document.location.hash.split("#").length - 1] === `highlight-${highlight.id}`;
          const relCount = (highlight.relations as Array<unknown>)?.length ?? 0;
          const relations = highlight.relations as Array<{ type: string; arg_type: string; arg_text: string }> | undefined;
          return (
            <li
              key={index}
              id={`highlight-${highlight.id}`}
              className={`sidebar__highlight ${isSelected ? 'sidebar__highlight--selected' : ''}`}
              onClick={() => handleHighlightClick(highlight)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              {/* Entity type badge — full width row at top */}
              <Chip
                label={highlight.comment}
                size="small"
                sx={{
                  bgcolor: typeBg,
                  color: typeFg,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 22,
                  mb: 0.6,
                  '& .MuiChip-label': { px: 1 },
                }}
              />

              {/* Entity text */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                  color: '#222',
                  width: '100%',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {highlight.content.text ?? ''}
              </Typography>

              {/* Relations compact list */}
              {relations && relations.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.2, width: '100%' }}>
                  {relations.slice(0, 2).map((rel, relIndex) => (
                    <Typography key={relIndex} variant="caption" sx={{ color: '#666', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontStyle: 'italic', color: '#6c63ff' }}>{rel.type}</span>
                      {' → '}
                      <strong>{rel.arg_type}</strong>: {rel.arg_text.slice(0, 28)}{rel.arg_text.length > 28 ? '…' : ''}
                    </Typography>
                  ))}
                  {relations.length > 2 && (
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.68rem' }}>
                      +{relations.length - 2} more
                    </Typography>
                  )}
                </Box>
              )}

              {highlight.content.image && (
                <div className="highlight__image__container" style={{ marginTop: "0.5rem" }}>
                  <img src={highlight.content.image} alt={"Screenshot"} className="highlight__image" />
                </div>
              )}

              {/* Action row */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 0.5 }}>
                <Tooltip title="Edit annotation">
                  <IconButton size="small" color="primary" aria-label="edit" onClick={(e) => { e.stopPropagation(); editClick(highlight); }} sx={{ p: 0.5 }}>
                    <EditNoteIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                {highlight.comment && renderStarButton(highlight)}
                {highlight.user_comment && highlight.user_comment.length > 0 && (
                  <Tooltip title={highlight.user_comment}>
                    <IconButton size="small" aria-label="comment" onClick={() => {}} sx={{ p: 0.5 }}>
                      <CommentIcon color="primary" sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {relCount > 0 && (
                  <Badge badgeContent={relCount} color="primary" sx={{ ml: 0.5 }}>
                    <Box sx={{ width: 8 }} />
                  </Badge>
                )}
                <Typography variant="caption" sx={{ ml: 'auto', color: '#aaa', fontSize: '0.72rem' }}>
                  p.{highlight.position.boundingRect.pageNumber}
                </Typography>
              </Box>
            </li>
          );
        })}
      </ul>

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
    </>
  );

  const selectedParaIndex = selectedHighlight
    ? parseInt(selectedHighlight.id.split("_")[0].match(/\d+/)?.[0] ?? "0", 10)
    : -1;
  const selectedParaRaw = selectedParaIndex >= 0
    ? (bratOutput[selectedParaIndex] as { text?: string; entities?: unknown[]; relations?: unknown[] } | undefined)
    : undefined;
  const paragraphDataForEdit = selectedParaRaw
    ? { text: selectedParaRaw.text ?? '', entities: selectedParaRaw.entities ?? [], relations: selectedParaRaw.relations }
    : null;

  const editPanel = dialogOpen && selectedHighlight && convertedBratOutput[selectedHighlight.id] ? (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <EntityEditPanel
        highlight={selectedHighlight}
        allHighlights={highlights}
        paragraphText={paragraphDataForEdit?.text ?? ''}
        headPos={convertedBratOutput[selectedHighlight.id][2][0][0]}
        tailPos={convertedBratOutput[selectedHighlight.id][2][0][1]}
        paragraphData={paragraphDataForEdit}
        onSave={handlePanelSave}
        onDelete={handlePanelDelete}
        onClose={handleDialogClose}
      />
    </Box>
  ) : null;

  const ucme = UpdateContentMatchedEntities as {
    old_entity?: { entity_type: string; entity_text: string };
    new_entity?: { entity_type: string; entity_text: string };
  };

  return (
    <div className="sidebar" style={{ width: "100%", height: "100vh", overflowX: "hidden", overflowY: editPanel ? "hidden" : "auto" }}>
      {editPanel ?? entityList}

      {/* Confirm status change */}
      <Dialog open={confirmStatusOpen} onClose={handleDialogClose}>
        <DialogTitle style={{ textAlign: 'center' }}>
          {(selectedHighlight as (CommentedHighlight & { edit_status?: string }) | null)?.edit_status === "none"
            ? "Confirm Status Change"
            : "Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to{' '}
            {(selectedHighlight as (CommentedHighlight & { edit_status?: string }) | null)?.edit_status === "none"
              ? "confirm this highlight?"
              : "unconfirm this highlight?"}
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">Cancel</Button>
          <Button onClick={handleConfirmStar} color="primary" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Adjust paragraph selection */}
      <Dialog
        open={openParaSelection}
        onClose={handleCloseParaSelection}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { borderRadius: '8px', backgroundColor: '#fafafa' } }}
      >
        <DialogTitle style={{ textAlign: 'center' }}>Adjust Your Paragraph Selection</DialogTitle>
        <Divider />
        <DialogContent dividers>
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
            <Checkbox checked={allParagraphsSelected} onChange={handleAllParagraphsToggle} />
            <Typography variant="body1">Enable/Disable All</Typography>
          </Box>
          <List>
            {paraHighlights.map((para, i) => {
              const paraText = para.content.text ?? '';
              const shortPreview = paraText.slice(0, 150) + (paraText.length > 150 ? "..." : "");
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
                    ":hover": { backgroundColor: "#ececec" },
                  }}
                >
                  <Tooltip title={paraText} arrow>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">Paragraph {(para.para_id ?? 0) + 1} - {para.comment}</Typography>
                      <Typography variant="body2" sx={{ color: "#555" }}>{shortPreview}</Typography>
                    </Box>
                  </Tooltip>
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
          <Button onClick={handleCloseParaSelection} color="primary" variant="outlined">Cancel</Button>
          <Button onClick={handleSaveParagraphSelection} color="primary" variant="contained">Save & Reload</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={notificationSeverity} sx={{ width: '100%' }}>
          {notification}
        </Alert>
      </Snackbar>

      {/* Matched entities dialog */}
      <Dialog
        open={confirmUpdateMatchedEntitiesOpen}
        onClose={() => { setConfirmUpdateMatchedEntitiesOpen(false); setIsReviewingMatchedEntities(false); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          {isReviewingMatchedEntities ? 'Review & Apply to Matched Entities' : 'Apply Revision to Similar Entities?'}
          {isReviewingMatchedEntities && ucme.old_entity && ucme.new_entity && (
            <Box mt={1}>
              <Typography variant="body2" textAlign="center">
                {ucme.old_entity.entity_type}:{' '}
                <span className={`${ucme.old_entity.entity_type}`}>{ucme.old_entity.entity_text}</span>
                {' → '}
                {ucme.new_entity.entity_type}:{' '}
                <span className={`${ucme.new_entity.entity_type}`}>{ucme.new_entity.entity_text}</span>
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {isReviewingMatchedEntities ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={allMatchedEntitiesSelected}
                  onChange={() => {
                    const newValue = !allMatchedEntitiesSelected;
                    setAllMatchedEntitiesSelected(newValue);
                    setMatchedEntitiesSelections(new Array(matchedEntities.length).fill(newValue));
                  }}
                />
                <Typography variant="body1">Enable/Disable All</Typography>
              </Box>
              <List>
                {matchedEntities.map((entity, i) => (
                  <ListItem
                    key={i}
                    dense
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      marginBottom: "0.75rem",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <Tooltip title={entity.entity_text} arrow>
                      <Box sx={{ flexGrow: 1, paddingRight: 2 }}>
                        <Typography variant="subtitle2">
                          Paragraph: {entity.para_id + 1} – Page: {entity.page_number?.[0]}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#555" }}>
                          {"... "}
                          {entity.short_text?.slice(0, entity.head)}
                          <span className={`${entity.entity_type}`}>{entity.entity_text}</span>
                          {entity.short_text?.slice(entity.tail)}
                          {" ..."}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Checkbox
                      edge="end"
                      checked={matchedEntitiesSelections[i] || false}
                      onChange={() => {
                        const updated = [...matchedEntitiesSelections];
                        updated[i] = !updated[i];
                        setMatchedEntitiesSelections(updated);
                        setAllMatchedEntitiesSelected(updated.every(Boolean));
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                We found <strong>{matchedEntities.length}</strong> other entities in the document that have
                the <strong>same span text</strong> and <strong>original entity type</strong> as the one you just revised.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Would you like to review and apply the same revision to these matched entities as well?
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {isReviewingMatchedEntities ? (
            <>
              <Button
                onClick={() => { setConfirmUpdateMatchedEntitiesOpen(false); setIsReviewingMatchedEntities(false); }}
                color="primary"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveMatchedEntitiesSelection} color="primary" variant="contained">
                Save & Reload
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setConfirmUpdateMatchedEntitiesOpen(false)} color="primary">No</Button>
              <Button
                onClick={() => {
                  setIsReviewingMatchedEntities(true);
                  setMatchedEntitiesSelections(new Array(matchedEntities.length).fill(true));
                  setAllMatchedEntitiesSelected(true);
                }}
                color="primary"
                variant="contained"
                autoFocus
              >
                Yes
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Sidebar;
