import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink,
  DocList,
  DocListItem,
  DocInlineCode,
  DocCodeBlock,
  DocCallout
} from "../../components/DocComponents";
import img_v3_1_save_checkpoint_dialog_jpeg from "../../photos/v3.1/save_checkpoint_dialog.jpeg";

export const toc = [
  { id: "why-save-a-checkpoint", title: "Why Save a Checkpoint?", level: 2 },
  { id: "how-to-save", title: "How to Save", level: 2 },
  { id: "restoring-a-checkpoint", title: "Restoring a Checkpoint", level: 2 },
];

export const searchContent = `
# Save Checkpoint

Create a snapshot of the entire annotation state so you can restore or branch your work at any time.

---

## Why Save a Checkpoint?  

 Safety net   roll back if a bulk edit goes wrong.  
 Milestones   mark key stages for collaborative review.  
 Versioning   maintain a history of how annotations evolve.

---

## How to Save

1. Click Save Checkpoint in the settings bar.  

2. Enter an checkpoint name (e.g.,  Finished pages 1 3 ) and press Save.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/savecheckpointdialog.jpeg"
       alt="Sign Up dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Checkpoint dialog</em></figcaption>
</figure>

3. A toast confirms success; the new entry appears under History   Checkpoints.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/savecheckpointdialog.jpeg"
       alt="Sign Up dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2   Checkpoint history</em></figcaption>
</figure>

---

## Restoring a Checkpoint  

Open History at the bottom right of the page, click the desired snapshot, and Confirm. PolyMinder reloads the document at that exact state without deleting later work it simply branches the history.

> Restored checkpoints can be edited and saved again, giving you flexible version control.
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Savecheckpoint() {
  return (
    <Box>
      <DocHeader level={1} id="save-checkpoint">Save Checkpoint</DocHeader>
      <DocText>Create a snapshot of the entire annotation state so you can restore or branch your work at any time.</DocText>
      <DocHeader level={2} id="why-save-a-checkpoint">Why Save a Checkpoint?</DocHeader>
      <DocText>Safety net   roll back if a bulk edit goes wrong.</DocText>
      <DocText>Milestones   mark key stages for collaborative review.</DocText>
      <DocText>Versioning   maintain a history of how annotations evolve.</DocText>
      <DocHeader level={2} id="how-to-save">How to Save</DocHeader>
      <DocList>
        <DocListItem>Click Save Checkpoint in the settings bar.</DocListItem>
      </DocList>
      <DocList>
        <DocListItem>Enter an checkpoint name (e.g.,  Finished pages 1 3 ) and press Save.</DocListItem>
      </DocList>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_save_checkpoint_dialog_jpeg} alt="Sign Up dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Checkpoint dialog</Box>
      </Box>
      <DocList>
        <DocListItem>A toast confirms success; the new entry appears under History   Checkpoints.</DocListItem>
      </DocList>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_save_checkpoint_dialog_jpeg} alt="Sign Up dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Checkpoint history</Box>
      </Box>
      <DocHeader level={2} id="restoring-a-checkpoint">Restoring a Checkpoint</DocHeader>
      <DocText>Open History at the bottom right of the page, click the desired snapshot, and Confirm. PolyMinder reloads the document at that exact state without deleting later work it simply branches the history.</DocText>
      <DocCallout type="info">Restored checkpoints can be edited and saved again, giving you flexible version control.</DocCallout>
    </Box>
  );
}
