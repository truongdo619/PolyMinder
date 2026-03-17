const fs = require('fs');
const path = require('path');

const overview31 = `
# Overview

PolyMinder is a web-based support system that automatically extracts, visualizes, and lets you refine polymer-related entities and their relationships directly on scientific PDFs. By combining state-of-the-art NER and RE models with an intuitive React interface, PolyMinder turns what used to be a labor-intensive annotation workflow into a fast, interactive experience.

## Introduction

The surge of publications in polymer science makes manual curation of key information—such as polymer names, material properties, and characterization methods—slow and error-prone. PolyMinder tackles this bottleneck by:

- parsing PDFs with PyMuPDF and Mineru to keep layout fidelity,
- applying W2NER and ALTOP models fine-tuned on the 750-abstract PolyNERE corpus, and
- surfacing the results in an editable browser interface so scientists can verify or correct them in seconds.

## Advantages of PolyMinder

- **Faster annotation** – With PolyMinder, users verify and refine extracted annotations instead of annotating from scratch.
- **Centralized document management** – Provides a unified platform for storing and organizing annotated documents.
- **PDF-native workflow** – annotations are overlaid on the original pages, preserving tables, figures, and layout context.
- **One-click refinement** – CRUD tools let annotators fix parser or model errors without leaving the page.
- **High out-of-the-box accuracy** – State-of-the-art NER and RE models ensure strong performance on unseen data, minimizing the need for post-editing.

## PolyMinder vs. Traditional Annotation Tools

| Feature | Brat / Doccano | PDFAnno | PolyMinder v3.1 |
| --- | --- | --- | --- |
| Works directly on PDFs | ✗ | ✔ | **✔** |
| Handles many relations without clutter | ▲ (SVG arrows can overlap) | ▲ | **✔ (sidebar + pop-up)** |
| Domain-specific NER/RE models included | ✗ | ✗ | **✔ (polymer-trained)** |
| Open-source & easily extensible | ✔ | ✔ | **✔** |

## Citation

If you use this work or code, please kindly cite this paper:

\`\`\`bibtex
@inproceedings{do2025polyminder,
  title={PolyMinder: A Support System for Entity Annotation and Relation Extraction in Polymer Science Documents},
  author={Do, Truong Dinh and Trieu, An Hoang and Phi, Van-Thuy and Le Nguyen, Minh and Matsumoto, Yuji},
  booktitle={Proceedings of the 31st International Conference on Computational Linguistics: System Demonstrations},
  pages={1--8},
  year={2025}
}
\`\`\`

## Contact Support

If you need assistance, please reach out to our support team:

- **Email:** [truongdo@jaist.ac.jp](mailto:truongdo@jaist.ac.jp)
`;

const overview30 = overview31.replace("PolyMinder v3.1", "PolyMinder v3.0");
const overview20 = overview31.replace("PolyMinder v3.1", "PolyMinder v2.0");

if (!fs.existsSync('src/DocsPage/markdown')) {
  fs.mkdirSync('src/DocsPage/markdown');
  fs.mkdirSync('src/DocsPage/markdown/v3.3');
  fs.mkdirSync('src/DocsPage/markdown/v3.0');
  fs.mkdirSync('src/DocsPage/markdown/v3.1');
  fs.mkdirSync('src/DocsPage/markdown/v2.0');
}

fs.writeFileSync('src/DocsPage/markdown/v3.1/overview.md', overview31);
fs.writeFileSync('src/DocsPage/markdown/v3.0/overview.md', overview30);
fs.writeFileSync('src/DocsPage/markdown/v2.0/overview.md', overview20);
