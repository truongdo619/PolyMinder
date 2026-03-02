# LLM Extraction

Use large language models to extract additional entities and relations that the built-in NER/RE models may have missed.

---

## Overview

PolyMinder's built-in NER and RE models produce high-quality predictions out of the box, but they operate on patterns learned from a fixed training set. **LLM Extraction** lets you run a prompted language model (e.g. GPT-4, Claude) over individual paragraphs to catch entities the statistical models miss, then merge the best results into your final annotation.

---

## 1. Switch to LLM Mode

In the left settings panel, click **LLM** in the mode list.

* The PDF viewer switches to **paragraph-block view**: each text segment is highlighted in a uniform teal color.
* The right sidebar shows the LLM panel with instructions and any previously extracted LLM entities.

---

## 2. Run Extraction on a Paragraph

1. **Click any paragraph block** in the PDF viewer.
   A dialog opens showing the full paragraph text and extraction controls.

2. Choose a **Prompt Preset** from the drop-down.
   Presets are pre-written instructions optimised for different extraction goals (e.g. *entities only*, *entities + relations*, *property–value pairs*).

3. Select a **Model** from the model list.
   Available models are configured by your administrator in the backend settings.

4. Click **Run with LLM**.
   The request is sent to the backend, which calls the selected model API.
   Results appear in the dialog as a list of proposed entities.

5. Click **Parse LLM Output** to convert the raw model response into structured entities.
   Parsed entities appear highlighted in the paragraph preview inside the dialog.

6. Click **Save** to add the parsed entities to the LLM sidebar.

> **Tip:** You can run multiple paragraphs sequentially. The LLM sidebar accumulates all results across the session.

---

## 3. Review LLM Results in the Sidebar

After saving, LLM-extracted entities appear in the right sidebar as a list of cards.

Each card shows:
* **Entity text** — the span extracted from the paragraph
* **Entity type** — the label assigned by the model
* **Paragraph reference** — the source paragraph

---

## 4. Compare LLM Output with Model Output

For any LLM entity, you can compare it against what the built-in NER model extracted from the same paragraph.

1. **Right-click** an entity card in the LLM sidebar.
2. Select **Compare with model output**.
   A side-by-side comparison dialog opens.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/llm_compare.png"
       alt="LLM vs model comparison dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1 — Side-by-side comparison of LLM and model outputs</em></figcaption>
</figure>

The left panel shows the **model-extracted** entities; the right panel shows the **LLM-extracted** entities.
Tick the entities you want to keep from each side, then click **Merge Selected**.

---

## 5. Merge Results into Main Annotation

After comparing, click **Merge** (or **Merge Selected**).
PolyMinder:

1. Adds the selected LLM entities to the main annotation set.
2. Resolves any overlapping spans according to the merge strategy (longest span wins by default).
3. Reloads the result page with the combined entity set.

> **Note:** Merging is non-destructive — the original model output is preserved. You can always reopen the compare dialog and change your selection.

---

## 6. Delete an LLM Entity

If an LLM entity is incorrect, right-click it and select **Delete**.
The entity is removed from the LLM sidebar but the main annotation is not affected unless you have already merged it.

---

## When to Use LLM Extraction

| Situation | Recommendation |
|-----------|---------------|
| Document is dense with property–value pairs | Run LLM on the Results/Methods sections |
| Model missed a rare polymer name | Run LLM on the abstract or introduction |
| You want high recall, then filter manually | Run LLM on all paragraphs, then use Compare to pick the best |
| Time is short | Run LLM only on paragraphs flagged as low-confidence by the model |
