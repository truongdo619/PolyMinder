import React, { useLayoutEffect, useRef, useState } from "react";
import CommentForm from "./CommentForm";
import {
  GhostHighlight,
  PdfSelection,
  usePdfHighlighterContext,
} from "../react-pdf-highlighter-extended";
import "../style/ExpandableTip.css";
import { Box } from "@mui/material";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: string) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);
  const selectionRef = useRef<PdfSelection | null>(null);

  const {
    getCurrentSelection,
    removeGhostHighlight,
    setTip,
    updateTipPosition,
  } = usePdfHighlighterContext();

  useLayoutEffect(() => {
    updateTipPosition!();
  }, [compact]);

  return (
    <div className="Tip">
      {compact ? (
        <Box>
          <button
            className="Tip__compact"
            onClick={() => {
              setCompact(false);
              selectionRef.current = getCurrentSelection();
              selectionRef.current!.makeGhostHighlight();
            }}
          >
            Add highlight
          </button>

          <button
            className="Tip__compact"
            onClick={() => {
              setCompact(false);
              selectionRef.current = getCurrentSelection();
              selectionRef.current!.makeGhostHighlight();
            }}
          >
            Run with LLM
          </button>
        </Box>
      ) : (
        <CommentForm
          placeHolder="New Entity..."
          onSubmit={(input) => {
            addHighlight(
              {
                content: selectionRef.current!.content,
                position: selectionRef.current!.position,
              },
              input,
            );

            removeGhostHighlight();
            setTip(null);
          }}
        />
      )}
    </div>
  );
};

export default ExpandableTip;
