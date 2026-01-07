import React, { useLayoutEffect, useRef, useState, useContext } from "react";
import CommentForm from "./CommentForm";
import {
  GhostHighlight,
  PdfSelection,
  usePdfHighlighterContext,
} from "../react-pdf-highlighter-extended";
import "../style/ExpandableTip.css";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

import { GlobalContext } from '../GlobalState';

interface ExpandableTipLLMProps {
  addHighlight: (highlight: GhostHighlight, comment: string) => void;
  setIsActive?: (active: boolean) => void;

  /**
   * Run LLM in the parent component (ResultComponent).
   * Parent is responsible for calling /run-with-LLM and updating global state.
   */
  onRunLLM?: (args: {
    selection: PdfSelection;
    systemPrompt: string;
    inputPrompt: string;
  }) => Promise<void> | void;
}

const DEFAULT_SYSTEM_PROMPT = `You extract polymer-related facts from scientific text.
Each fact must follow:
POLYMER | PROP_NAME | PROP_VALUE | CONDITION | CHAR_METHOD
Use the exact wording from the text. Do not guess or add information.`;

const DEFAULT_INPUT_PROMPT = `Extract all polymer property facts.

Output format (one line per fact):
POLYMER | PROP_NAME | PROP_VALUE | CONDITION | CHAR_METHOD

Rules:
- Keep all numbers, units, symbols exactly as written.
- CONDITION includes things like heating rate, atmosphere, temperature program, etc.
- If a field is not stated, write "N/A".
- Output only the lines, no extra text.`;

type PanelMode = "compact" | "comment" | "llm";

const ExpandableTipLLM = ({ addHighlight, setIsActive, onRunLLM }: ExpandableTipLLMProps) => {
  const [mode, setMode] = useState<PanelMode>("compact");
  const selectionRef = useRef<PdfSelection | null>(null);

  const global = useContext(GlobalContext);
  if (!global) throw new Error("GlobalContext must be used within a GlobalProvider");

  const {
    getCurrentSelection,
    removeGhostHighlight,
    setTip,
    updateTipPosition,
  } = usePdfHighlighterContext();

  useLayoutEffect(() => {
    updateTipPosition?.();
  }, [mode, updateTipPosition]);

  // LLM inline panel state
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [inputPrompt, setInputPrompt] = useState(DEFAULT_INPUT_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);

  const getSelectedText = () => selectionRef.current?.content?.text ?? "";

  const openAddHighlight = () => {
    setMode("comment");
    selectionRef.current = getCurrentSelection();
    selectionRef.current?.makeGhostHighlight();
  };

  const openLLMPanel = () => {
    setMode("llm");
    selectionRef.current = getCurrentSelection();
    // Optional: show the ghost selection too for consistency
    selectionRef.current?.makeGhostHighlight();
  };

  const closePanel = () => {
    removeGhostHighlight();
    setTip(null);
    setMode("compact");
  };

  const handleGenerate = async () => {
    if (!selectionRef.current || !onRunLLM) return;

    setIsGenerating(true);
    setIsActive?.(true);

    try {
      await onRunLLM({
        selection: selectionRef.current,
        systemPrompt,
        inputPrompt,
      });
      // Parent (after successful /run-with-LLM) updates state;
      // here we only close the inline panel.
      closePanel();
    } finally {
      setIsGenerating(false);
      setIsActive?.(false);
    }
  };

  return (
    <div className="Tip">
      {mode === "compact" && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <button className="Tip__compact" onClick={openAddHighlight}>
            Add highlight
          </button>

          <button className="Tip__compact" onClick={openLLMPanel}>
            Run with LLM
          </button>
        </Box>
      )}

      {mode === "comment" && (
        <CommentForm
          placeHolder="New Entity..."
          onSubmit={(input) => {
            addHighlight(
              {
                content: selectionRef.current!.content,
                position: selectionRef.current!.position,
              },
              input
            );
            closePanel();
          }}
          onCancel={closePanel}
        />
      )}

      {mode === "llm" && (
        <Box
          sx={{
            p: 2,
            width: "40vw",
            maxWidth: 900,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            boxShadow: 3,
            backgroundColor: "white",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
            🧠 Prepare LLM Extraction
          </Typography>

          <Grid container spacing={2}>
            {/* LEFT: Selected text preview (read-only) */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                📄 Selected Text{" "}
                <Typography component="span" variant="caption" color="text.secondary">
                  (Read-only)
                </Typography>
              </Typography>
              <TextField
                label="Selected Text"
                fullWidth
                multiline
                minRows={12}
                value={(getSelectedText().slice(0, 1000) || "") + (getSelectedText() ? "..." : "")}
                InputProps={{
                  readOnly: true,
                  sx: { cursor: "not-allowed" },
                }}
              />
            </Grid>

            {/* RIGHT: Prompts (editable) */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                ✏️ LLM Prompts{" "}
                <Typography component="span" variant="caption" color="text.secondary">
                  (Editable)
                </Typography>
              </Typography>

              <TextField
                label="System Prompt"
                fullWidth
                multiline
                minRows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                sx={{
                  mb: 2,
                  "& textarea": { fontFamily: "monospace", fontSize: 13 },
                }}
              />

              <TextField
                label="Input Prompt"
                fullWidth
                multiline
                minRows={6}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                sx={{
                  "& textarea": { fontFamily: "monospace", fontSize: 13 },
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                closePanel();
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate();
              }}
              variant="contained"
              disabled={isGenerating || !onRunLLM || !selectionRef.current}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default ExpandableTipLLM;
