import React, { CSSProperties, MouseEvent } from "react";
import "../style/TextHighlight.css";
import type { ViewportHighlight } from "../types";
import Badge from "@mui/material/Badge";

export interface TextHighlightProps {
  highlight: ViewportHighlight;
  onClick?(event: MouseEvent<HTMLDivElement>): void;
  onMouseOver?(event: MouseEvent<HTMLDivElement>): void;
  onMouseOut?(event: MouseEvent<HTMLDivElement>): void;
  isScrolledTo: boolean;
  onContextMenu?(event: MouseEvent<HTMLDivElement>): void;
  style?: CSSProperties;
}

export const TextHighlight = ({
  highlight,
  onClick,
  onMouseOver,
  onMouseOut,
  isScrolledTo,
  onContextMenu,
  style,
}: TextHighlightProps) => {
  const highlightClass = isScrolledTo ? "TextHighlight--scrolledTo" : "";
  const { rects } = highlight.position;
  const classnametext = highlight.comment.toUpperCase();
  const para_id = highlight.para_id;
  // console.log("highlight: ", highlight);
  return (
    <div className={`TextHighlight ${highlightClass}`} onContextMenu={onContextMenu}>
      <div className="TextHighlight__parts">
        {rects.map((rect, index) => (
          <div
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onClick}
            key={index}
            style={{ ...rect, ...style, position: 'absolute' }}
            className={`TextHighlight__part ${classnametext}`}
          >
            {/* {classnametext.startsWith("BLOCK") && classnametext != "BLOCK_DISCARDED" && index === 0 && para_id !== undefined && ( */}
            {classnametext.startsWith("BLOCK") && index === 0 && para_id !== undefined && (
              <Badge 
                badgeContent={para_id + 1} 
                color="primary"
                sx={{ position: "absolute", top: 0, left: 0, color: "white" }}
                showZero
                max={999}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
