import React, { useLayoutEffect, useRef, useState, useContext } from "react";
import CommentForm from "./CommentForm";
import {
  GhostHighlight,
  PdfSelection,
  usePdfHighlighterContext,
} from "../react-pdf-highlighter-extended";
import "../style/ExpandableTip.css";
import { Box } from "@mui/material";

import { GlobalContext } from "../GlobalState";

interface ExpandableTipLLMProps {
  addHighlight: (highlight: GhostHighlight, comment: string) => void;
  setIsActive?: (active: boolean) => void;

  /**
   * Kept for future compatibility (no longer used here).
   * Parent runs /run-with-LLM.
   */
  onRunLLM?: (args: {
    selection: PdfSelection;
    systemPrompt: string;
    inputPrompt: string;
  }) => Promise<void> | void;

  /**
   * NEW: Ask parent to open the LLM dialog with the current selection.
   */
  onOpenLLMDialog?: (args: {
    selection: PdfSelection;
    defaultSystemPrompt: string;
    defaultInputPrompt: string;
  }) => void;
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

type PanelMode = "compact" | "comment";

const ExpandableTipLLM = ({
  addHighlight,
  setIsActive,
  onOpenLLMDialog,
}: ExpandableTipLLMProps) => {
  const [mode, setMode] = useState<PanelMode>("compact");
  const selectionRef = useRef<PdfSelection | null>(null);

  const global = useContext(GlobalContext);
  if (!global) throw new Error("GlobalContext must be used within a GlobalProvider");

  const { getCurrentSelection, removeGhostHighlight, setTip, updateTipPosition } =
    usePdfHighlighterContext();

  useLayoutEffect(() => {
    updateTipPosition?.();
  }, [mode, updateTipPosition]);

  const openAddHighlight = () => {
    setMode("comment");
    selectionRef.current = getCurrentSelection();
    selectionRef.current?.makeGhostHighlight();
  };

  const handleRunLLMClick = () => {
    const selection = getCurrentSelection();
    if (!selection) return;

    selectionRef.current = selection;

    // If you still want the ghost highlight, keep this line.
    // selection.makeGhostHighlight();

    // Ask parent to open dialog
    onOpenLLMDialog?.({
      selection,
      defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
      defaultInputPrompt: DEFAULT_INPUT_PROMPT,
    });

    // Close the small tip box
    removeGhostHighlight();
    setTip(null);
    setMode("compact");
  };

  const closePanel = () => {
    removeGhostHighlight();
    setTip(null);
    setMode("compact");
  };

  return (
    <div className="Tip">
      {mode === "compact" && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <button className="Tip__compact" onClick={openAddHighlight}>
            Add highlight
          </button>

          <button className="Tip__compact" onClick={handleRunLLMClick}>
            Run with LLM
          </button>
        </Box>
      )}

      {mode === "comment" && (
        <CommentForm
          placeHolder="New Entity..."
          onSubmit={(input) => {
            if (!selectionRef.current) return;
            addHighlight(
              {
                content: selectionRef.current.content,
                position: selectionRef.current.position,
              },
              input,
            );
            closePanel();
          }}
          onCancel={closePanel}
        />
      )}
    </div>
  );
};

export default ExpandableTipLLM;
