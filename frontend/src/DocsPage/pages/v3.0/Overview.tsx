import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink,
  DocList,
  DocListItem,
  DocCodeBlock,
} from "../../components/DocComponents";

export const toc = [
  { id: "introduction", title: "Introduction", level: 2 },
  { id: "advantages-of-polyminder", title: "Advantages of PolyMinder", level: 2 },
  { id: "polyminder-vs-traditional-annotation-tools", title: "PolyMinder vs. Traditional Annotation Tools", level: 2 },
  { id: "citation", title: "Citation", level: 2 },
  { id: "contact-support", title: "Contact Support", level: 2 },
];

export const searchContent = `
# Overview

PolyMinder is a web-based support system that automatically extracts, visualizes, and lets you refine polymer-related entities and their relationships directly on scientific PDFs. By combining state-of-the-art NER and RE models with an intuitive React interface, PolyMinder turns what used to be a labor-intensive annotation workflow into a fast, interactive experience.

## Introduction

The surge of publications in polymer science makes manual curation of key information such as polymer names, material properties, and characterization methods slow and error-prone. PolyMinder tackles this bottleneck by:

- parsing PDFs with PyMuPDF and Mineru to keep layout fidelity,
- applying W2NER and ALTOP models fine-tuned on the 750-abstract PolyNERE corpus, and
- surfacing the results in an editable browser interface so scientists can verify or correct them in seconds.

## Advantages of PolyMinder

- Faster annotation   With PolyMinder, users verify and refine extracted annotations instead of annotating from scratch.
- Centralized document management   Provides a unified platform for storing and organizing annotated documents.
- PDF-native workflow   annotations are overlaid on the original pages, preserving tables, figures, and layout context.
- One-click refinement   CRUD tools let annotators fix parser or model errors without leaving the page.
- High out-of-the-box accuracy   State-of-the-art NER and RE models ensure strong performance on unseen data, minimizing the need for post-editing.

## PolyMinder vs. Traditional Annotation Tools

| Feature | Brat / Doccano | PDFAnno | PolyMinder v3.0 |
| --- | --- | --- | --- |
| Works directly on PDFs |   |   |   |
| Handles many relations without clutter |   (SVG arrows can overlap) |   |   (sidebar + pop-up) |
| Domain-specific NER/RE models included |   |   |   (polymer-trained) |
| Open-source & easily extensible |   |   |   |

## Citation

If you use this work or code, please kindly cite this paper:

bibtex
@inproceedings{do2025polyminder,
  title={PolyMinder: A Support System for Entity Annotation and Relation Extraction in Polymer Science Documents},
  author={Do, Truong Dinh and Trieu, An Hoang and Phi, Van-Thuy and Le Nguyen, Minh and Matsumoto, Yuji},
  booktitle={Proceedings of the 31st International Conference on Computational Linguistics: System Demonstrations},
  pages={1--8},
  year={2025}
}


## Contact Support

If you need assistance, please reach out to our support team:

- Email: [truongdo@jaist.ac.jp](mailto:truongdo@jaist.ac.jp)
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Overview() {
  return (
    <Box>
      <DocHeader level={1} id="overview">Overview</DocHeader>
      <DocText>PolyMinder is a web-based support system that automatically extracts, visualizes, and lets you refine polymer-related entities and their relationships directly on scientific PDFs. By combining state-of-the-art NER and RE models with an intuitive React interface, PolyMinder turns what used to be a labor-intensive annotation workflow into a fast, interactive experience.</DocText>
      <DocHeader level={2} id="introduction">Introduction</DocHeader>
      <DocText>The surge of publications in polymer science makes manual curation of key information such as polymer names, material properties, and characterization methods slow and error-prone. PolyMinder tackles this bottleneck by:</DocText>
      <DocList>
        <DocListItem>parsing PDFs with PyMuPDF and Mineru to keep layout fidelity,</DocListItem>
        <DocListItem>applying W2NER and ALTOP models fine-tuned on the 750-abstract PolyNERE corpus, and</DocListItem>
        <DocListItem>surfacing the results in an editable browser interface so scientists can verify or correct them in seconds.</DocListItem>
      </DocList>
      <DocHeader level={2} id="advantages-of-polyminder">Advantages of PolyMinder</DocHeader>
      <DocList>
        <DocListItem>Faster annotation   With PolyMinder, users verify and refine extracted annotations instead of annotating from scratch.</DocListItem>
        <DocListItem>Centralized document management   Provides a unified platform for storing and organizing annotated documents.</DocListItem>
        <DocListItem>PDF-native workflow   annotations are overlaid on the original pages, preserving tables, figures, and layout context.</DocListItem>
        <DocListItem>One-click refinement   CRUD tools let annotators fix parser or model errors without leaving the page.</DocListItem>
        <DocListItem>High out-of-the-box accuracy   State-of-the-art NER and RE models ensure strong performance on unseen data, minimizing the need for post-editing.</DocListItem>
      </DocList>
      <DocHeader level={2} id="polyminder-vs-traditional-annotation-tools">PolyMinder vs. Traditional Annotation Tools</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Feature</th>
            <th style={thStyle}>Brat / Doccano</th>
            <th style={thStyle}>PDFAnno</th>
            <th style={thStyle}>PolyMinder v3.0</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Works directly on PDFs</td>
          </tr>
          <tr>
            <td style={tdStyle}>Handles many relations without clutter</td>
            <td style={tdStyle}>(SVG arrows can overlap)</td>
            <td style={tdStyle}>(sidebar + pop-up)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Domain-specific NER/RE models included</td>
            <td style={tdStyle}>(polymer-trained)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Open-source &amp; easily extensible</td>
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
      <DocHeader level={2} id="contact-support">Contact Support</DocHeader>
      <DocText>If you need assistance, please reach out to our support team:</DocText>
      <DocList>
        <DocListItem>Email: <DocLink href="mailto:truongdo@jaist.ac.jp">truongdo@jaist.ac.jp</DocLink></DocListItem>
      </DocList>
    </Box>
  );
}
