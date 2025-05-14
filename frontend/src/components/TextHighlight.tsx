import React, {
  CSSProperties,
  MouseEvent,
  useState,
} from "react";
import "../style/TextHighlight.css";
import type { ViewportHighlight } from "../types";
import Badge from "@mui/material/Badge";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

/* --------------------------------------------------------------------- */
/*  TOY DATA – remove or replace with real annotations later             */
/* --------------------------------------------------------------------- */
export interface ImplicitEntity {
  mention: string;    // surface form
  resolved: string;   // canonical entity
  type?: string;      // optional label (MATERIAL, ABBR, …)
}

export const TOY_IMPLICIT_ENTITIES: ImplicitEntity[] = [
  {
    mention: "it",
    resolved: "Sulfonated polyarylenethioethersulfone",
    type: "MATERIAL",
  },
  {
    mention: "this polymer",
    resolved: "Sulfonated polyarylenethioethersulfone",
    type: "MATERIAL",
  },
  {
    mention: "SPAES",
    resolved: "Sulfonated polyarylenethioethersulfone",
    type: "ABBR",
  },
  {
    mention: "its membrane",
    resolved: "Sulfonated polyarylenethioethersulfone membrane",
    type: "PART",
  },
];
/* --------------------------------------------------------------------- */

export interface TextHighlightProps {
  highlight: ViewportHighlight & {
    implicitEntities?: ImplicitEntity[];   // optional field
  };
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
  /* dialog state */
  const [infoOpen, setInfoOpen] = useState(false);
  const openInfo = (e: MouseEvent<HTMLOrSVGElement>) => {
    e.stopPropagation();
    setInfoOpen(true);
  };
  const closeInfo = () => setInfoOpen(false);

  /* helpers */
  const highlightClass = isScrolledTo ? "TextHighlight--scrolledTo" : "";
  const { rects } = highlight.position;
  const classnametext = highlight.comment.toUpperCase();
  const para_id = highlight.para_id;

  const isTestHighlight =
    highlight.id === "para7_T5" &&
    highlight.content.text === "Sulfonated polyarylenethioethersulfone";

  /* use real entities if present, else toy demo */
  const implicitEntities =
    highlight.implicitEntities ?? TOY_IMPLICIT_ENTITIES;

  /* view */
  return (
    <div
      className={`TextHighlight ${highlightClass}`}
      onContextMenu={onContextMenu}
    >
      <div className="TextHighlight__parts">
        {rects.map((rect, index) => (
          <div
            key={index}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onClick}
            style={{ ...rect, ...style, position: "absolute" }}
            className={`TextHighlight__part ${classnametext}`}
          >
            {/* paragraph number badge */}
            {classnametext.startsWith("BLOCK") &&
              index === 0 &&
              para_id !== undefined && (
                <Badge
                  badgeContent={para_id + 1}
                  color="primary"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    color: "white",
                  }}
                  showZero
                  max={999}
                />
              )}

            {/* info icon */}
            {isTestHighlight && (
              <InfoOutlinedIcon
                fontSize="small"
                onClick={openInfo}
                sx={{
                  position: "absolute",
                  top: -5,
                  left: -29,
                  cursor: "pointer",
                  backgroundColor: "rgba(1, 105, 202, 0.6)",
                  borderRadius: "50%",
                  padding: "2px",
                  color: "white",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* dialog */}
      <Dialog open={infoOpen} onClose={closeInfo} maxWidth="sm" fullWidth>
        <DialogTitle>
          Implicit Entities – Paragraph{" "}
          {para_id !== undefined ? para_id + 1 : "?"}
        </DialogTitle>

        <DialogContent dividers>
          {implicitEntities.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No implicit entities detected for this paragraph.
            </Typography>
          ) : (
            <List disablePadding>
              {implicitEntities.map(({ mention, resolved, type }, idx) => (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                    <ListItemText
                      primary={
                        <>
                          <Chip
                            label={mention}
                            size="small"
                            sx={{ mr: 1, fontWeight: 600 }}
                          />
                          {type && (
                            <Chip
                              label={type}
                              size="small"
                              color="secondary"
                              sx={{ mr: 1 }}
                            />
                          )}
                        </>
                      }
                      secondary={resolved}
                      secondaryTypographyProps={{ sx: { ml: 0.5 } }}
                    />
                  </ListItem>
                  {idx < implicitEntities.length - 1 && (
                    <Divider component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeInfo} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
