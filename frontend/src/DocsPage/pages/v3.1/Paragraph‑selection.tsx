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
import img_v3_1_adjust_selection_dialog_jpeg from "../../photos/v3.1/adjust_selection_dialog.jpeg";

export const toc = [
  { id: "1-open-the-selection-dialog", title: "1. Open the Selection Dialog", level: 2 },
  { id: "2-pick-your-targets", title: "2. Pick Your Targets", level: 2 },
  { id: "3-apply-load", title: "3. Apply & Load", level: 2 },
  { id: "4-changing-your-mind", title: "4. Changing Your Mind", level: 2 },
  { id: "5-why-use-paragraph-selection", title: "5. Why Use Paragraph Selection?", level: 2 },
];

export const searchContent = `
# Selecting Paragraphs to Annotate

Sometimes you only need to work on a subset of a long document intro, methods, or results, for example.  
The Paragraph Selection tool lets you choose exactly which text blocks will appear in the annotation workflow, hiding everything else until you are ready.

---

## 1. Open the Selection Dialog  

1. Click adjust your selection button in the top of sidebar.

2. A dialog lists every paragraph detected in the PDF, ordered by page and line number.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/adjustselectiondialog.jpeg"
       alt="Sign Up dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Paragraph selection dialog</em></figcaption>
</figure>


---

## 2. Pick Your Targets  

1. Tick the checkboxes for the paragraphs you intend to annotate.  
2. Use Select All / Clear All for quick bulk actions.  
3. Click Save & Reload button to confirm.

> Tip: You can sort the list by page number or search for keywords to locate relevant sections faster.

---

## 3. Apply & Load  

Press Apply Selection.  
PolyMinder reloads the result page with:

 Only the selected paragraphs visible in the PDF viewer.  
 The sidebar filtered to entities and relations inside those paragraphs.  
 Non selected paragraphs stored safely in the background (no data lost).

You can return to the dialog at any time to add or remove paragraphs.

---

## 4. Changing Your Mind  

Need to annotate another section later?  
Open adjust your selection again, adjust the checkboxes, and click Apply Selection.  
The viewer updates instantly no need to re process the document.

---

## 5. Why Use Paragraph Selection?  

 Focus   reduce visual clutter and cognitive load.  
 Efficiency   skip irrelevant sections to save review time.  
 Collaboration   divide a large document among multiple annotators (e.g., Alice handles Intro, Bob handles Results).  

Paragraph selection is non destructive; unselected text remains intact and can be brought back whenever required.
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Paragraphselection() {
  return (
    <Box>
      <DocHeader level={1} id="selecting-paragraphs-to-annotate">Selecting Paragraphs to Annotate</DocHeader>
      <DocText>Sometimes you only need to work on a subset of a long document intro, methods, or results, for example.</DocText>
      <DocText>The Paragraph Selection tool lets you choose exactly which text blocks will appear in the annotation workflow, hiding everything else until you are ready.</DocText>
      <DocHeader level={2} id="1-open-the-selection-dialog">1. Open the Selection Dialog</DocHeader>
      <DocList>
        <DocListItem>Click adjust your selection button in the top of sidebar.</DocListItem>
      </DocList>
      <DocList>
        <DocListItem>A dialog lists every paragraph detected in the PDF, ordered by page and line number.</DocListItem>
      </DocList>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_adjust_selection_dialog_jpeg} alt="Sign Up dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Paragraph selection dialog</Box>
      </Box>
      <DocHeader level={2} id="2-pick-your-targets">2. Pick Your Targets</DocHeader>
      <DocList>
        <DocListItem>Tick the checkboxes for the paragraphs you intend to annotate.</DocListItem>
        <DocListItem>Use Select All / Clear All for quick bulk actions.</DocListItem>
        <DocListItem>Click Save &amp; Reload button to confirm.</DocListItem>
      </DocList>
      <DocCallout type="info">Tip: You can sort the list by page number or search for keywords to locate relevant sections faster.</DocCallout>
      <DocHeader level={2} id="3-apply-load">3. Apply &amp; Load</DocHeader>
      <DocText>Press Apply Selection.</DocText>
      <DocText>PolyMinder reloads the result page with:</DocText>
      <DocText>Only the selected paragraphs visible in the PDF viewer.</DocText>
      <DocText>The sidebar filtered to entities and relations inside those paragraphs.</DocText>
      <DocText>Non selected paragraphs stored safely in the background (no data lost).</DocText>
      <DocText>You can return to the dialog at any time to add or remove paragraphs.</DocText>
      <DocHeader level={2} id="4-changing-your-mind">4. Changing Your Mind</DocHeader>
      <DocText>Need to annotate another section later?</DocText>
      <DocText>Open adjust your selection again, adjust the checkboxes, and click Apply Selection.</DocText>
      <DocText>The viewer updates instantly no need to re process the document.</DocText>
      <DocHeader level={2} id="5-why-use-paragraph-selection">5. Why Use Paragraph Selection?</DocHeader>
      <DocText>Focus   reduce visual clutter and cognitive load.</DocText>
      <DocText>Efficiency   skip irrelevant sections to save review time.</DocText>
      <DocText>Collaboration   divide a large document among multiple annotators (e.g., Alice handles Intro, Bob handles Results).</DocText>
      <DocText>Paragraph selection is non destructive; unselected text remains intact and can be brought back whenever required.</DocText>
    </Box>
  );
}
