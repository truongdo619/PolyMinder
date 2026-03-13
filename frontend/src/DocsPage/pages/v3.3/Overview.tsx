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

export const toc = [
  { id: "whats-new", title: "What's New in v3.3", level: 2 },
  { id: "introduction", title: "Introduction", level: 2 },
  { id: "advantages", title: "Advantages of PolyMinder", level: 2 },
  { id: "comparison", title: "PolyMinder vs. Traditional Annotation Tools", level: 2 },
  { id: "citation", title: "Citation", level: 2 },
  { id: "contact", title: "Contact Support", level: 2 },
];

export const searchContent = `
PolyMinder v3.3   Overview
PolyMinder is a web-based support system that automatically extracts, visualizes, and lets you refine polymer-related entities and their relationships directly on scientific PDFs.
What's New in v3.3
v3.3 introduces a Guided User Experience system that makes PolyMinder significantly more approachable for new users. Workflow Stepper, Contextual Banners, Optional Step Indicator, Per-Document Reset, Guidance Toggle.
Introduction
The surge of publications in polymer science makes manual curation... parsing PDFs with PyMuPDF and Mineru... W2NER and ALTOP models...
Advantages of PolyMinder
Faster annotation, Guided workflow, Centralized document management, PDF-native workflow, One-click refinement, High out-of-the-box accuracy.
PolyMinder vs. Traditional Annotation Tools
Citation
Contact Support
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Overview() {
  return (
    <Box>
      <DocHeader level={1} id="overview">PolyMinder v3.3 – Overview</DocHeader>
      
      <DocText>
        PolyMinder is a web‑based support system that <strong>automatically extracts, visualizes, and lets you refine polymer‑related entities and their relationships directly on scientific PDFs</strong>. By combining state‑of‑the‑art NER and RE models with an intuitive React interface, PolyMinder turns what used to be a labor‑intensive annotation workflow into a fast, interactive experience.
      </DocText>

      <DocHeader level={2} id="whats-new">What's New in v3.3</DocHeader>
      <DocText>
        v3.3 introduces a <strong>Guided User Experience</strong> system that makes PolyMinder significantly more approachable for new users:
      </DocText>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Feature</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><strong>Workflow Stepper</strong></td>
            <td style={tdStyle}>A collapsible 5‑step progress bar at the top of the PDF viewer that tracks your annotation progress and lets you jump between modes with one click.</td>
          </tr>
          <tr>
            <td style={tdStyle}><strong>Contextual Banners</strong></td>
            <td style={tdStyle}>17 dismissible guidance banners appear at the right moment across all 6 annotation modes — Entities, Relations, Events, Tables, Paragraphs, and LLM.</td>
          </tr>
          <tr>
            <td style={tdStyle}><strong>Optional Step Indicator</strong></td>
            <td style={tdStyle}>The LLM Extraction step is visually distinguished as optional (faded blue, labeled "(optional)") so required steps stay clear.</td>
          </tr>
          <tr>
            <td style={tdStyle}><strong>Per-Document Reset</strong></td>
            <td style={tdStyle}>Workflow progress resets automatically when you open a new document, so steps always reflect the current file.</td>
          </tr>
          <tr>
            <td style={tdStyle}><strong>Guidance Toggle</strong></td>
            <td style={tdStyle}>Enable or disable the entire guidance system from the Settings sidebar — your preference is saved across sessions.</td>
          </tr>
        </tbody>
      </table>

      <DocText>New documentation pages in v3.3:</DocText>
      <DocList>
        <DocListItem><DocLink href="#/docs/v3.3/features/workflow_guide">Workflow Guide</DocLink> — how to use the stepper and banners</DocListItem>
        <DocListItem><DocLink href="#/docs/v3.3/features/llm_extraction">LLM Extraction</DocLink> — step-by-step LLM-assisted annotation</DocListItem>
        <DocListItem><DocLink href="#/docs/v3.3/features/tables">Tables Mode</DocLink> — browse, edit, and export detected tables</DocListItem>
        <DocListItem><DocLink href="#/docs/v3.3/features/events">Events Mode</DocLink> — view and refine event annotations</DocListItem>
      </DocList>

      <DocHeader level={2} id="introduction">Introduction</DocHeader>
      <DocText>
        The surge of publications in polymer science makes manual curation of key information—such as polymer names, material properties, and characterization methods—slow and error‑prone. PolyMinder tackles this bottleneck by:
      </DocText>
      <DocList>
        <DocListItem>parsing PDFs with <DocLink href="https://pymupdf.readthedocs.io/en/latest/">PyMuPDF</DocLink> and <DocLink href="https://mineru.readthedocs.io/en/latest/index.html">Mineru</DocLink> to keep layout fidelity,</DocListItem>
        <DocListItem>applying <DocLink href="https://github.com/ljynlp/W2NER">W2NER</DocLink> and <DocLink href="https://github.com/wzhouad/ATLOP">ALTOP</DocLink> models fine‑tuned on the 750‑abstract <DocLink href="https://aclanthology.org/2024.lrec-main.1126/">PolyNERE</DocLink> corpus, and</DocListItem>
        <DocListItem>surfacing the results in an editable browser interface so scientists can verify or correct them in seconds.</DocListItem>
      </DocList>

      <DocHeader level={2} id="advantages">Advantages of PolyMinder</DocHeader>
      <DocList>
        <DocListItem><strong>Faster annotation</strong> – With PolyMinder, users verify and refine extracted annotations instead of annotating from scratch.</DocListItem>
        <DocListItem><strong>Guided workflow</strong> – The new v3.3 stepper and contextual banners guide users through each step, reducing the learning curve.</DocListItem>
        <DocListItem><strong>Centralized document management</strong> – Provides a unified platform for storing and organizing annotated documents.</DocListItem>
        <DocListItem><strong>PDF‑native workflow</strong> – annotations are overlaid on the original pages, preserving tables, figures, and layout context.</DocListItem>
        <DocListItem><strong>One‑click refinement</strong> – CRUD tools let annotators fix parser or model errors without leaving the page.</DocListItem>
        <DocListItem><strong>High out-of-the-box accuracy</strong> – State-of-the-art NER and RE models ensure strong performance on unseen data, minimizing the need for post-editing.</DocListItem>
      </DocList>

      <DocHeader level={2} id="comparison">PolyMinder vs. Traditional Annotation Tools</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Feature</th>
            <th style={thStyle}>Brat / Doccano</th>
            <th style={thStyle}>PDFAnno</th>
            <th style={thStyle}>PolyMinder v3.3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Works directly on PDFs</td>
            <td style={tdStyle}>✗</td>
            <td style={tdStyle}>✔</td>
            <td style={tdStyle}><strong>✔</strong></td>
          </tr>
          <tr>
            <td style={tdStyle}>Handles many relations without clutter</td>
            <td style={tdStyle}>▲ (SVG arrows can overlap)</td>
            <td style={tdStyle}>▲</td>
            <td style={tdStyle}><strong>✔ (sidebar + pop‑up)</strong></td>
          </tr>
          <tr>
            <td style={tdStyle}>Domain‑specific NER/RE models included</td>
            <td style={tdStyle}>✗</td>
            <td style={tdStyle}>✗</td>
            <td style={tdStyle}><strong>✔ (polymer‑trained)</strong></td>
          </tr>
          <tr>
            <td style={tdStyle}>Guided workflow for new users</td>
            <td style={tdStyle}>✗</td>
            <td style={tdStyle}>✗</td>
            <td style={tdStyle}><strong>✔ (v3.3 guidance system)</strong></td>
          </tr>
          <tr>
            <td style={tdStyle}>Open‑source & easily extensible</td>
            <td style={tdStyle}>✔</td>
            <td style={tdStyle}>✔</td>
            <td style={tdStyle}><strong>✔</strong></td>
          </tr>
        </tbody>
      </table>

      <DocHeader level={2} id="citation">Citation</DocHeader>
      <DocText>If you use this work or code, please kindly cite this paper:</DocText>
      <DocCodeBlock code={`@inproceedings{do2025polyminder,
  title={PolyMinder: A Support System for Entity Annotation and Relation Extraction in Polymer Science Documents},
  author={Do, Truong Dinh and Trieu, An Hoang and Phi, Van-Thuy and Le Nguyen, Minh and Matsumoto, Yuji},
  booktitle={Proceedings of the 31st International Conference on Computational Linguistics: System Demonstrations},
  pages={1--8},
  year={2025}
}`} />

      <DocHeader level={2} id="contact">Contact Support</DocHeader>
      <DocText>If you need assistance, please reach out to our support team:</DocText>
      <DocList>
        <DocListItem><strong>Email:</strong> <DocLink href="mailto:truongdo@jaist.ac.jp">truongdo@jaist.ac.jp</DocLink></DocListItem>
      </DocList>
    </Box>
  );
}
