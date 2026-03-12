# Frequently Asked Questions

---

## General

### What is PolyMinder?

PolyMinder is a web-based annotation system for scientific PDFs focused on polymer science. It automatically extracts polymer-related entities (such as polymer names, properties, values, and methods) and the relationships between them using fine-tuned NER and RE models. You can review, correct, and export the results directly in the browser.

### Who is PolyMinder for?

PolyMinder is designed for researchers in polymer science and materials science who need to extract structured information from large collections of papers — without manually reading and tagging every document from scratch.

---

## Documents and Processing

### How long does processing take?

Processing time depends on document length. A typical 8-page paper takes 30–90 seconds. Very long documents (30+ pages) may take 2–5 minutes. The document status in the dashboard updates automatically — no need to refresh.

### My document has been "Processing" for a long time. What should I do?

If a document stays in *Processing* for more than 10 minutes, try refreshing the page. If the status does not update, the backend queue may be busy or the document may have caused an error. Contact support with the document name and upload time.

### Can I upload scanned PDFs?

PolyMinder works best with text-embedded PDFs (i.e., PDFs where text can be selected in a viewer). Scanned image-only PDFs cannot be parsed for text, so entities and relations will not be extracted. Consider running OCR first (e.g., with Adobe Acrobat or Tesseract) before uploading.

---

## Entities and Relations

### Why are some entities missing or incorrect?

The NER model is trained on the PolyNERE corpus (750 polymer-science abstracts). It performs well on polymer-related text but may miss entities in unusual writing styles, heavily formatted sections, or domains outside its training distribution. Use [LLM Extraction](../features/llm_extraction) to supplement the model on paragraphs with missed entities, or add entities manually by selecting text in the PDF.

### How do I re-run the models after editing?

After significant edits, you may want to re-extract relations to reflect new or corrected entities. Click the **Re-run NER & RE Models** button in the toolbar (the refresh icon at the top of the result page). This re-processes the document with the current paragraph and entity state.

### What entity types does PolyMinder support?

PolyMinder recognises 16 entity types: `VALUE`, `POLYMER`, `POLYMER_FAMILY`, `PROP_VALUE`, `PROP_NAME`, `MONOMER`, `ORGANIC`, `INORGANIC`, `MATERIAL_AMOUNT`, `CONDITION`, `REF_EXP`, `OTHER_MATERIAL`, `COMPOSITE`, `SYN_METHOD`, `CHAR_METHOD`, and `EVENT`.

### What relation types are supported?

Nine relation types: `<OVERLAP>`, `has_property`, `has_value`, `has_amount`, `has_condition`, `abbreviation_of`, `refers_to`, `synthesised_by`, and `characterized_by`.

### Can I add my own entity or relation types?

Not through the UI in the current version. Entity and relation schemas are defined in the backend `settings.json`. Contact your administrator to add custom types to the configuration.

---

## LLM Extraction

### What does LLM Extraction do differently from the built-in model?

The built-in NER/RE models are fast statistical models trained on a fixed dataset. LLM Extraction sends the paragraph text to a large language model (e.g., GPT-4) with a custom prompt, which can generalise to unusual phrasing or rare polymer names. The trade-off is speed and API cost — LLM extraction is slower and optional.

### Which LLM models are available?

Available models depend on your backend configuration. Administrators can add API keys for OpenAI, Anthropic, or other providers. The model list in the LLM dialog reflects whatever is configured on the server.

### My LLM extraction returned garbled text. What happened?

The LLM response parser expects a specific JSON format from the model. If the model returns free text or an unexpected structure, parsing will fail or produce incorrect entities. Try a different prompt preset or re-run the extraction. Some models are more consistent with structured output than others.

---

## Saving and Exporting

### Can I undo changes?

PolyMinder does not have an in-session undo button. However, you can save **Checkpoints** before making large edits and restore them later. See [Save Checkpoints](../features/save_checkpoints).

### What is the difference between "All Data" and "Confirmed Only" exports?

* **All Data** — exports every entity and relation regardless of confirmation status.
* **Confirmed Only** — exports only entities/relations you have marked with the ★ star icon. Use this for high-quality, reviewed output.

### Where are my exported files saved?

Files are downloaded directly to your browser's default download folder (usually `~/Downloads`). PolyMinder does not store exported files on the server.

---

## Workflow Guide

### What is the Workflow Guide stepper?

The stepper is a 5-step progress bar at the top of the result page that tracks your annotation workflow: Upload PDF → Review Entities → Check Relations → Run LLM (optional) → Export Results. Steps tick automatically as you complete them. See [Workflow Guide](../features/workflow_guide) for details.

### Can I hide the Workflow Guide?

Yes. Click the stepper header to collapse it, or uncheck **Show guidance tips** at the bottom of the settings panel to hide all guidance banners.

---

## Account

### How do I change my password?

Go to **Profile** (click your username in the top bar) → **Change Password**. Enter your current password, then your new one, and confirm. See [Personal Information Update](../features/personalization).

### I forgot my password. How do I reset it?

On the sign-in page, click **Forgot Password**. Enter your registered email address and follow the link sent to your inbox.
