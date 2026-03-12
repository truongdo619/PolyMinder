import React from "react";
import "../style/ContextMenu.css";

export interface ContextMenuProps {
  xPos: any;
  yPos: any;
  editComment: () => void;
  deleteHighlight: () => void;
}

const MENU_W = 180;
const MENU_H = 90;

const ContextMenu = ({
  xPos,
  yPos,
  editComment,
  deleteHighlight,
}: ContextMenuProps) => {
  const left = Math.min(Number(xPos) + 2, window.innerWidth - MENU_W - 8);
  const top  = Math.min(Number(yPos) + 2, window.innerHeight - MENU_H - 8);
  return (
    <div className="context-menu" style={{ top, left }}>
      <button onClick={editComment}>Edit Comment</button>
      <button onClick={deleteHighlight}>Delete</button>
    </div>
  );
};

export default ContextMenu;
