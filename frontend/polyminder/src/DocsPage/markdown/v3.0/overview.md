---
title: Overview
---

# PolyMinder – Overview

<p class="description">
PolyMinder is a web‑based support system that **automatically extracts, visualizes, and lets you refine polymer‑related entities and their relationships directly on scientific PDFs**. By combining state‑of‑the‑art NER and RE models with an intuitive React interface, PolyMinder turns what used to be a labor‑intensive annotation workflow into a fast, interactive experience.
</p>

## Introduction

The surge of publications in polymer science makes manual curation of key information—such as polymer names, material properties, and characterization methods—slow and error‑prone. PolyMinder tackles this bottleneck by  

* parsing PDFs with [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/) and [Mineru](https://mineru.readthedocs.io/en/latest/index.html) to keep layout fidelity,  
* applying [W2NER](https://github.com/ljynlp/W2NER) and [ALTOP](https://github.com/wzhouad/ATLOP) models fine‑tuned on the 750‑abstract [PolyNERE](https://aclanthology.org/2024.lrec-main.1126/) corpus, and  
* surfacing the results in an editable browser interface so scientists can verify or correct them in seconds.

## Advantages of PolyMinder

- **Faster annotation** – With PolyMinder, users verify and refine extracted annotations instead of annotating from scratch.
- **Centralized document management** – Provides a unified platform for storing and organizing annotated documents.
- **PDF‑native workflow** – annotations are overlaid on the original pages, preserving tables, figures, and layout context.  
- **One‑click refinement** – CRUD tools let annotators fix parser or model errors without leaving the page.  
- **High out-of-the-box accuracy** – State-of-the-art NER and RE models ensure strong performance on unseen data, minimizing the need for post-editing.

<!-- ## System Architecture

PolyMinder follows a clean separation of concerns:

| Layer | Key tech | Responsibilities |
|-------|----------|------------------|
| **Frontend** | React, TypeScript, MUI | File upload, PDF canvas with entity highlights, relation pop‑ups, edit/download actions |
| **REST API** | FastAPI | Orchestrates extraction pipeline, exposes CRUD endpoints |
| **Backend services** | PyMuPDF, W2NER, ATLOP, SQLAlchemy + PostgreSQL | PDF parsing, NER/RE inference, data storage, re‑processing on edits |

This architecture ensures real‑time feedback: every user edit triggers an immediate re‑render of the affected entities/relations. -->

## PolyMinder vs. Traditional Annotation Tools

| Feature | Brat / Doccano | PDFAnno | **PolyMinder** |
|---------|---------------|---------|----------------|
| Works directly on PDFs | ✗ | ✔ | **✔** |
| Handles many relations without clutter | ▲ (SVG arrows can overlap) | ▲ | **✔ (sidebar + pop‑up)** |
| Domain‑specific NER/RE models included | ✗ | ✗ | **✔ (polymer‑trained)** |
| Open‑source & easily extensible | ✔ | ✔ | **✔** |

## Citation

If you use this work or code, please kindly cite this paper:

```
@inproceedings{do2025polyminder,
  title={PolyMinder: A Support System for Entity Annotation and Relation Extraction in Polymer Science Documents},
  author={Do, Truong Dinh and Trieu, An Hoang and Phi, Van-Thuy and Le Nguyen, Minh and Matsumoto, Yuji},
  booktitle={Proceedings of the 31st International Conference on Computational Linguistics: System Demonstrations},
  pages={1--8},
  year={2025}
}
```


## Contact Support

If you need assistance, please reach out to our support team:

- **Email:** [truongdo@jaist.ac.jp](mailto:truongdo@jaist.ac.jp)