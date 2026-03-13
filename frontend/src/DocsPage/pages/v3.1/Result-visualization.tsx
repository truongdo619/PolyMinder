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
import img_v3_1_visualization_drawio_png from "../../photos/v3.1/visualization.drawio.png";
import img_v3_1_brat_styled_png from "../../photos/v3.1/brat_styled.png";
import img_v3_1_graph_visualization_png from "../../photos/v3.1/graph_visualization.png";
import img_v3_1_entity_mode_jpeg from "../../photos/v3.1/entity_mode.jpeg";
import img_v3_1_relation_mode_jpeg from "../../photos/v3.1/relation_mode.jpeg";
import img_v3_1_paragraph_mode_jpeg from "../../photos/v3.1/paragraph_mode.jpeg";

export const toc = [
  { id: "1-result-page-layout", title: "1. Result Page Layout", level: 2 },
  { id: "11-entity-highlighted-pdf", title: "1.1 Entity-Highlighted PDF", level: 3 },
  { id: "12-sidebar", title: "1.2 Sidebar", level: 3 },
  { id: "13-settings-bar", title: "1.3 Settings Bar", level: 3 },
  { id: "2-advanced-visualization", title: "2. Advanced Visualization", level: 2 },
  { id: "21-brat-styled-view", title: "2.1 BRAT-Styled View", level: 3 },
  { id: "22-graph-view", title: "2.2 Graph View", level: 3 },
  { id: "3-working-modes", title: "3. Working Modes", level: 2 },
  { id: "entities", title: "Entities", level: 3 },
  { id: "relations", title: "Relations", level: 3 },
  { id: "events", title: "Events", level: 3 },
  { id: "tables", title: "Tables", level: 3 },
  { id: "paragraphs", title: "Paragraphs", level: 3 },
  { id: "llm", title: "LLM", level: 3 },
];

export const searchContent = `
# Result Visualization

After PolyMinder finishes processing a PDF, click on the title of a processed document and the Result Page will appear. This view combines an entity-highlighted PDF, an interactive sidebar, and a settings panel so you can explore, filter, and export your annotations with ease.

---

## 1. Result Page Layout

| Area | Purpose |
|------|---------|
| Entity-Highlighted PDF | Shows the original pages with every entity type color-coded. Hovering reveals a tooltip; clicking opens detail views. |
| Sidebar | Lists entities, relations, paragraphs, events, and tables depending on the active mode. Selecting an item scrolls the PDF to its location. |
| Settings Bar | Global actions: save a checkpoint, download results, switch between modes, and apply filters. |
| Workflow Guide | A collapsible 5-step stepper at the top showing your annotation progress. |

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/visualization.drawio.png"
       alt="Result Page Layout"
       style="width:100%;border-radius:6px;" />
  <figcaption><em>Figure 1   Result Page Layout</em></figcaption>
</figure>

### 1.1 Entity-Highlighted PDF

 Each entity category (e.g., POLYMER, PROPVALUE) is rendered in a unique color.
 Clicking a highlight synchronises the sidebar and opens advanced visualisations (see below).

### 1.2 Sidebar

Content changes depending on the active mode (see Section 3 below).

### 1.3 Settings Bar

 Save Checkpoint   store the current annotation state as a named snapshot.
 Summarize Result   generate an interactive graph of all entities and relations.
 Download Result   export annotations as a highlighted PDF or JSON file.
 Mode Switcher   toggles between the six working modes (see Section 3).
 Filter Icon   launch advanced filtering by entity type, page range, or confirmation status.

---

## 2. Advanced Visualization

PolyMinder offers two deeper inspection tools for analysing complex relationships.

### 2.1 BRAT-Styled View

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/bratstyled.png"
       alt="BRAT-styled popup"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2   BRAT-styled popup</em></figcaption>
</figure>

 Click any highlight in the PDF or any entity card in the sidebar to open the Brat Visualization dialog.
 A popup appears with a BRAT-style diagram of the selected entity and its immediate relations.
 Press Show All Entities to render the entire paragraph in BRAT format for full-context review.

### 2.2 Graph View

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/graphvisualization.png"
       alt="Graph Visualization"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 3   Graph Visualization</em></figcaption>
</figure>

 Accessible via the Summarize Result button in the settings bar.
 Displays a network graph of all extracted entities and relations.
 Nodes = entities, edges = relations.
 Both direct and indirect connections are shown, helping you trace multi-step relationships at a glance.

---

## 3. Working Modes

Use the Mode Switcher in the settings bar to tailor the sidebar to your current task. There are six modes:

### Entities

The default view. Lists every extracted entity with its type, text, and page location. Click an entity to scroll to it in the PDF. Right-click for edit and delete options. Entities are color-coded by type.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/entitymode.jpeg"
       alt="Entity Mode"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 4   Entity Mode</em></figcaption>
</figure>

### Relations

Displays only entities that participate in at least one extracted relationship. Use this mode to verify that polymers, properties, and values are correctly linked with relation types such as hasproperty or hasvalue.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/relationmode.jpeg"
       alt="Relation Mode"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 5   Relation Mode</em></figcaption>
</figure>

### Events

Groups entities into structured events   actions such as synthesis steps or characterization procedures. Each event shows a trigger word and the entities that act as arguments. See [Events Mode](../features/events) for full details.

### Tables

Lists all tables detected in the PDF. Click a table entry to open the inline editor for correcting OCR errors, editing captions, or running LLM to generate natural-language descriptions. See [Tables Mode](../features/tables) for full details.

### Paragraphs

Organises the document into raw text segments. Use this mode to correct misread paragraph text or to drag-and-drop paragraphs into the correct reading order.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/paragraphmode.jpeg"
       alt="Paragraph Mode"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 6   Paragraph Mode</em></figcaption>
</figure>

### LLM

Switches the PDF to paragraph-block view. Click any block to open the LLM extraction dialog, choose a prompt preset and model, then run extraction. Results can be compared with the built-in model output and merged. See [LLM Extraction](../features/llmextraction) for full details.

> Tip: The filter icon works in sync with the selected mode, enabling precise control over what appears in both the PDF and the sidebar.
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Resultvisualization() {
  return (
    <Box>
      <DocHeader level={1} id="result-visualization">Result Visualization</DocHeader>
      <DocText>After PolyMinder finishes processing a PDF, click on the title of a processed document and the Result Page will appear. This view combines an entity-highlighted PDF, an interactive sidebar, and a settings panel so you can explore, filter, and export your annotations with ease.</DocText>
      <DocHeader level={2} id="1-result-page-layout">1. Result Page Layout</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Area</th>
            <th style={thStyle}>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Entity-Highlighted PDF</td>
            <td style={tdStyle}>Shows the original pages with every entity type color-coded. Hovering reveals a tooltip; clicking opens detail views.</td>
          </tr>
          <tr>
            <td style={tdStyle}>Sidebar</td>
            <td style={tdStyle}>Lists entities, relations, paragraphs, events, and tables depending on the active mode. Selecting an item scrolls the PDF to its location.</td>
          </tr>
          <tr>
            <td style={tdStyle}>Settings Bar</td>
            <td style={tdStyle}>Global actions: save a checkpoint, download results, switch between modes, and apply filters.</td>
          </tr>
          <tr>
            <td style={tdStyle}>Workflow Guide</td>
            <td style={tdStyle}>A collapsible 5-step stepper at the top showing your annotation progress.</td>
          </tr>
        </tbody>
      </table>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_visualization_drawio_png} alt="Result Page Layout" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Result Page Layout</Box>
      </Box>
      <DocHeader level={3} id="11-entity-highlighted-pdf">1.1 Entity-Highlighted PDF</DocHeader>
      <DocText>Each entity category (e.g., POLYMER, PROPVALUE) is rendered in a unique color.</DocText>
      <DocText>Clicking a highlight synchronises the sidebar and opens advanced visualisations (see below).</DocText>
      <DocHeader level={3} id="12-sidebar">1.2 Sidebar</DocHeader>
      <DocText>Content changes depending on the active mode (see Section 3 below).</DocText>
      <DocHeader level={3} id="13-settings-bar">1.3 Settings Bar</DocHeader>
      <DocText>Save Checkpoint   store the current annotation state as a named snapshot.</DocText>
      <DocText>Summarize Result   generate an interactive graph of all entities and relations.</DocText>
      <DocText>Download Result   export annotations as a highlighted PDF or JSON file.</DocText>
      <DocText>Mode Switcher   toggles between the six working modes (see Section 3).</DocText>
      <DocText>Filter Icon   launch advanced filtering by entity type, page range, or confirmation status.</DocText>
      <DocHeader level={2} id="2-advanced-visualization">2. Advanced Visualization</DocHeader>
      <DocText>PolyMinder offers two deeper inspection tools for analysing complex relationships.</DocText>
      <DocHeader level={3} id="21-brat-styled-view">2.1 BRAT-Styled View</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_brat_styled_png} alt="BRAT-styled popup" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   BRAT-styled popup</Box>
      </Box>
      <DocText>Click any highlight in the PDF or any entity card in the sidebar to open the Brat Visualization dialog.</DocText>
      <DocText>A popup appears with a BRAT-style diagram of the selected entity and its immediate relations.</DocText>
      <DocText>Press Show All Entities to render the entire paragraph in BRAT format for full-context review.</DocText>
      <DocHeader level={3} id="22-graph-view">2.2 Graph View</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_graph_visualization_png} alt="Graph Visualization" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 3   Graph Visualization</Box>
      </Box>
      <DocText>Accessible via the Summarize Result button in the settings bar.</DocText>
      <DocText>Displays a network graph of all extracted entities and relations.</DocText>
      <DocText>Nodes = entities, edges = relations.</DocText>
      <DocText>Both direct and indirect connections are shown, helping you trace multi-step relationships at a glance.</DocText>
      <DocHeader level={2} id="3-working-modes">3. Working Modes</DocHeader>
      <DocText>Use the Mode Switcher in the settings bar to tailor the sidebar to your current task. There are six modes:</DocText>
      <DocHeader level={3} id="entities">Entities</DocHeader>
      <DocText>The default view. Lists every extracted entity with its type, text, and page location. Click an entity to scroll to it in the PDF. Right-click for edit and delete options. Entities are color-coded by type.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_entity_mode_jpeg} alt="Entity Mode" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 4   Entity Mode</Box>
      </Box>
      <DocHeader level={3} id="relations">Relations</DocHeader>
      <DocText>Displays only entities that participate in at least one extracted relationship. Use this mode to verify that polymers, properties, and values are correctly linked with relation types such as hasproperty or hasvalue.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_relation_mode_jpeg} alt="Relation Mode" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 5   Relation Mode</Box>
      </Box>
      <DocHeader level={3} id="events">Events</DocHeader>
      <DocText>Groups entities into structured events   actions such as synthesis steps or characterization procedures. Each event shows a trigger word and the entities that act as arguments. See <DocLink href="../features/events">Events Mode</DocLink> for full details.</DocText>
      <DocHeader level={3} id="tables">Tables</DocHeader>
      <DocText>Lists all tables detected in the PDF. Click a table entry to open the inline editor for correcting OCR errors, editing captions, or running LLM to generate natural-language descriptions. See <DocLink href="../features/tables">Tables Mode</DocLink> for full details.</DocText>
      <DocHeader level={3} id="paragraphs">Paragraphs</DocHeader>
      <DocText>Organises the document into raw text segments. Use this mode to correct misread paragraph text or to drag-and-drop paragraphs into the correct reading order.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_paragraph_mode_jpeg} alt="Paragraph Mode" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 6   Paragraph Mode</Box>
      </Box>
      <DocHeader level={3} id="llm">LLM</DocHeader>
      <DocText>Switches the PDF to paragraph-block view. Click any block to open the LLM extraction dialog, choose a prompt preset and model, then run extraction. Results can be compared with the built-in model output and merged. See <DocLink href="../features/llmextraction">LLM Extraction</DocLink> for full details.</DocText>
      <DocCallout type="info">Tip: The filter icon works in sync with the selected mode, enabling precise control over what appears in both the PDF and the sidebar.</DocCallout>
    </Box>
  );
}
