import React, { useEffect, useState, useMemo, useContext } from "react";
import { CommentedHighlight } from "../types";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../src/axiosSetup";
import { GlobalContext } from "../../../src/GlobalState";
import BratEmbeddingDefault from "./BratEmbeddingDefault";
import TwoSideComparisonDialog, {
  ComparisonData,
  MergeApiResponse,
} from "../../../src/components/TwoSideComparisonDialog";

import {
  Button,
  Typography,
  Box,
  Card,
  CardActions,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Tooltip,
  TextField,
  Grid,
  FormControl,
  FormControlLabel,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  Switch,
  Snackbar,
  Alert,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MergeTypeIcon from "@mui/icons-material/MergeType";

// ─── LLM Prompt Presets ────────────────────────────────────────────────

type LLMPresetId =
  | "default"
  | "natural-text"
  | "entities-detail"
  | "json-schema-reference";

interface LLMPreset {
  id: LLMPresetId;
  shortLabel: string;
  description: string;
  systemPrompt: string;
  inputPrompt: string;
}

const LLM_PROMPT_PRESETS: Record<LLMPresetId, LLMPreset> = {
  default: {
    id: "default",
    shortLabel: "Default",
    description:
      "Extract polymer property tuples (POLYMER | PROP_NAME | PROP_VALUE | CONDITION | CHAR_METHOD). Default preset for PolyMinder.",
    systemPrompt: `You are an information extraction assistant specialized in polymer science. Your task is to extract ONLY polymer property facts explicitly stated in the text.`,
    inputPrompt: `Extract all polymer property facts from the text.

Output format (one line per fact):
POLYMER | PROP_NAME | PROP_VALUE | CONDITION | CHAR_METHOD

Rules:
- Keep all numbers, units, symbols, percentages, Greek letters, subscript/superscript notations, and formatting EXACTLY as written in the text.
- CONDITION includes experimental conditions (temperature, heating rate, gas atmosphere, ramp rate, solvent, etc.).
- CHAR_METHOD should be the technique used (e.g., DSC, TGA, DMA, GPC, NMR, FTIR).
- If a field does not appear explicitly in the text, write "N/A".
- Output only the lines of extracted facts. Do NOT add explanations, lists, or commentary.`,
  },

  "natural-text": {
    id: "natural-text",
    shortLabel: "Rewrite Text",
    description:
      "Rewrite and clarify scientific text for better NER/RE extraction.",
    systemPrompt: `You rewrite and clarify scientific text so that NER and RE models can extract entities and relations more reliably.`,
    inputPrompt: `Rewrite the following text to make it clearer and easier for NER/RE extraction.

Requirements:
- Keep the meaning exactly the same.
- Preserve all scientific entities, conditions, and numbers exactly.
- Simplify grammar and sentence structure.
- Do NOT add details that are not explicitly in the text.
- If something is ambiguous, keep it ambiguous; do not guess.

Output only the rewritten text.`,
  },

  "entities-detail": {
    id: "entities-detail",
    shortLabel: "Entities Detail",
    description: "Extract detailed entities from text in JSON format.",
    systemPrompt: `You extract entities from text and return them strictly in valid JSON.
Do NOT add or guess information not in the text.
Preserve all wording, numbers, and units exactly as written.`,
    inputPrompt: `Extract all entities from the text and return them in valid JSON.

Rules:
- Use the exact wording from the text.
- Do NOT infer or add information.
- If an entity does not exist, do not create it.
- Output only valid JSON.

JSON schema:
{
  "entities": [
    {
      "type": "<ENTITY_TYPE>",
      "text": "<EXACT_SPAN>"
    }
  ]
}

ENTITY_TYPE (use only when appropriate):
- "POLYMER"
- "PROPERTY_NAME"
- "PROPERTY_VALUE"
- "CONDITION"
- "CHAR_METHOD"
- "MATERIAL"
- "PROCESS"
- "OTHER"

Output only the JSON object.
`,
  },

  "json-schema-reference": {
    id: "json-schema-reference",
    shortLabel: "JSON Schema Reference",
    description: "Reference schema for structured JSON output from LLM.",
    systemPrompt: `Extract all entities and relations from the text.

Entity Extraction Rules:
1. Extract entities strictly in the order they appear.
2. Entity types must be one of: "POLYMER", "PROP_NAME", "PROP_VALUE", "CONDITION", "CHAR_METHOD".
3. The "text" field must be an exact copy of the string in the source.
4. Include the character start and end indices for each entity.
5. If an entity appears multiple times, list it multiple times (create a new ID for each).
6. Assign a unique ID (T1, T2, etc.) to each entity.

Relation Extraction Rules:
1. After extracting entities, identify relationships between them.
2. Relation types must be one of: "has_property", "has_value".
    - "has_property": Links a POLYMER to a PROP_NAME (e.g., polymer has a property).
    - "has_value": Links a PROP_NAME to a PROP_VALUE (e.g., property has a value).
3. Assign a unique ID (R1, R2, etc.) to each relation.
4. arg1_id is the source entity ID, arg2_id is the target entity ID.
5. Only create relations where there is a clear semantic connection in the text.

Output format:
{
    "entities": [...],
    "relations": [...]
}
    `,
    inputPrompt: `Now extract all entities and relations in the text below. Make sure each entity has an id, type, text, start and end. For relations, identify the relationship between entities and specify the type, arg1_id (source entity), and arg2_id (target entity):`,
  },
};

// ─── Props ─────────────────────────────────────────────────────────────

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
  pdfScaleValue?: number | string;
  setIsActive?: (active: boolean) => void;
  setHighlights?: (highlights: CommentedHighlight[]) => void;
}

type InnerBratDoc = {
  text: string;
  entities: any[];
  relations: any[];
};

// ─── Component ─────────────────────────────────────────────────────────

const LLMCommentForm = ({
  onSubmit,
  highlight,
  brat_item,
  setCommentDialogData,
  toggleEditInProgress,
  pdfHighlighterUtils,
  onOpenTreeDialog,
  pdfScaleValue = 1.0,
  setIsActive,
  setHighlights,
}: LLMCommentFormProps) => {
  // ── Global context ──
  const globalContext = useContext(GlobalContext);
  if (!globalContext) {
    throw new Error("GlobalContext is undefined");
  }

  const {
    documentId,
    updateId,
    LLLOutput,
    supportedModels,
    setBratOutput,
    setDocumentId,
    setUpdateId,
    setFileName,
    setTableOutput,
    setLLLOutput,
  } = globalContext as any;

  const navigateTo = useNavigate();

  // ── Check for existing LLM results for this paragraph ──
  const existingLlmResults = useMemo(() => {
    if (!LLLOutput || !Array.isArray(LLLOutput)) return [];
    return LLLOutput.filter(
      (item: any) => item.para_id === highlight.para_id,
    );
  }, [LLLOutput, highlight.para_id]);

  const hasOutput = Boolean(
    (highlight as any).llm_output_text || existingLlmResults.length > 0,
  );

  // ── View mode: "prepare" if no results, "result" if results exist ──
  const [viewMode, setViewMode] = useState<"prepare" | "result">(
    hasOutput ? "result" : "prepare",
  );

  // ── Effective highlight for result view ──
  const effectiveHighlight = useMemo(() => {
    // If the highlight itself has LLM output, use it directly
    if ((highlight as any).llm_output_text) return highlight;
    // Otherwise, build from the latest LLLOutput entry for this paragraph
    if (existingLlmResults.length > 0) {
      const latest = existingLlmResults[existingLlmResults.length - 1];
      return {
        ...highlight,
        id: latest.id?.toString() || highlight.id,
        llm_input_text: latest.text || latest.original_text || "",
        llm_system_prompt: latest.system_prompt || "",
        llm_input_prompt: latest.prompt || "",
        llm_output_text: latest.result || latest.output || "",
        apply_pipeline: latest.apply_pipeline || false,
        parsed_output: latest.parsed_output || null,
        entities: latest.entities || [],
        relations: latest.relations || [],
        text: latest.text || "",
        content: {
          text:
            latest.text ||
            latest.original_text ||
            highlight.content?.text ||
            "",
        },
      } as any;
    }
    return highlight;
  }, [highlight, existingLlmResults]);

  // ── Prepare mode state ──
  const [selectedLLMModel, setSelectedLLMModel] = useState<string>(
    supportedModels?.[0] || "",
  );
  const [topK, setTopK] = useState<number>(50);
  const [topP, setTopP] = useState<number>(0.9);
  const [temperature, setTemperature] = useState<number>(0.1);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);

  const [llmRunMode, setLLMRunMode] = useState<"pipeline" | "llm-only">(
    "llm-only",
  );
  const [llmOutputMode, setLLMOutputMode] = useState<"text" | "json">("text");

  const [llmTextSystemPrompt, setLLMTextSystemPrompt] = useState(
    LLM_PROMPT_PRESETS["default"].systemPrompt,
  );
  const [llmTextInputPrompt, setLLMTextInputPrompt] = useState(
    LLM_PROMPT_PRESETS["default"].inputPrompt,
  );
  const [llmJsonSystemPrompt, setLLMJsonSystemPrompt] = useState(
    LLM_PROMPT_PRESETS["json-schema-reference"].systemPrompt,
  );
  const [llmJsonInputPrompt, setLLMJsonInputPrompt] = useState(
    LLM_PROMPT_PRESETS["json-schema-reference"].inputPrompt,
  );
  const [llmJsonSchema, setLLMJsonSchema] = useState(
    `{
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
}`,
  );

  const [llmTemplateId, setLLMTemplateId] = useState<LLMPresetId>("default");
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Result mode state ──
  const [isVisible, setIsVisible] = useState(true);
  const [key, setKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [parseDialogOpen, setParseDialogOpen] = useState(false);

  // ── Comparison & Merge state ──
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  // ── Error alert state ──
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // ── Effects ──
  useEffect(() => {
    if (supportedModels && supportedModels.length > 0 && !selectedLLMModel) {
      setSelectedLLMModel(supportedModels[0]);
    }
  }, [supportedModels]);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [effectiveHighlight]);

  // ── Common handlers ──
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

  // ── Prepare mode: Run LLM ──
  const handleRunWithLLM = async () => {
    setIsGenerating(true);
    setIsActive?.(true);

    try {
      const token = localStorage.getItem("accessToken");
      const selectedText =
        highlight.content?.text || brat_item?.text || "";
      const pageId =
        (highlight.position?.boundingRect as any)?.pageNumber ?? 1;

      const systemPromptToSend =
        llmOutputMode === "text" ? llmTextSystemPrompt : llmJsonSystemPrompt;
      const inputPromptToSend =
        llmOutputMode === "text" ? llmTextInputPrompt : llmJsonInputPrompt;

      const payload: any = {
        document_id: documentId,
        update_id: updateId,
        position: highlight.position,
        para_id: highlight.para_id,
        scale_value:
          typeof pdfScaleValue === "number" ? pdfScaleValue : 1.0,
        page_id: pageId,
        text: selectedText,
        system_prompt: systemPromptToSend,
        prompt: inputPromptToSend,
        apply_pipeline: llmRunMode === "pipeline",
        llm_setting: {
          name: selectedLLMModel,
          top_k: topK,
          top_p: topP,
          temp: temperature,
          max_tokens: maxTokens,
          thinking_mode: thinkingMode,
        },
      };

      if (llmOutputMode === "json") {
        payload.json_schema = llmJsonSchema;
      }

      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/run-with-LLM`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;

      if (llmRunMode === "pipeline") {
        if (data.brat_format_output) setBratOutput(data.brat_format_output);
        if (data.table_output) setTableOutput(data.table_output);
        if (data.document_id) setDocumentId(data.document_id);
        if (data.update_id) setUpdateId(data.update_id);
        if (data.filename) setFileName(data.filename);
        if (data.llm_texts) setLLLOutput(data.llm_texts);

        navigateTo("/result", {
          state: {
            highlights: data.pdf_format_output,
            url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${data.filename}`,
          },
        });
      } else {
        // LLM-only mode: update global state and switch to result view
        if (data.llm_texts) setLLLOutput(data.llm_texts);
        console.log("LLM-only mode result:", data);
        setViewMode("result");
      }
    } catch (error: any) {
      console.error("Error running /run-with-LLM:", error);
      setAlertMessage(error?.response?.data?.detail || error?.message || "Failed to run LLM.");
    } finally {
      setIsGenerating(false);
      setIsActive?.(false);
    }
  };

  // ── Result mode: Delete ──
  const handleConfirmDeleteClick = () => setConfirmOpen(true);

  const handleDelete = async () => {
    try {
      setIsActive?.(true);
      toggleEditInProgress(true);
      const payload = {
        document_id: documentId,
        update_id: updateId,
        llm_text_id: effectiveHighlight.id,
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
        },
      );
      const data = response.data;
      if (data.llm_texts) setLLLOutput(data.llm_texts);
    } catch (error: any) {
      console.error("Error deleting entity:", error);
      setAlertMessage(error?.response?.data?.detail || error?.message || "Failed to delete entity.");
    } finally {
      setIsActive?.(false);
      setConfirmOpen(false);
      toggleEditInProgress(false);
      handleClose();
    }
  };

  // ── Result mode: Parse JSON ──
  const handleOpenParseDialog = () => setParseDialogOpen(true);
  const handleCloseParseDialog = () => setParseDialogOpen(false);

  const handleConfirmParse = async () => {
    setIsActive?.(true);
    toggleEditInProgress(true);

    try {
      const payload = {
        document_id: documentId,
        update_id: updateId,
        llm_text_id: effectiveHighlight.id,
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
      if (data.llm_texts) setLLLOutput(data.llm_texts);

      // ✅ close ONLY when success
      setParseDialogOpen(false);
      toggleEditInProgress(false);
      setIsActive?.(false);
      handleClose();
    } catch (e: any) {
      console.error("Error parsing LLM JSON:", e);

      // ✅ keep dialog/component open so Snackbar can render
      setAlertMessage(
        "Parsing failed. Please ensure the LLM output is valid JSON that matches the expected schema.",
      );

      toggleEditInProgress(false);
      setIsActive?.(false);

      // optional: keep parse dialog open so user can retry
      // setParseDialogOpen(true);

      setParseDialogOpen(false);
    }
  };


  // ── Comparison & Merge handlers ──
  const handleOpenComparison = async () => {
    setIsActive?.(true);

    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        document_id: documentId,
        update_id: updateId,
        llm_text_id: effectiveHighlight.id,
        paragraph_id: highlight.para_id,
      };

      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/compare-with-model-output`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setComparisonData(response.data);
      setIsComparisonOpen(true);
    } catch (error: any) {
      console.error("Error fetching comparison data:", error);
      setAlertMessage(error?.response?.data?.detail || error?.message || "Failed to load comparison.");
    } finally {
      setIsActive?.(false);
    }
  };

  const handleCloseComparison = () => {
    setIsComparisonOpen(false);
    setComparisonData(null);
  };

  const handleMergeSuccess = (response: MergeApiResponse | any) => {
    // Update global state with merged data
    if (response.brat_format_output) setBratOutput(response.brat_format_output);
    if (response.llm_texts) setLLLOutput(response.llm_texts);
    if (response.document_id) setDocumentId(response.document_id);
    if (response.update_id) setUpdateId(response.update_id);
    if (response.filename) setFileName(response.filename);
    if (response.pdf_format_output) setHighlights?.(response.pdf_format_output);
    
    // If this is an LLM edit response (has llm_text but not llm_texts)
    // Update the specific entry in LLLOutput to refresh BRAT visualization
    if (response.llm_text && !response.llm_texts && LLLOutput && Array.isArray(LLLOutput)) {
      const updatedLLLOutput = LLLOutput.map((item: any) => {
        // Find the matching entry by ID
        if (item.id?.toString() === effectiveHighlight.id) {
          return {
            ...item,
            parsed_output: {
              ...item.parsed_output,
              brat_format_output: [{
                text: response.llm_text.text,
                entities: response.llm_text.entities,
                relations: response.llm_text.relations
              }]
            }
          };
        }
        return item;
      });
      setLLLOutput(updatedLLLOutput);
      
      // Also update comparison data
      setComparisonData(response);
    }
  };

  // ── Result mode BRAT doc ──
  const hlForResult = effectiveHighlight as any;
  const resultSelectedText: string =
    hlForResult.llm_input_text ||
    hlForResult.content?.text ||
    brat_item?.text ||
    "";
  const resultSystemPrompt: string = hlForResult.llm_system_prompt || "";
  const resultInputPrompt: string = hlForResult.llm_input_prompt || "";
  const resultOutputText: string = hlForResult.llm_output_text || "";

  const bratDoc: InnerBratDoc = useMemo(() => {
    const h: any = effectiveHighlight;
    const bratArr = h.parsed_output?.brat_format_output;
    if (!bratArr || !Array.isArray(bratArr) || bratArr.length === 0) return {} as InnerBratDoc;

    console.log('bratArr:', bratArr);
    return bratArr[0] as InnerBratDoc;
  }, [effectiveHighlight]);

  const sectionBoxStyle = {
    border: "1px solid #e0e0e0",
    borderRadius: 1,
    p: 1.5,
    mt: 0.5,
    maxHeight: 220,
    overflowY: "auto" as const,
    whiteSpace: "pre-wrap" as const,
    bgcolor: "#fafafa",
  };

  const errorSnackbar = (
    <Snackbar
      open={Boolean(alertMessage)}
      autoHideDuration={6000}
      onClose={() => setAlertMessage(null)}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={() => setAlertMessage(null)}
        severity="error"
        variant="filled"
        sx={{ width: "100%" }}
      >
        {alertMessage}
      </Alert>
    </Snackbar>
  );

  if (!isVisible) return null;

  // ════════════════════════════════════════════════════════════════════
  //  PREPARE VIEW — shown when the block has no LLM results yet
  // ════════════════════════════════════════════════════════════════════
  if (viewMode === "prepare") {
    const prepareText =
      highlight.content?.text || brat_item?.text || "";

    return (
      <>
        <DialogTitle>
          <Typography variant="h6" sx={{ textAlign: "center" }}>
            🧠 Prepare LLM Extraction
          </Typography>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            height: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Generation type selector */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 0.5 }}
            >
              Generation type
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5 }}
            >
              Choose whether you want free-form text generation or structured
              JSON output that follows an entity schema.
            </Typography>

            <FormControl fullWidth>
              <ToggleButtonGroup
                value={llmOutputMode}
                exclusive
                onChange={(_, value) => {
                  if (!value) return;
                  setLLMOutputMode(value as "text" | "json");
                }}
                sx={{
                  width: "100%",
                  "& .MuiToggleButton-root": {
                    flex: 1,
                    textTransform: "none",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    px: 2,
                    py: 1.5,
                    borderRadius: 1.5,
                    gap: 1.5,
                  },
                }}
              >
                <ToggleButton value="text">
                  <Box textAlign="left">
                    <Typography variant="body2" fontWeight="bold">
                      📝 Text generation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Produce natural language text (annotations, explanations,
                      or reformatted content).
                    </Typography>
                  </Box>
                </ToggleButton>

                <ToggleButton value="json">
                  <Box textAlign="left">
                    <Typography variant="body2" fontWeight="bold">
                      🧩 Structured generation (JSON format)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ask the LLM to output machine-readable JSON that can be
                      parsed and mapped back to PDF highlights.
                    </Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>

              <FormHelperText sx={{ mt: 1 }}>
                Use <b>Structured generation</b> when you need entities and
                offsets in JSON for automatic post-processing.
              </FormHelperText>
            </FormControl>
          </Box>

          {/* Main content: selected text + prompts */}
          <Grid
            container
            spacing={2}
            sx={{ flex: 1, minHeight: 0 }}
          >
            {/* LEFT: Selected text preview */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                📄 Selected Text{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  (Read-only)
                </Typography>
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 1,
                  bgcolor: "background.paper",
                  overflowY: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {prepareText || "(No text selected)"}
                </Typography>
              </Box>
            </Grid>

            {/* RIGHT: prompts */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                ✏️ LLM Prompts{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  (Editable)
                </Typography>
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    pr: 0.5,
                  }}
                >
                  {/* Advanced Settings Accordion */}
                  <Accordion
                    disableGutters
                    defaultExpanded={false}
                    sx={{
                      mb: 1.5,
                      borderRadius: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === "light"
                          ? "grey.50"
                          : "grey.900",
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "none",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon fontSize="small" />}
                      sx={{
                        px: 2,
                        py: 1.25,
                        "& .MuiAccordionSummary-content": {
                          alignItems: "center",
                          margin: 0,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          justifyContent: "space-between",
                          gap: 1.5,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Advanced settings
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Presets, backend mode & parameters
                          </Typography>
                        </Box>
                        <Chip
                          label="Optional"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 10 }}
                        />
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 1.5, pb: 2, px: 2 }}>
                      <Stack spacing={2}>
                        {/* Model Parameters */}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px dashed",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mb: 1,
                              display: "block",
                              fontWeight: 600,
                            }}
                          >
                            Model Parameters
                          </Typography>

                          <Grid
                            container
                            spacing={2}
                            alignItems="center"
                          >
                            <Grid item xs={6}>
                              <Typography variant="caption" gutterBottom>
                                Top-K: {topK}
                              </Typography>
                              <Slider
                                value={topK}
                                min={0}
                                max={100}
                                step={1}
                                onChange={(_, v) => setTopK(v as number)}
                                valueLabelDisplay="auto"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" gutterBottom>
                                Top-P: {topP}
                              </Typography>
                              <Slider
                                value={topP}
                                min={0}
                                max={1}
                                step={0.05}
                                onChange={(_, v) => setTopP(v as number)}
                                valueLabelDisplay="auto"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" gutterBottom>
                                Temperature: {temperature}
                              </Typography>
                              <Slider
                                value={temperature}
                                min={0}
                                max={2}
                                step={0.1}
                                onChange={(_, v) =>
                                  setTemperature(v as number)
                                }
                                valueLabelDisplay="auto"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" gutterBottom>
                                Max Tokens: {maxTokens}
                              </Typography>
                              <Slider
                                value={maxTokens}
                                min={256}
                                max={8192}
                                step={256}
                                onChange={(_, v) =>
                                  setMaxTokens(v as number)
                                }
                                valueLabelDisplay="auto"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                sx={{ ml: 0 }}
                                control={
                                  <Switch
                                    checked={thinkingMode}
                                    onChange={(e) =>
                                      setThinkingMode(e.target.checked)
                                    }
                                  />
                                }
                                label={
                                  <Typography variant="caption">
                                    Enable Thinking (CoT)
                                  </Typography>
                                }
                              />
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Prompt preset (text mode only) */}
                        {llmOutputMode === "text" && (
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              border: "1px dashed",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mb: 0.5, display: "block" }}
                            >
                              Prompt preset (text generation)
                            </Typography>
                            <ToggleButtonGroup
                              value={llmTemplateId}
                              exclusive
                              onChange={(_, value) => {
                                if (!value) return;
                                const presetId = value as LLMPresetId;
                                setLLMTemplateId(presetId);

                                const preset = LLM_PROMPT_PRESETS[presetId];
                                setLLMTextSystemPrompt(preset.systemPrompt);
                                setLLMTextInputPrompt(preset.inputPrompt);
                              }}
                              sx={{
                                width: "100%",
                                "& .MuiToggleButton-root": {
                                  flex: 1,
                                  textTransform: "none",
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 1.5,
                                  fontSize: 13,
                                },
                              }}
                            >
                              <ToggleButton value="default">
                                {LLM_PROMPT_PRESETS["default"].shortLabel}
                              </ToggleButton>
                              <ToggleButton value="natural-text">
                                {
                                  LLM_PROMPT_PRESETS["natural-text"]
                                    .shortLabel
                                }
                              </ToggleButton>
                              <ToggleButton value="entities-detail">
                                {
                                  LLM_PROMPT_PRESETS["entities-detail"]
                                    .shortLabel
                                }
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                        )}

                        {/* Backend mode */}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px dashed",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: "block" }}
                          >
                            LLM backend mode
                          </Typography>
                          <ToggleButtonGroup
                            value={llmRunMode}
                            exclusive
                            onChange={(_, value) => {
                              if (!value) return;
                              setLLMRunMode(
                                value as "pipeline" | "llm-only",
                              );
                            }}
                            sx={{
                              width: "100%",
                              "& .MuiToggleButton-root": {
                                flex: 1,
                                textTransform: "none",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                px: 1.5,
                                py: 1,
                                borderRadius: 1.5,
                                gap: 1,
                                fontSize: 13,
                              },
                            }}
                          >
                            <ToggleButton value="llm-only">
                              <Box textAlign="left">
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                >
                                  ✨ LLM only
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Store output in LLM panel only.
                                </Typography>
                              </Box>
                            </ToggleButton>

                            <ToggleButton value="pipeline">
                              <Box textAlign="left">
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                >
                                  🔗 Pipeline
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Feed output to NER/RE.
                                </Typography>
                              </Box>
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {/* Model Selector */}
                  <FormControl
                    fullWidth
                    sx={{ mb: 2, bgcolor: "background.paper" }}
                  >
                    <InputLabel id="llm-model-select-label">
                      Model
                    </InputLabel>
                    <Select
                      labelId="llm-model-select-label"
                      value={selectedLLMModel}
                      label="Model"
                      onChange={(e) => setSelectedLLMModel(e.target.value)}
                    >
                      {supportedModels && supportedModels.length > 0 ? (
                        supportedModels.map((model: string) => (
                          <MenuItem key={model} value={model}>
                            {model}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No models available
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  {/* Prompts */}
                  <Box sx={{ mt: 1.5 }}>
                    <TextField
                      label={
                        llmOutputMode === "text"
                          ? "System Prompt (text generation)"
                          : "System Prompt (structured JSON generation)"
                      }
                      fullWidth
                      multiline
                      minRows={4}
                      value={
                        llmOutputMode === "text"
                          ? llmTextSystemPrompt
                          : llmJsonSystemPrompt
                      }
                      onChange={(e) => {
                        if (llmOutputMode === "text") {
                          setLLMTextSystemPrompt(e.target.value);
                        } else {
                          setLLMJsonSystemPrompt(e.target.value);
                        }
                      }}
                      sx={{
                        mb: 2,
                        "& textarea": {
                          fontFamily: "monospace",
                          fontSize: 13,
                        },
                      }}
                    />

                    <TextField
                      label={
                        llmOutputMode === "text"
                          ? "Input Prompt (text generation)"
                          : "Input Prompt (structured JSON generation)"
                      }
                      fullWidth
                      multiline
                      minRows={6}
                      value={
                        llmOutputMode === "text"
                          ? llmTextInputPrompt
                          : llmJsonInputPrompt
                      }
                      onChange={(e) => {
                        if (llmOutputMode === "text") {
                          setLLMTextInputPrompt(e.target.value);
                        } else {
                          setLLMJsonInputPrompt(e.target.value);
                        }
                      }}
                      sx={{
                        "& textarea": {
                          fontFamily: "monospace",
                          fontSize: 13,
                        },
                      }}
                    />
                    <FormHelperText sx={{ mt: 0.5 }}>
                      {llmOutputMode === "text"
                        ? "These prompts control how the model generates natural language responses."
                        : "These prompts should clearly tell the model to output only valid JSON matching your schema."}
                    </FormHelperText>

                    {/* JSON schema editor – structured mode only */}
                    {llmOutputMode === "json" && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          label="JSON schema (reference for structured output)"
                          fullWidth
                          multiline
                          minRows={6}
                          value={llmJsonSchema}
                          onChange={(e) =>
                            setLLMJsonSchema(e.target.value)
                          }
                          sx={{
                            "& textarea": {
                              fontFamily: "monospace",
                              fontSize: 13,
                            },
                          }}
                        />
                        <FormHelperText sx={{ mt: 0.5 }}>
                          This schema is used as a reference for how the JSON
                          should look.
                        </FormHelperText>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRunWithLLM}
            variant="contained"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Run LLM"}
          </Button>
        </DialogActions>
        {errorSnackbar}
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  //  RESULT VIEW — shown when LLM results exist
  // ════════════════════════════════════════════════════════════════════
  return (
    <>
    <DialogContent>
      <Box>
        <Card key={key} sx={{ minWidth: 300, width: "100%", boxShadow: 0 }}>
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              LLM Extraction Result
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              Highlight ID: {effectiveHighlight.id}
            </Typography>

            {/* Selected Text */}
            <Box mt={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                📄 Selected Text
              </Typography>
              <Box sx={sectionBoxStyle}>
                {resultSelectedText && resultSelectedText.trim().length > 0
                  ? resultSelectedText
                  : "(No input text available)"}
              </Box>
            </Box>

            {/* System Prompt */}
            {resultSystemPrompt && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  🧠 System Prompt
                </Typography>
                <Box sx={sectionBoxStyle}>{resultSystemPrompt}</Box>
              </Box>
            )}

            {/* Input Prompt */}
            {resultInputPrompt && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  ✏️ Input Prompt
                </Typography>
                <Box sx={sectionBoxStyle}>{resultInputPrompt}</Box>
              </Box>
            )}

            {/* LLM Output */}
            {resultOutputText && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  ✅ LLM Output
                </Typography>
                <Box sx={sectionBoxStyle}>{resultOutputText}</Box>
              </Box>
            )}

            {/* BRAT visualization */}
            {bratDoc.text && (
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
            {(effectiveHighlight as any).user_comment &&
              (effectiveHighlight as any).user_comment.length > 0 && (
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
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-line" }}
                    >
                      {(effectiveHighlight as any).user_comment}
                    </Typography>
                  </Box>
                </>
              )}
          </CardContent>

          {/* Actions */}
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: 2,
              pb: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              {/* Re-run LLM: switch back to prepare mode */}
              <Button
                size="small"
                variant="outlined"
                onClick={() => setViewMode("prepare")}
              >
                Re-run LLM
              </Button>

              {/* Parse JSON (only if ID starts with "L") */}
              {effectiveHighlight.id.startsWith("L") && (
                <Tooltip
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
                </Tooltip>
              )}

              {/* Compare & Merge button — only visible when parsed brat output exists */}
              {bratDoc.text && (
                <Tooltip
                  title="Compare LLM results with model output, then merge"
                  arrow
                >
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    startIcon={<MergeTypeIcon />}
                    onClick={handleOpenComparison}
                  >
                    Compare & Merge
                  </Button>
                </Tooltip>
              )}

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

        {/* Parse JSON confirm dialog */}
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
                This button is used when the LLM output already follows the
                JSON format expected by the backend. If the output text is a
                valid JSON object like:
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
                <li>
                  Parse the LLM output into a structured JSON object.
                </li>
                <li>
                  Map each <code>text</code> span and its{" "}
                  <code>start</code> / <code>end</code> positions back to the
                  PDF content.
                </li>
                <li>
                  Automatically create entity highlights on the PDF
                  corresponding to these spans.
                </li>
              </ul>

              <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                Make sure your LLM prompt forces the model to output{" "}
                <b>only</b> this JSON (no extra text, comments, or
                explanations), so the backend can safely parse it.
              </Typography>

              <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                If you are not sure, check that the output starts with{" "}
                <code>{"{"}</code>, ends with <code>{"}"}</code>, and is
                valid JSON without any additional notes or comments.
              </Typography>

              <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                Click <b>Confirm Parse</b> to let the backend parse this
                JSON and map the entities to highlights on the PDF.
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
    </DialogContent>

    {/* ── Two-Side Comparison Dialog (with built-in merge) ── */}
    <TwoSideComparisonDialog
      open={isComparisonOpen}
      onClose={handleCloseComparison}
      data={comparisonData}
      modelParaId={highlight.para_id || 0}
      documentId={documentId}
      updateId={updateId}
      llmTextId={effectiveHighlight.id}
      onMergeSuccess={handleMergeSuccess}
    />
    {errorSnackbar}
    </>
  );
};

export default LLMCommentForm;
