import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocCallout
} from "../../components/DocComponents";
import img_download_button_PNG from "../../photos/download_button.PNG";
import img_download_dialog_png from "../../photos/download_dialog.png";

export const toc = [
  { id: "1-open-the-export-menu", title: "1. Open the Export Menu", level: 2 },
  { id: "2-choose-what-to-export", title: "2. Choose What to Export", level: 2 },
];

export const searchContent = `
<!--                                                             -->
# Exporting Results
PolyMinder can package your annotations in several scopes and formats for offline review or downstream processing.  
<!--                                                             -->

---

## 1. Open the Export Menu

Click Download Result in the top right corner of the result viewer.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/downloadbutton.PNG"
       alt="Download button"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1 - Download button in the toolbar</em></figcaption>
</figure>

---

## 2. Choose What to Export

The dialog lets you decide which annotations to include:

 All Data   every entity, relation, and paragraph (default).  
 Confirmed Only   restricts the export to items you have manually validated.  
 By Entity Type   export a single category (e.g., only Polymer or Property entities).  
 Current Filter   respects any active sidebar or advanced filters, exporting exactly what you see.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/downloaddialog.png"
       alt="Download dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2 - Export scope selection dialog</em></figcaption>
</figure>

> Tip: Hover over each option in the dialog to see a short tooltip describing the resulting file contents.
`;


export default function Downloadfunction() {
  return (
    <Box>
      <DocHeader level={1} id="exporting-results">Exporting Results</DocHeader>
      <DocText>PolyMinder can package your annotations in several scopes and formats for offline review or downstream processing.</DocText>
      <DocHeader level={2} id="1-open-the-export-menu">1. Open the Export Menu</DocHeader>
      <DocText>Click Download Result in the top right corner of the result viewer.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_download_button_PNG} alt="Download button" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1 - Download button in the toolbar</Box>
      </Box>
      <DocHeader level={2} id="2-choose-what-to-export">2. Choose What to Export</DocHeader>
      <DocText>The dialog lets you decide which annotations to include:</DocText>
      <DocText>All Data   every entity, relation, and paragraph (default).</DocText>
      <DocText>Confirmed Only   restricts the export to items you have manually validated.</DocText>
      <DocText>By Entity Type   export a single category (e.g., only Polymer or Property entities).</DocText>
      <DocText>Current Filter   respects any active sidebar or advanced filters, exporting exactly what you see.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_download_dialog_png} alt="Download dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2 - Export scope selection dialog</Box>
      </Box>
      <DocCallout type="info">Tip: Hover over each option in the dialog to see a short tooltip describing the resulting file contents.</DocCallout>
    </Box>
  );
}
