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
import Tooltip from "@mui/material/Tooltip";
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
  const [parseDialogOpen, setParseDialogOpen] = useState(false);

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

  const applyPipeline: boolean = Boolean(llmMeta.apply_pipeline);

  type InnerBratDoc = {
    text: string;
    entities: any[];
    relations: any[];
  };

  const bratDoc: InnerBratDoc = useMemo(() => {
    if (!applyPipeline) return {} as InnerBratDoc;

    const h: any = highlight;

    const text: string =
      h.text ||
      h.llm_input_text ||
      h.llm_output_text ||
      "";

    const entities = h.entities;
    const relations = h.relations;

    if (!text || !Array.isArray(entities) || !Array.isArray(relations)) {
      return {} as InnerBratDoc;
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

    const hash = document.location.hash;
    const parts = hash.split("#");
    document.location.hash = parts[0] + "#" + parts[1];
  };

  const handleConfirmDeleteClick = () => {
    setConfirmOpen(true);
  };

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
      toggleEditInProgress(false);
      handleClose();
    }
  };

  const handleOpenParseDialog = () => {
    setParseDialogOpen(true);
  };

  const handleCloseParseDialog = () => {
    setParseDialogOpen(false);
  };

  // ✅ Place to integrate backend parse + update highlights
  const handleConfirmParse = async () => {
    try {
      toggleEditInProgress(true);

      // TODO: integrate your real backend endpoint here.
      // Example payload (you can adjust as needed):
      const payload = {
        document_id: documentId,
        update_id: updateId,
        llm_text_id: highlight.id,
      };

      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/parse-LLM-output`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      if (data.llm_texts) {
        setLLLOutput(data.llm_texts);
      }
    } catch (e) {
      console.error("Error parsing LLM JSON:", e);
    } finally {
      toggleEditInProgress(false);
      setParseDialogOpen(false);
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
          {systemPrompt && <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              🧠 System Prompt
            </Typography>
            <Box sx={sectionBoxStyle}>
              {systemPrompt}
            </Box>
          </Box>}

          {/* Input Prompt */}
          {inputPrompt && <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              ✏️ Input Prompt
            </Typography>
            <Box sx={sectionBoxStyle}>
              { inputPrompt}
            </Box>
          </Box>}

          {/* LLM Output */}
          {outputText && <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              ✅ LLM Output
            </Typography>
            <Box sx={sectionBoxStyle}>
              {outputText}
            </Box>
          </Box>}

          {/* BRAT visualization */}
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

        {/* Parse + Delete on left, Cancel on right */}
        <CardActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Check if this highlight ID start with L */}
            {highlight.id.startsWith("L") &&  <Tooltip
              title="Parse LLM JSON output and map entities to PDF highlights"
              arrow
            >
              <Button
                size="small"
                variant="contained"
                onClick={handleOpenParseDialog}
              >
                Parse JSON
              </Button>
            </Tooltip>}

            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleConfirmDeleteClick}
            >
              Delete
            </Button>
          </Box>

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

      {/* ✅ Parse JSON confirm dialog with full explanation */}
      <Dialog
        open={parseDialogOpen}
        onClose={handleCloseParseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mapping LLM Output to PDF</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="body2" paragraph>
              This button is used when the LLM output already follows the JSON format
              expected by the backend. If the output text is a valid JSON object like:
            </Typography>
            
            <Box
              component="pre"
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: "#f5f5f5",
                fontSize: "0.8rem",
                overflowX: "auto",
              }}
            >
      {`{
  "entities": [
      {
          "id": str,
          "type": str,
          "text": str,
          "start": int,
          "end": int
      }
  ],
  "relations": [
      {
          "id": str,
          "type": str,
          "arg1_id": str,
          "arg2_id": str
      }
  ]
}`}
            </Box>

            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              When the LLM output matches this schema, the backend can:
            </Typography>
            <ul style={{ marginTop: 0 }}>
              <li>Parse the LLM output into a structured JSON object.</li>
              <li>
                Map each <code>text</code> span and its <code>start</code> /
                <code>end</code> positions back to the PDF content.
              </li>
              <li>
                Automatically create entity highlights on the PDF corresponding to
                these spans.
              </li>
            </ul>

            <Typography variant="body2" paragraph sx={{ mt: 1 }}>
              Make sure your LLM prompt forces the model to output <b>only</b> this
              JSON (no extra text, comments, or explanations), so the backend can
              safely parse it.
            </Typography>

            <Typography variant="body2" paragraph sx={{ mt: 1 }}>
              If you are not sure, check that the output starts with <code>{"{"}</code>,
              ends with <code>{"}"}</code>, and is valid JSON without any additional
              notes or comments.
            </Typography>

            <Typography variant="body2" paragraph sx={{ mt: 1 }}>
              Click <b>Confirm Parse</b> to let the backend parse this JSON and map the
              entities to highlights on the PDF.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParseDialog}>Cancel</Button>
          <Button onClick={handleConfirmParse} variant="contained">
            Confirm Parse
          </Button>
        </DialogActions>
      </Dialog>
        

    </Box>
  );
};

export default LLMCommentForm;
