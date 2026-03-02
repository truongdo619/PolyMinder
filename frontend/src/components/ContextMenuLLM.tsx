import React from "react";
import "../style/ContextMenu.css";

export interface ContextMenuLLMProps {
  xPos: any;
  yPos: any;
  onCompare: () => void; // ⬅️ Changed from editComment
  deleteHighlight: () => void;
}

const MENU_W = 180;
const MENU_H = 60;

const ContextMenuLLM = ({
  xPos,
  yPos,
  onCompare,
  deleteHighlight,
}: ContextMenuLLMProps) => {
  const left = Math.min(Number(xPos) + 2, window.innerWidth - MENU_W - 8);
  const top  = Math.min(Number(yPos) + 2, window.innerHeight - MENU_H - 8);
  return (
    <div className="context-menu" style={{ top, left }}>
      {/* ⬇️ Changed Button Label and Click Handler */}
      {/* <button onClick={onCompare}>Compare with model-based output</button> */}
      <button onClick={deleteHighlight}>Delete</button>
    </div>
  );
};

export default ContextMenuLLM;