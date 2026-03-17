import React, { useEffect, useRef } from "react";
import "../style/ContextMenu.css";

export interface ContextMenuLLMProps {
  xPos: any;
  yPos: any;
  onCompare: () => void;
  deleteHighlight: () => void;
  onClose?: () => void;
}

const MENU_W = 180;
const MENU_H = 60;

const ContextMenuLLM = ({
  xPos,
  yPos,
  onCompare,
  deleteHighlight,
  onClose,
}: ContextMenuLLMProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const left = Math.min(Number(xPos) + 2, window.innerWidth - MENU_W - 8);
  const top  = Math.min(Number(yPos) + 2, window.innerHeight - MENU_H - 8);
  return (
    <div className="context-menu" style={{ top, left }} ref={menuRef}>
      <button className="context-menu-delete" onClick={deleteHighlight}>Delete</button>
    </div>
  );
};

export default ContextMenuLLM;
