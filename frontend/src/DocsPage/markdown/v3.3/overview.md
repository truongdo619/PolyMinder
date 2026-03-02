---
title: Overview
---

# PolyMinder v3.3 – Overview

<p class="description">
PolyMinder is a web‑based support system that **automatically extracts, visualizes, and lets you refine polymer‑related entities and their relationships directly on scientific PDFs**. By combining state‑of‑the‑art NER and RE models with an intuitive React interface, PolyMinder turns what used to be a labor‑intensive annotation workflow into a fast, interactive experience.
</p>

## What's New in v3.3

v3.3 introduces a **Guided User Experience** system that makes PolyMinder significantly more approachable for new users:

| Feature | Description |
|---------|-------------|
| **Workflow Stepper** | A collapsible 5‑step progress bar at the top of the PDF viewer that tracks your annotation progress and lets you jump between modes with one click. |
| **Contextual Banners** | 17 dismissible guidance banners appear at the right moment across all 6 annotation modes — Entities, Relations, Events, Tables, Paragraphs, and LLM. |
| **Optional Step Indicator** | The LLM Extraction step is visually distinguished as optional (faded blue, labeled "(optional)") so required steps stay clear. |
| **Per-Document Reset** | Workflow progress resets automatically when you open a new document, so steps always reflect the current file. |
| **Guidance Toggle** | Enable or disable the entire guidance system from the Settings sidebar — your preference is saved across sessions. |

New documentation pages in v3.3:

- [Workflow Guide](/#/docs/v3.3/features/workflow_guide) — how to use the stepper and banners
- [LLM Extraction](/#/docs/v3.3/features/llm_extraction) — step-by-step LLM-assisted annotation
- [Tables Mode](/#/docs/v3.3/features/tables) — browse, edit, and export detected tables
- [Events Mode](/#/docs/v3.3/features/events) — view and refine event annotations

## Introduction

The surge of publications in polymer science makes manual curation of key information—such as polymer names, material properties, and characterization methods—slow and error‑prone. PolyMinder tackles this bottleneck by

* parsing PDFs with [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/) and [Mineru](https://mineru.readthedocs.io/en/latest/index.html) to keep layout fidelity,
* applying [W2NER](https://github.com/ljynlp/W2NER) and [ALTOP](https://github.com/wzhouad/ATLOP) models fine‑tuned on the 750‑abstract [PolyNERE](https://aclanthology.org/2024.lrec-main.1126/) corpus, and
* surfacing the results in an editable browser interface so scientists can verify or correct them in seconds.

## Advantages of PolyMinder

- **Faster annotation** – With PolyMinder, users verify and refine extracted annotations instead of annotating from scratch.
- **Guided workflow** – The new v3.3 stepper and contextual banners guide users through each step, reducing the learning curve.
- **Centralized document management** – Provides a unified platform for storing and organizing annotated documents.
- **PDF‑native workflow** – annotations are overlaid on the original pages, preserving tables, figures, and layout context.
- **One‑click refinement** – CRUD tools let annotators fix parser or model errors without leaving the page.
- **High out-of-the-box accuracy** – State-of-the-art NER and RE models ensure strong performance on unseen data, minimizing the need for post-editing.

## PolyMinder vs. Traditional Annotation Tools

| Feature | Brat / Doccano | PDFAnno | **PolyMinder v3.3** |
|---------|---------------|---------|----------------|
| Works directly on PDFs | ✗ | ✔ | **✔** |
| Handles many relations without clutter | ▲ (SVG arrows can overlap) | ▲ | **✔ (sidebar + pop‑up)** |
| Domain‑specific NER/RE models included | ✗ | ✗ | **✔ (polymer‑trained)** |
| Guided workflow for new users | ✗ | ✗ | **✔ (v3.3 guidance system)** |
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
