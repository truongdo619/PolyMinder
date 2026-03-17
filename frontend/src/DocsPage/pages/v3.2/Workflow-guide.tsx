import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocList,
  DocListItem
} from "../../components/DocComponents";

export const toc = [
  { id: "1-the-progress-stepper", title: "1. The Progress Stepper", level: 2 },
  { id: "2-optional-steps", title: "2. Optional Steps", level: 2 },
  { id: "3-clicking-a-step", title: "3. Clicking a Step", level: 2 },
  { id: "4-collapse-and-expand", title: "4. Collapse and Expand", level: 2 },
  { id: "5-contextual-guidance-banners", title: "5. Contextual Guidance Banners", level: 2 },
  { id: "6-enable-or-disable-guidance", title: "6. Enable or Disable Guidance", level: 2 },
  { id: "7-reset-guidance", title: "7. Reset Guidance", level: 2 },
  { id: "tips", title: "Tips", level: 2 },
];

export const searchContent = `
# Workflow Guide

PolyMinder includes a built-in Workflow Guide that tracks your annotation progress and surfaces contextual tips at each stage   so you always know what to do next.

---

## 1. The Progress Stepper

When you open a document, a compact progress bar appears at the top of the PDF viewer area. It shows five workflow steps:

| Step | Completes when |
|------|---------------|
| Upload PDF | A document is open in the viewer |
| Review Entities | The document has at least one extracted entity |
| Check Relations | You visit Relations mode |
| Run LLM Extraction (optional) | You visit LLM mode or LLM output exists |
| Export Results | You successfully download the annotated PDF or JSON |

A green check mark appears on each step as you complete it. The counter in the header (e.g. (2/4)) shows required steps completed   the LLM step is optional and does not count towards the total.

---

## 2. Optional Steps

The Run LLM Extraction step is marked (optional) and displayed with a lighter blue icon. You can export your work at any time without running LLM extraction. The stepper skips this step when calculating which step is "next".

---

## 3. Clicking a Step

Each step is clickable. Clicking a step navigates you directly to the relevant mode:

 Review Entities   switches to Entities mode
 Check Relations   switches to Relations mode
 Run LLM Extraction   switches to LLM mode
 Export Results   use "Download Result" in the settings panel

---

## 4. Collapse and Expand

Click anywhere on the stepper header bar to collapse or expand it.

When collapsed, the header shows a one-line summary:
   Next: Check Relations   the next required step
   All steps complete!   when all required steps are done

---

## 5. Contextual Guidance Banners

In addition to the stepper, PolyMinder shows contextual guidance banners inside sidebars. These are small dismissible alerts that appear when:

 You enter a mode for the first time (e.g., "Events Mode   events group related entities ")
 An empty state needs explanation (e.g., "No Relations Found   try re-running the RE model")
 An obvious next action exists (e.g., "Entities look good? Switch to Relations mode")

Dismiss a banner by clicking  . It will not appear again for that browser session.

---

## 6. Enable or Disable Guidance

To turn off all guidance banners and the stepper:

1. Open the Settings panel (left sidebar).
2. Scroll to the bottom.
3. Uncheck Show guidance tips.

This setting is saved in your browser and persists across sessions. Re-check the box to restore guidance.

---

## 7. Reset Guidance

Guidance banners remember which ones you have dismissed. Opening a new document automatically resets which workflow steps have been completed   dismissed banners are preserved.

To reset all dismissed banners manually, clear your browser's local storage for the PolyMinder site (browser developer tools   Application   Local Storage   delete polyminderguidancestate).

---

## Tips

 The stepper resets on every new document   your progress on one document does not affect another.
 Guidance banners are per-mode: switching modes shows the banner relevant to that mode.
 The stepper does not block any action   you can export at any time regardless of which steps are ticked.
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Workflowguide() {
  return (
    <Box>
      <DocHeader level={1} id="workflow-guide">Workflow Guide</DocHeader>
      <DocText>PolyMinder includes a built-in Workflow Guide that tracks your annotation progress and surfaces contextual tips at each stage   so you always know what to do next.</DocText>
      <DocHeader level={2} id="1-the-progress-stepper">1. The Progress Stepper</DocHeader>
      <DocText>When you open a document, a compact progress bar appears at the top of the PDF viewer area. It shows five workflow steps:</DocText>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Step</th>
            <th style={thStyle}>Completes when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Upload PDF</td>
            <td style={tdStyle}>A document is open in the viewer</td>
          </tr>
          <tr>
            <td style={tdStyle}>Review Entities</td>
            <td style={tdStyle}>The document has at least one extracted entity</td>
          </tr>
          <tr>
            <td style={tdStyle}>Check Relations</td>
            <td style={tdStyle}>You visit Relations mode</td>
          </tr>
          <tr>
            <td style={tdStyle}>Run LLM Extraction (optional)</td>
            <td style={tdStyle}>You visit LLM mode or LLM output exists</td>
          </tr>
          <tr>
            <td style={tdStyle}>Export Results</td>
            <td style={tdStyle}>You successfully download the annotated PDF or JSON</td>
          </tr>
        </tbody>
      </table>
      <DocText>A green check mark appears on each step as you complete it. The counter in the header (e.g. (2/4)) shows required steps completed   the LLM step is optional and does not count towards the total.</DocText>
      <DocHeader level={2} id="2-optional-steps">2. Optional Steps</DocHeader>
      <DocText>The Run LLM Extraction step is marked (optional) and displayed with a lighter blue icon. You can export your work at any time without running LLM extraction. The stepper skips this step when calculating which step is "next".</DocText>
      <DocHeader level={2} id="3-clicking-a-step">3. Clicking a Step</DocHeader>
      <DocText>Each step is clickable. Clicking a step navigates you directly to the relevant mode:</DocText>
      <DocText>Review Entities   switches to Entities mode</DocText>
      <DocText>Check Relations   switches to Relations mode</DocText>
      <DocText>Run LLM Extraction   switches to LLM mode</DocText>
      <DocText>Export Results   use "Download Result" in the settings panel</DocText>
      <DocHeader level={2} id="4-collapse-and-expand">4. Collapse and Expand</DocHeader>
      <DocText>Click anywhere on the stepper header bar to collapse or expand it.</DocText>
      <DocText>When collapsed, the header shows a one-line summary:</DocText>
      <DocText>Next: Check Relations   the next required step</DocText>
      <DocText>All steps complete!   when all required steps are done</DocText>
      <DocHeader level={2} id="5-contextual-guidance-banners">5. Contextual Guidance Banners</DocHeader>
      <DocText>In addition to the stepper, PolyMinder shows contextual guidance banners inside sidebars. These are small dismissible alerts that appear when:</DocText>
      <DocText>You enter a mode for the first time (e.g., "Events Mode   events group related entities ")</DocText>
      <DocText>An empty state needs explanation (e.g., "No Relations Found   try re-running the RE model")</DocText>
      <DocText>An obvious next action exists (e.g., "Entities look good? Switch to Relations mode")</DocText>
      <DocText>Dismiss a banner by clicking  . It will not appear again for that browser session.</DocText>
      <DocHeader level={2} id="6-enable-or-disable-guidance">6. Enable or Disable Guidance</DocHeader>
      <DocText>To turn off all guidance banners and the stepper:</DocText>
      <DocList>
        <DocListItem>Open the Settings panel (left sidebar).</DocListItem>
        <DocListItem>Scroll to the bottom.</DocListItem>
        <DocListItem>Uncheck Show guidance tips.</DocListItem>
      </DocList>
      <DocText>This setting is saved in your browser and persists across sessions. Re-check the box to restore guidance.</DocText>
      <DocHeader level={2} id="7-reset-guidance">7. Reset Guidance</DocHeader>
      <DocText>Guidance banners remember which ones you have dismissed. Opening a new document automatically resets which workflow steps have been completed   dismissed banners are preserved.</DocText>
      <DocText>To reset all dismissed banners manually, clear your browser's local storage for the PolyMinder site (browser developer tools   Application   Local Storage   delete polyminderguidancestate).</DocText>
      <DocHeader level={2} id="tips">Tips</DocHeader>
      <DocText>The stepper resets on every new document   your progress on one document does not affect another.</DocText>
      <DocText>Guidance banners are per-mode: switching modes shows the banner relevant to that mode.</DocText>
      <DocText>The stepper does not block any action   you can export at any time regardless of which steps are ticked.</DocText>
    </Box>
  );
}
