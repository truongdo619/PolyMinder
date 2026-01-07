import React, { useEffect, useState, useMemo } from "react";
import { CommentedHighlight } from "../types";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import CommentIcon from "@mui/icons-material/Comment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import { GlobalContext } from "../../../src/GlobalState";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../src/axiosSetup";
import BratEmbeddingDefault from "./BratEmbeddingDefault";

interface LLMCommentFormProps {
  onSubmit: (input: string) => void;
  highlight: CommentedHighlight;
  brat_item: {
    text: string;
    entities: Array<any>;
    relations: Array<any>;
    selectedMode: string;
  };
  setCommentDialogData: (data: any) => void;
  toggleEditInProgress: (isEditing: boolean) => void;
  pdfHighlighterUtils: any;
  onOpenTreeDialog?: (highlightId: string) => void;
}

type BratDoc = {
  text: string;
  entities: any[];
  relations: any[];
  [k: string]: any;
};

const LLMCommentForm = ({
  onSubmit,
  highlight,
  brat_item,
  setCommentDialogData,
  toggleEditInProgress,
  pdfHighlighterUtils,
}: LLMCommentFormProps) => {
  const globalContext = React.useContext(GlobalContext);
  if (!globalContext) {
    throw new Error("GlobalContext is undefined");
  }

  const {
    documentId,
    updateId,
    setBratOutput,
    setDocumentId,
    setUpdateId,
    setFileName,
    setHighlights, // if not in context, you can remove this
    setTableOutput,
    setVisibleHighlights,
    setLLLOutput,
  } = globalContext as any;

  const navigateTo = useNavigate();

  const [isVisible, setIsVisible] = useState(true);
  const [key, setKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [highlight]);

  if (!isVisible) {
    return null;
  }

  const llmMeta = highlight as any;

  const selectedText: string =
    llmMeta.llm_input_text ||
    highlight.content?.text ||
    brat_item?.text ||
    "";

  const systemPrompt: string = llmMeta.llm_system_prompt || "";
  const inputPrompt: string = llmMeta.llm_input_prompt || "";
  const outputText: string = llmMeta.llm_output_text || "";

  // -------- NEW: apply_pipeline flag --------
  const applyPipeline: boolean = Boolean(llmMeta.apply_pipeline);

  type BratDoc = {
    text: string;
    entities: any[];
    relations: any[];
  };

  const bratDoc: BratDoc = useMemo(() => {
    if (!applyPipeline) return {};

    const h: any = highlight;

    const text: string =
      h.text ||            // if you have a dedicated field
      h.llm_input_text ||       // or reuse input text
      h.llm_output_text ||
      "";

    const entities = h.entities;
    const relations = h.relations;

    if (
      !text ||
      !Array.isArray(entities) ||
      !Array.isArray(relations)
    ) {
      return {};
    }

    console.log("Brat doc data:", { text, entities, relations });

    return {
        text,
        entities,
        relations,
      };
  }, [applyPipeline, highlight]);

  const handleClose = () => {
    setCommentDialogData(null);
    setIsVisible(false);
    toggleEditInProgress(false);

    if (pdfHighlighterUtils && pdfHighlighterUtils.scrolledToHighlightIdRef) {
      pdfHighlighterUtils.scrolledToHighlightIdRef.current = null;
      pdfHighlighterUtils.renderHighlightLayers();
    }

    // Reset URL hash
    const hash = document.location.hash;
    const parts = hash.split("#");
    document.location.hash = parts[0] + "#" + parts[1];
  };

  const handleConfirmDeleteClick = () => {
    setConfirmOpen(true);
  };

  // Actual delete (same flow as Sidebar.handleDelete)
  const handleDelete = async () => {
    try {
      toggleEditInProgress(true);

      const payload = {
        document_id: documentId,
        update_id: updateId,
        llm_text_id: highlight.id,
      };

      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/delete-LLMtext`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      console.log("Delete LLM text response:", data);
      if (data.llm_texts) {
        setLLLOutput(data.llm_texts);
      }
    } catch (error) {
      console.error("Error deleting entity:", error);
    } finally {
      setConfirmOpen(false);
      handleClose();
    }
  };

  const sectionBoxStyle = {
    border: "1px solid #e0e0e0",
    borderRadius: 1,
    p: 1.5,
    mt: 0.5,
    maxHeight: 220,
    overflowY: "auto",
    whiteSpace: "pre-wrap" as const,
    bgcolor: "#fafafa",
  };

  return (
    <Box>
      <Card key={key} sx={{ minWidth: 300, width: "100%", boxShadow: 0 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            LLM Extraction Result
          </Typography>

          <Typography variant="subtitle2" color="text.secondary">
            Highlight ID: {highlight.id}
          </Typography>

          {/* Selected Text */}
          <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              📄 Selected Text
            </Typography>
            <Box sx={sectionBoxStyle}>
              {selectedText && selectedText.trim().length > 0
                ? selectedText
                : "(No input text available)"}
            </Box>
          </Box>

          {/* System Prompt */}
          <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              🧠 System Prompt
            </Typography>
            <Box sx={sectionBoxStyle}>
              {systemPrompt && systemPrompt.trim().length > 0
                ? systemPrompt
                : "(No system prompt recorded)"}
            </Box>
          </Box>

          {/* Input Prompt */}
          <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              ✏️ Input Prompt
            </Typography>
            <Box sx={sectionBoxStyle}>
              {inputPrompt && inputPrompt.trim().length > 0
                ? inputPrompt
                : "(No input prompt recorded)"}
            </Box>
          </Box>

          {/* LLM Output */}
          <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              ✅ LLM Output
            </Typography>
            <Box sx={sectionBoxStyle}>
              {outputText && outputText.trim().length > 0
                ? outputText
                : "(No output text recorded)"}
            </Box>
          </Box>

          {/* -------- NEW: BRAT visualization (only when apply_pipeline === true) -------- */}
          {applyPipeline && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box mt={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  🔍 NER & RE Results
                </Typography>

                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: "#f7f7f7",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 500 }}
                      >
                        BRAT View
                      </Typography>
                      <BratEmbeddingDefault docData={bratDoc} />
                    </Paper>
                </Box>
              </Box>
            </>
          )}

          {/* Optional user comment */}
          {highlight.user_comment && highlight.user_comment.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  bgcolor: "#fafafa",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <CommentIcon fontSize="small" sx={{ mt: "2px" }} />
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {highlight.user_comment}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>

        {/* Delete on left, Cancel on right */}
        <CardActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            pb: 2,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleConfirmDeleteClick}
          >
            Delete
          </Button>

          <Button size="small" onClick={handleClose}>
            Cancel
          </Button>
        </CardActions>
      </Card>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle style={{ textAlign: "center" }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this highlight?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LLMCommentForm;
