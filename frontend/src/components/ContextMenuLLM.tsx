import React from "react";
import "../style/ContextMenu.css";

export interface ContextMenuLLMProps {
  xPos: any;
  yPos: any;
  onCompare: () => void; // ⬅️ Changed from editComment
  deleteHighlight: () => void;
}

const ContextMenuLLM = ({
  xPos,
  yPos,
  onCompare,
  deleteHighlight,
}: ContextMenuLLMProps) => {
  return (
    <div className="context-menu" style={{ top: yPos + 2, left: xPos + 2 }}>
      {/* ⬇️ Changed Button Label and Click Handler */}
      {/* <button onClick={onCompare}>Compare with model-based output</button> */}
      <button onClick={deleteHighlight}>Delete</button>
    </div>
  );
};

export default ContextMenuLLM;