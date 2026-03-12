import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Merge as MergeIcon,
  Visibility as EyeIcon,
  CheckCircle as CheckCircleIcon,
  Category as EntityIcon,
  Link as RelationIcon,
  CompareArrows as CompareArrowsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import BratEmbeddingDefault from '../pdf_highlighter/components/BratEmbeddingDefault';

// --- Interfaces ---

export interface ParagraphObject {
  text: string;
  entities: any[];
  relations: any[];
  raw_json: string;
}

export interface MergeOptions {
  mergeEntities: boolean;
  mergeRelations: boolean;
  replaceText: boolean;
}

export interface MergeResult {
  success: boolean;
  message: string;
  mergedEntities?: number;
  mergedRelations?: number;
}

export interface MergePreviewData {
  merged_output: ParagraphObject;
  merge_info: {
    total_entities_before: number;
    total_entities_after: number;
    new_entities_added: number;
    duplicate_entities_skipped: number;
    total_relations_before: number;
    total_relations_after: number;
    new_relations_added: number;
    duplicate_relations_skipped: number;
    conflicts: Array<{
      type: 'entity' | 'relation';
      llm_item: string;
      model_item: string;
      resolution: string;
    }>;
  };
}

export interface MergePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  previewData: MergePreviewData | null;
  isLoading: boolean;
  onConfirmMerge: () => void;
  isMerging: boolean;
  mergeResult: MergeResult | null;
  entityTypes: string[];
  relationTypes: string[];
}

// --- Helper Function to Generate Sample Merge Preview Data ---

export const getSampleMergePreviewData = (
  llmData: ParagraphObject,
  modelData: ParagraphObject
): MergePreviewData => {
  const llmEntityCount = llmData.entities?.length || 0;
  const modelEntityCount = modelData.entities?.length || 0;
  const llmRelationCount = llmData.relations?.length || 0;
  const modelRelationCount = modelData.relations?.length || 0;

  // Start with all model entities & relations
  const mergedEntities = [...(modelData.entities || [])];
  const mergedRelations = [...(modelData.relations || [])];

  // ── Helpers to normalise spans for comparison ──
  // Entity format: [id, type, [[start, end], ...]]
  const spanKey = (spans: any[]): string =>
    [...spans]
      .map(([s, e]: [number, number]) => `${s}-${e}`)
      .sort()
      .join(';');

  // Build a set of "type + spans" keys from the model entities for fast lookup
  const modelEntityKeys = new Set<string>(
    (modelData.entities || []).map(
      (ent: any) => `${ent[1]}|${spanKey(ent[2])}`,
    ),
  );

  // ── Merge entities, skipping duplicates ──
  let maxEntityId = modelEntityCount;
  const entityIdMap: Record<string, string> = {};
  let duplicateEntitiesSkipped = 0;

  (llmData.entities || []).forEach((entity: any) => {
    const [oldId, type, spans] = entity;
    const key = `${type}|${spanKey(spans)}`;

    if (modelEntityKeys.has(key)) {
      // Duplicate — find the existing model entity ID so relations can be
      // re-pointed to it
      const existing = (modelData.entities || []).find(
        (e: any) => `${e[1]}|${spanKey(e[2])}` === key,
      );
      if (existing) entityIdMap[oldId] = existing[0];
      duplicateEntitiesSkipped++;
      return;
    }

    const newId = `T${++maxEntityId}`;
    entityIdMap[oldId] = newId;
    mergedEntities.push([newId, type, spans]);
    // Also register the key so later LLM entities don't duplicate each other
    modelEntityKeys.add(key);
  });

  // ── Merge relations, skipping duplicates ──
  // Relation format: [id, type, [[role1, arg1Id], [role2, arg2Id]]]
  const relationKey = (type: string, args: any[]): string => {
    const argStr = [...args]
      .map(([role, id]: [string, string]) => `${role}:${id}`)
      .sort()
      .join(';');
    return `${type}|${argStr}`;
  };

  // Build set of existing relation keys (using model entity IDs)
  const modelRelationKeys = new Set<string>(
    (modelData.relations || []).map((rel: any) => relationKey(rel[1], rel[2])),
  );

  let maxRelationId = modelRelationCount;
  let duplicateRelationsSkipped = 0;

  (llmData.relations || []).forEach((relation: any) => {
    const [, type, args] = relation;
    // Re-map argument IDs through entityIdMap
    const newArgs = args.map((arg: any) => {
      const [argRole, argId] = arg;
      return [argRole, entityIdMap[argId] || argId];
    });

    const key = relationKey(type, newArgs);
    if (modelRelationKeys.has(key)) {
      duplicateRelationsSkipped++;
      return;
    }

    const newId = `R${++maxRelationId}`;
    mergedRelations.push([newId, type, newArgs]);
    modelRelationKeys.add(key);
  });

  const newEntitiesAdded = llmEntityCount - duplicateEntitiesSkipped;
  const newRelationsAdded = llmRelationCount - duplicateRelationsSkipped;

  return {
    merged_output: {
      text: modelData.text,
      entities: mergedEntities,
      relations: mergedRelations,
      raw_json: modelData.raw_json
    },
    merge_info: {
      total_entities_before: modelEntityCount,
      total_entities_after: mergedEntities.length,
      new_entities_added: newEntitiesAdded,
      duplicate_entities_skipped: duplicateEntitiesSkipped,
      total_relations_before: modelRelationCount,
      total_relations_after: mergedRelations.length,
      new_relations_added: newRelationsAdded,
      duplicate_relations_skipped: duplicateRelationsSkipped,
      conflicts: []
    }
  };
};

// --- Merge Preview Dialog Component ---

const MergePreviewDialog: React.FC<MergePreviewDialogProps> = ({
  open,
  onClose,
  previewData,
  isLoading,
  onConfirmMerge,
  isMerging,
  mergeResult,
  entityTypes,
  relationTypes
}) => {
  if (!previewData && !isLoading) return null;

  const mergeInfo = previewData?.merge_info;

  return (
    <Dialog
      open={open}
      onClose={isMerging ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '70vh' }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MergeIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Merge Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review the merged result before confirming
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={isMerging}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {(isLoading || isMerging) && <LinearProgress />}

      {/* Merge Result Alert */}
      {mergeResult && (
        <Alert
          severity={mergeResult.success ? 'success' : 'error'}
          sx={{ mx: 3, mt: 2 }}
          icon={mergeResult.success ? <CheckCircleIcon /> : undefined}
        >
          {mergeResult.message}
        </Alert>
      )}

      <DialogContent sx={{ p: 3, pt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <Typography color="text.secondary">Loading merge preview...</Typography>
          </Box>
        ) : (
          previewData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Compact Merge Summary - Horizontal Cards */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                {/* Entities Card */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    py: 1.5,
                    px: 2, 
                    flex: '1 1 0',
                    minWidth: 160,
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    borderRadius: 2.5,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -15,
                      right: -15,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'rgba(25, 118, 210, 0.1)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      borderRadius: '50%', 
                      width: 26, 
                      height: 26, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}>
                      <EntityIcon sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.dark', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Entities
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'primary.dark', lineHeight: 1 }}>
                      +{mergeInfo?.new_entities_added}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: 500 }}>
                      new
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'primary.main', mt: 0.5 }}>
                    {mergeInfo?.total_entities_before} → {mergeInfo?.total_entities_after} total
                  </Typography>
                </Paper>

                {/* Relations Card */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    flex: '1 1 0',
                    minWidth: 160,
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                    borderRadius: 2.5,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -15,
                      right: -15,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'rgba(156, 39, 176, 0.1)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ 
                      bgcolor: 'secondary.main', 
                      borderRadius: '50%', 
                      width: 26, 
                      height: 26, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}>
                      <RelationIcon sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'secondary.dark', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Relations
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'secondary.dark', lineHeight: 1 }}>
                      +{mergeInfo?.new_relations_added}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'secondary.main', fontWeight: 500 }}>
                      new
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'secondary.main', mt: 0.5 }}>
                    {mergeInfo?.total_relations_before} → {mergeInfo?.total_relations_after} total
                  </Typography>
                </Paper>

                {/* Duplicates Skipped Card (only show if there are any) */}
                {((mergeInfo?.duplicate_entities_skipped || 0) > 0 || (mergeInfo?.duplicate_relations_skipped || 0) > 0) && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      py: 1.5,
                      px: 2, 
                      flex: '1 1 0',
                      minWidth: 140,
                      background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                      borderRadius: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ 
                        bgcolor: 'warning.main', 
                        borderRadius: '50%', 
                        width: 26, 
                        height: 26, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }}>
                        <InfoIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'warning.dark', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Skipped
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'warning.dark', lineHeight: 1 }}>
                          {mergeInfo?.duplicate_entities_skipped || 0}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'warning.main' }}>entities</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'warning.dark', lineHeight: 1 }}>
                          {mergeInfo?.duplicate_relations_skipped || 0}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'warning.main' }}>relations</Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}

                {/* Conflicts Card (only show if there are any) */}
                {mergeInfo?.conflicts && mergeInfo.conflicts.length > 0 && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      py: 1.5,
                      px: 2, 
                      flex: '1 1 0',
                      minWidth: 120,
                      background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                      borderRadius: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ 
                        bgcolor: 'error.main', 
                        borderRadius: '50%', 
                        width: 26, 
                        height: 26, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 12
                      }}>
                        ⚠️
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'error.dark', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Conflicts
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'error.dark', lineHeight: 1 }}>
                      {mergeInfo.conflicts.length}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'error.main', mt: 0.5 }}>
                      need review
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* BRAT Visualization Preview - Full Width */}
              <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ 
                    bgcolor: 'primary.light', 
                    borderRadius: '50%', 
                    width: 28, 
                    height: 28, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <EyeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Merged Result Preview
                  </Typography>
                  <Chip
                    label="BRAT"
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                  />
                </Box>

                {/* BRAT Visualization */}
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    minHeight: '350px',
                    maxHeight: '500px',
                    bgcolor: '#fff',
                    overflow: 'auto'
                  }}
                >
                  <BratEmbeddingDefault docData={previewData.merged_output} />
                </Box>

                {/* Legend */}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompareArrowsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Entities and relations from both LLM and Model outputs are merged into the result above
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={isMerging}>
          Cancel
        </Button>
        <Button
          onClick={onConfirmMerge}
          variant="contained"
          color="primary"
          disabled={isLoading || isMerging || !!mergeResult?.success}
          startIcon={<MergeIcon />}
        >
          {isMerging ? 'Merging...' : 'Confirm Merge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MergePreviewDialog;
