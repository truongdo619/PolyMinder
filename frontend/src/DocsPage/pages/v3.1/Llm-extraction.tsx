import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocList,
  DocListItem,
  DocCallout
} from "../../components/DocComponents";

export const toc = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "1-switch-to-llm-mode", title: "1. Switch to LLM Mode", level: 2 },
  { id: "2-run-extraction-on-a-paragraph", title: "2. Run Extraction on a Paragraph", level: 2 },
  { id: "3-review-llm-results-in-the-sidebar", title: "3. Review LLM Results in the Sidebar", level: 2 },
  { id: "4-compare-llm-output-with-model-output", title: "4. Compare LLM Output with Model Output", level: 2 },
  { id: "5-merge-results-into-main-annotation", title: "5. Merge Results into Main Annotation", level: 2 },
  { id: "6-delete-an-llm-entity", title: "6. Delete an LLM Entity", level: 2 },
  { id: "when-to-use-llm-extraction", title: "When to Use LLM Extraction", level: 2 },
];

export const searchContent = `
# LLM Extraction

Use large language models to extract additional entities and relations that the built-in NER/RE models may have missed.

---

## Overview

PolyMinder's built-in NER and RE models produce high-quality predictions out of the box, but they operate on patterns learned from a fixed training set. LLM Extraction lets you run a prompted language model (e.g. GPT-4, Claude) over individual paragraphs to catch entities the statistical models miss, then merge the best results into your final annotation.

---

## 1. Switch to LLM Mode

In the left settings panel, click LLM in the mode list.

 The PDF viewer switches to paragraph-block view: each text segment is highlighted in a uniform teal color.
 The right sidebar shows the LLM panel with instructions and any previously extracted LLM entities.

---

## 2. Run Extraction on a Paragraph

1. Click any paragraph block in the PDF viewer.
   A dialog opens showing the full paragraph text and extraction controls.

2. Choose a Prompt Preset from the drop-down.
   Presets are pre-written instructions optimised for different extraction goals (e.g. entities only, entities + relations, property value pairs).

3. Select a Model from the model list.
   Available models are configured by your administrator in the backend settings.

4. Click Run with LLM.
   The request is sent to the backend, which calls the selected model API.
   Results appear in the dialog as a list of proposed entities.

5. Click Parse LLM Output to convert the raw model response into structured entities.
   Parsed entities appear highlighted in the paragraph preview inside the dialog.

6. Click Save to add the parsed entities to the LLM sidebar.

> Tip: You can run multiple paragraphs sequentially. The LLM sidebar accumulates all results across the session.

---

## 3. Review LLM Results in the Sidebar

After saving, LLM-extracted entities appear in the right sidebar as a list of cards.

Each card shows:
 Entity text   the span extracted from the paragraph
 Entity type   the label assigned by the model
 Paragraph reference   the source paragraph

---

## 4. Compare LLM Output with Model Output

For any LLM entity, you can compare it against what the built-in NER model extracted from the same paragraph.

1. Right-click an entity card in the LLM sidebar.
2. Select Compare with model output.
   A side-by-side comparison dialog opens.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/llmcompare.png"
       alt="LLM vs model comparison dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Side-by-side comparison of LLM and model outputs</em></figcaption>
</figure>

The left panel shows the model-extracted entities; the right panel shows the LLM-extracted entities.
Tick the entities you want to keep from each side, then click Merge Selected.

---

## 5. Merge Results into Main Annotation

After comparing, click Merge (or Merge Selected).
PolyMinder:

1. Adds the selected LLM entities to the main annotation set.
2. Resolves any overlapping spans according to the merge strategy (longest span wins by default).
3. Reloads the result page with the combined entity set.

> Note: Merging is non-destructive   the original model output is preserved. You can always reopen the compare dialog and change your selection.

---

## 6. Delete an LLM Entity

If an LLM entity is incorrect, right-click it and select Delete.
The entity is removed from the LLM sidebar but the main annotation is not affected unless you have already merged it.

---

## When to Use LLM Extraction

| Situation | Recommendation |
|-----------|---------------|
| Document is dense with property value pairs | Run LLM on the Results/Methods sections |
| Model missed a rare polymer name | Run LLM on the abstract or introduction |
| You want high recall, then filter manually | Run LLM on all paragraphs, then use Compare to pick the best |
| Time is short | Run LLM only on paragraphs flagged as low-confidence by the model |
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Llmextraction() {
  return (
    <Box>
      <DocHeader level={1} id="llm-extraction">LLM Extraction</DocHeader>
      <DocText>Use large language models to extract additional entities and relations that the built-in NER/RE models may have missed.</DocText>
      <DocHeader level={2} id="overview">Overview</DocHeader>
      <DocText>PolyMinder's built-in NER and RE models produce high-quality predictions out of the box, but they operate on patterns learned from a fixed training set. LLM Extraction lets you run a prompted language model (e.g. GPT-4, Claude) over individual paragraphs to catch entities the statistical models miss, then merge the best results into your final annotation.</DocText>
      <DocHeader level={2} id="1-switch-to-llm-mode">1. Switch to LLM Mode</DocHeader>
      <DocText>In the left settings panel, click LLM in the mode list.</DocText>
      <DocText>The PDF viewer switches to paragraph-block view: each text segment is highlighted in a uniform teal color.</DocText>
      <DocText>The right sidebar shows the LLM panel with instructions and any previously extracted LLM entities.</DocText>
      <DocHeader level={2} id="2-run-extraction-on-a-paragraph">2. Run Extraction on a Paragraph</DocHeader>
      <DocList>
        <DocListItem>Click any paragraph block in the PDF viewer.</DocListItem>
      </DocList>
      <DocText>A dialog opens showing the full paragraph text and extraction controls.</DocText>
      <DocList>
        <DocListItem>Choose a Prompt Preset from the drop-down.</DocListItem>
      </DocList>
      <DocText>Presets are pre-written instructions optimised for different extraction goals (e.g. entities only, entities + relations, property value pairs).</DocText>
      <DocList>
        <DocListItem>Select a Model from the model list.</DocListItem>
      </DocList>
      <DocText>Available models are configured by your administrator in the backend settings.</DocText>
      <DocList>
        <DocListItem>Click Run with LLM.</DocListItem>
      </DocList>
      <DocText>The request is sent to the backend, which calls the selected model API.</DocText>
      <DocText>Results appear in the dialog as a list of proposed entities.</DocText>
      <DocList>
        <DocListItem>Click Parse LLM Output to convert the raw model response into structured entities.</DocListItem>
      </DocList>
      <DocText>Parsed entities appear highlighted in the paragraph preview inside the dialog.</DocText>
      <DocList>
        <DocListItem>Click Save to add the parsed entities to the LLM sidebar.</DocListItem>
      </DocList>
      <DocCallout type="info">Tip: You can run multiple paragraphs sequentially. The LLM sidebar accumulates all results across the session.</DocCallout>
      <DocHeader level={2} id="3-review-llm-results-in-the-sidebar">3. Review LLM Results in the Sidebar</DocHeader>
      <DocText>After saving, LLM-extracted entities appear in the right sidebar as a list of cards.</DocText>
      <DocText>Each card shows:</DocText>
      <DocText>Entity text   the span extracted from the paragraph</DocText>
      <DocText>Entity type   the label assigned by the model</DocText>
      <DocText>Paragraph reference   the source paragraph</DocText>
      <DocHeader level={2} id="4-compare-llm-output-with-model-output">4. Compare LLM Output with Model Output</DocHeader>
      <DocText>For any LLM entity, you can compare it against what the built-in NER model extracted from the same paragraph.</DocText>
      <DocList>
        <DocListItem>Right-click an entity card in the LLM sidebar.</DocListItem>
        <DocListItem>Select Compare with model output.</DocListItem>
      </DocList>
      <DocText>A side-by-side comparison dialog opens.</DocText>
      <DocText>The left panel shows the model-extracted entities; the right panel shows the LLM-extracted entities.</DocText>
      <DocText>Tick the entities you want to keep from each side, then click Merge Selected.</DocText>
      <DocHeader level={2} id="5-merge-results-into-main-annotation">5. Merge Results into Main Annotation</DocHeader>
      <DocText>After comparing, click Merge (or Merge Selected).</DocText>
      <DocText>PolyMinder:</DocText>
      <DocList>
        <DocListItem>Adds the selected LLM entities to the main annotation set.</DocListItem>
        <DocListItem>Resolves any overlapping spans according to the merge strategy (longest span wins by default).</DocListItem>
        <DocListItem>Reloads the result page with the combined entity set.</DocListItem>
      </DocList>
      <DocCallout type="info">Note: Merging is non-destructive   the original model output is preserved. You can always reopen the compare dialog and change your selection.</DocCallout>
      <DocHeader level={2} id="6-delete-an-llm-entity">6. Delete an LLM Entity</DocHeader>
      <DocText>If an LLM entity is incorrect, right-click it and select Delete.</DocText>
      <DocText>The entity is removed from the LLM sidebar but the main annotation is not affected unless you have already merged it.</DocText>
      <DocHeader level={2} id="when-to-use-llm-extraction">When to Use LLM Extraction</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Situation</th>
            <th style={thStyle}>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Document is dense with property value pairs</td>
            <td style={tdStyle}>Run LLM on the Results/Methods sections</td>
          </tr>
          <tr>
            <td style={tdStyle}>Model missed a rare polymer name</td>
            <td style={tdStyle}>Run LLM on the abstract or introduction</td>
          </tr>
          <tr>
            <td style={tdStyle}>You want high recall, then filter manually</td>
            <td style={tdStyle}>Run LLM on all paragraphs, then use Compare to pick the best</td>
          </tr>
          <tr>
            <td style={tdStyle}>Time is short</td>
            <td style={tdStyle}>Run LLM only on paragraphs flagged as low-confidence by the model</td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
}
