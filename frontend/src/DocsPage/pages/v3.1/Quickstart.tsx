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
import img_v3_1_signin_page_png from "../../photos/v3.1/signin_page.png";
import img_v3_1_document_page_png from "../../photos/v3.1/document_page.png";
import img_Result_PNG from "../../photos/Result.PNG";

export const toc = [
  { id: "1-sign-in", title: "1. Sign In", level: 2 },
  { id: "2-upload-a-pdf", title: "2. Upload a PDF", level: 2 },
  { id: "3-open-the-result-page", title: "3. Open the Result Page", level: 2 },
  { id: "4-follow-the-workflow-guide", title: "4. Follow the Workflow Guide", level: 2 },
  { id: "5-review-and-edit-annotations", title: "5. Review and Edit Annotations", level: 2 },
  { id: "6-export-your-work", title: "6. Export Your Work", level: 2 },
  { id: "whats-next", title: "What's next?", level: 2 },
];

export const searchContent = `
# Quick-Start Guide

Get up and running with PolyMinder in minutes.

---

## 1. Sign In

To access PolyMinder, sign in with a valid account. Visit the [Sign-in](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/signin) page, enter your username and password, and press Sign In. If you do not have an account yet, click [Sign Up](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/signup), complete the registration form, and then return to sign in.

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/signinpage.png" alt="PolyMinder sign-in screen" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 1   Sign-in interface</em></figcaption>
</figure>

---

## 2. Upload a PDF

1. Click Documents in the top navigation bar.
2. Click Upload PDF and select one or more scientific PDF files.
3. PolyMinder queues the files for processing. The NER and RE models run automatically   this typically takes 30 120 seconds per document depending on length.
4. Once processing is complete, the document status changes to Done.

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/documentpage.png" alt="Document management page" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 2   Document management console</em></figcaption>
</figure>

---

## 3. Open the Result Page

Click any completed document name to open it in the interactive viewer. The page shows:

 The PDF with entities highlighted in color.
 A sidebar listing extracted entities.
 A settings panel for switching modes and downloading results.
 A Workflow Guide stepper at the top that tracks your progress through the annotation workflow.

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Result.PNG" alt="Result viewer" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 3   Interactive result viewer</em></figcaption>
</figure>

---

## 4. Follow the Workflow Guide

The Workflow Guide stepper at the top of the viewer tracks five steps:

| Step | What to do |
|------|-----------|
| Upload PDF | Already done   the step ticks automatically |
| Review Entities | Check the entity list in the sidebar. Edit incorrect entities; click the   star to confirm correct ones |
| Check Relations | Switch to Relations mode to verify how entities are linked |
| Run LLM Extraction (optional) | Switch to LLM mode and click any paragraph block to run a language model for extra entities |
| Export Results | Click Download Result to save the annotated PDF or JSON |

Click any step in the stepper to jump directly to that part of the workflow. See [Workflow Guide](../features/workflowguide) for details.

---

## 5. Review and Edit Annotations

 Edit an entity   right-click a highlight in the PDF or click the pencil icon in the sidebar.
 Delete an entity   use the delete option in the edit dialog.
 Add an entity   select text in the PDF and click Add Highlight.
 Edit a relation   switch to Relations mode and click the relation label in the entity editor.

All changes are saved immediately. See [Editing Annotations](../features/editing) for a full reference.

---

## 6. Export Your Work

When your annotations are ready:

1. Click Download Result in the settings bar.
2. Choose the export format:
    Highlighted PDF   the original PDF with colored annotation overlays.
    JSON   structured data with all entities, relations, and metadata.
3. Choose whether to export All Data or Confirmed Only.

See [Export Results](../features/download) for all export options.

---

## What's next?

| Goal | Go to |
|------|-------|
| Learn all six working modes | [Result Visualization](../features/resultvisualization) |
| Use LLM to find extra entities | [LLM Extraction](../features/llmextraction) |
| Understand table extraction | [Tables Mode](../features/tables) |
| Understand event annotations | [Events Mode](../features/events) |
| Save annotation snapshots | [Save Checkpoints](../features/savecheckpoints) |
| Filter entities by type or page | [Filtering Results](../features/filtering) |
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Quickstart() {
  return (
    <Box>
      <DocHeader level={1} id="quick-start-guide">Quick-Start Guide</DocHeader>
      <DocText>Get up and running with PolyMinder in minutes.</DocText>
      <DocHeader level={2} id="1-sign-in">1. Sign In</DocHeader>
      <DocText>To access PolyMinder, sign in with a valid account. Visit the <DocLink href="https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/signin">Sign-in</DocLink> page, enter your username and password, and press Sign In. If you do not have an account yet, click <DocLink href="https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/signup">Sign Up</DocLink>, complete the registration form, and then return to sign in.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_signin_page_png} alt="PolyMinder sign-in screen" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Sign-in interface</Box>
      </Box>
      <DocHeader level={2} id="2-upload-a-pdf">2. Upload a PDF</DocHeader>
      <DocList>
        <DocListItem>Click Documents in the top navigation bar.</DocListItem>
        <DocListItem>Click Upload PDF and select one or more scientific PDF files.</DocListItem>
        <DocListItem>PolyMinder queues the files for processing. The NER and RE models run automatically   this typically takes 30 120 seconds per document depending on length.</DocListItem>
        <DocListItem>Once processing is complete, the document status changes to Done.</DocListItem>
      </DocList>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_document_page_png} alt="Document management page" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Document management console</Box>
      </Box>
      <DocHeader level={2} id="3-open-the-result-page">3. Open the Result Page</DocHeader>
      <DocText>Click any completed document name to open it in the interactive viewer. The page shows:</DocText>
      <DocText>The PDF with entities highlighted in color.</DocText>
      <DocText>A sidebar listing extracted entities.</DocText>
      <DocText>A settings panel for switching modes and downloading results.</DocText>
      <DocText>A Workflow Guide stepper at the top that tracks your progress through the annotation workflow.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_Result_PNG} alt="Result viewer" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 3   Interactive result viewer</Box>
      </Box>
      <DocHeader level={2} id="4-follow-the-workflow-guide">4. Follow the Workflow Guide</DocHeader>
      <DocText>The Workflow Guide stepper at the top of the viewer tracks five steps:</DocText>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Step</th>
            <th style={thStyle}>What to do</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Upload PDF</td>
            <td style={tdStyle}>Already done   the step ticks automatically</td>
          </tr>
          <tr>
            <td style={tdStyle}>Review Entities</td>
            <td style={tdStyle}>Check the entity list in the sidebar. Edit incorrect entities; click the   star to confirm correct ones</td>
          </tr>
          <tr>
            <td style={tdStyle}>Check Relations</td>
            <td style={tdStyle}>Switch to Relations mode to verify how entities are linked</td>
          </tr>
          <tr>
            <td style={tdStyle}>Run LLM Extraction (optional)</td>
            <td style={tdStyle}>Switch to LLM mode and click any paragraph block to run a language model for extra entities</td>
          </tr>
          <tr>
            <td style={tdStyle}>Export Results</td>
            <td style={tdStyle}>Click Download Result to save the annotated PDF or JSON</td>
          </tr>
        </tbody>
      </table>
      <DocText>Click any step in the stepper to jump directly to that part of the workflow. See <DocLink href="../features/workflowguide">Workflow Guide</DocLink> for details.</DocText>
      <DocHeader level={2} id="5-review-and-edit-annotations">5. Review and Edit Annotations</DocHeader>
      <DocText>Edit an entity   right-click a highlight in the PDF or click the pencil icon in the sidebar.</DocText>
      <DocText>Delete an entity   use the delete option in the edit dialog.</DocText>
      <DocText>Add an entity   select text in the PDF and click Add Highlight.</DocText>
      <DocText>Edit a relation   switch to Relations mode and click the relation label in the entity editor.</DocText>
      <DocText>All changes are saved immediately. See <DocLink href="../features/editing">Editing Annotations</DocLink> for a full reference.</DocText>
      <DocHeader level={2} id="6-export-your-work">6. Export Your Work</DocHeader>
      <DocText>When your annotations are ready:</DocText>
      <DocList>
        <DocListItem>Click Download Result in the settings bar.</DocListItem>
        <DocListItem>Choose the export format:</DocListItem>
      </DocList>
      <DocText>Highlighted PDF   the original PDF with colored annotation overlays.</DocText>
      <DocText>JSON   structured data with all entities, relations, and metadata.</DocText>
      <DocList>
        <DocListItem>Choose whether to export All Data or Confirmed Only.</DocListItem>
      </DocList>
      <DocText>See <DocLink href="../features/download">Export Results</DocLink> for all export options.</DocText>
      <DocHeader level={2} id="whats-next">What's next?</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Goal</th>
            <th style={thStyle}>Go to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Learn all six working modes</td>
            <td style={tdStyle}><DocLink href="../features/resultvisualization">Result Visualization</DocLink></td>
          </tr>
          <tr>
            <td style={tdStyle}>Use LLM to find extra entities</td>
            <td style={tdStyle}><DocLink href="../features/llmextraction">LLM Extraction</DocLink></td>
          </tr>
          <tr>
            <td style={tdStyle}>Understand table extraction</td>
            <td style={tdStyle}><DocLink href="../features/tables">Tables Mode</DocLink></td>
          </tr>
          <tr>
            <td style={tdStyle}>Understand event annotations</td>
            <td style={tdStyle}><DocLink href="../features/events">Events Mode</DocLink></td>
          </tr>
          <tr>
            <td style={tdStyle}>Save annotation snapshots</td>
            <td style={tdStyle}><DocLink href="../features/savecheckpoints">Save Checkpoints</DocLink></td>
          </tr>
          <tr>
            <td style={tdStyle}>Filter entities by type or page</td>
            <td style={tdStyle}><DocLink href="../features/filtering">Filtering Results</DocLink></td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
}
