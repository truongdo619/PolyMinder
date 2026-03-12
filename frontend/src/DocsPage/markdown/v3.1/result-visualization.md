# Result Visualization

After PolyMinder finishes processing a PDF, click on the title of a processed document and the **Result Page** will appear. This view combines an `entity-highlighted PDF`, an interactive `sidebar`, and a `settings panel` so you can explore, filter, and export your annotations with ease.

---

## 1. Result Page Layout

| Area | Purpose |
|------|---------|
| **Entity-Highlighted PDF** | Shows the original pages with every entity type color-coded. Hovering reveals a tooltip; clicking opens detail views. |
| **Sidebar** | Lists entities, relations, paragraphs, events, and tables depending on the active mode. Selecting an item scrolls the PDF to its location. |
| **Settings Bar** | Global actions: save a checkpoint, download results, switch between modes, and apply filters. |
| **Workflow Guide** | A collapsible 5-step stepper at the top showing your annotation progress. |

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/visualization.drawio.png"
       alt="Result Page Layout"
       style="width:100%;border-radius:6px;" />
  <figcaption><em>Figure 1 — Result Page Layout</em></figcaption>
</figure>

### 1.1 Entity-Highlighted PDF

* Each entity category (e.g., **POLYMER**, **PROP_VALUE**) is rendered in a unique color.
* Clicking a highlight synchronises the sidebar and opens advanced visualisations (see below).

### 1.2 Sidebar

Content changes depending on the active mode (see Section 3 below).

### 1.3 Settings Bar

* **Save Checkpoint** — store the current annotation state as a named snapshot.
* **Summarize Result** — generate an interactive graph of all entities and relations.
* **Download Result** — export annotations as a highlighted PDF or JSON file.
* **Mode Switcher** — toggles between the six working modes (see Section 3).
* **Filter Icon** — launch advanced filtering by entity type, page range, or confirmation status.

---

## 2. Advanced Visualization

PolyMinder offers two deeper inspection tools for analysing complex relationships.

### 2.1 BRAT-Styled View

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/brat_styled.png"
       alt="BRAT-styled popup"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2 — BRAT-styled popup</em></figcaption>
</figure>

* Click any highlight in the PDF **or** any entity card in the sidebar to open the `Brat Visualization` dialog.
* A popup appears with a BRAT-style diagram of the selected entity and its immediate relations.
* Press **Show All Entities** to render the entire paragraph in BRAT format for full-context review.

### 2.2 Graph View

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/graph_visualization.png"
       alt="Graph Visualization"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 3 — Graph Visualization</em></figcaption>
</figure>

* Accessible via the **Summarize Result** button in the settings bar.
* Displays a network graph of all extracted entities and relations.
* Nodes = `entities`, edges = `relations`.
* Both direct and indirect connections are shown, helping you trace multi-step relationships at a glance.

---

## 3. Working Modes

Use the **Mode Switcher** in the settings bar to tailor the sidebar to your current task. There are six modes:

### Entities

The default view. Lists every extracted entity with its type, text, and page location. Click an entity to scroll to it in the PDF. Right-click for edit and delete options. Entities are color-coded by type.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/entity_mode.jpeg"
       alt="Entity Mode"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 4 — Entity Mode</em></figcaption>
</figure>

### Relations

Displays only entities that participate in at least one extracted relationship. Use this mode to verify that polymers, properties, and values are correctly linked with relation types such as `has_property` or `has_value`.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/relation_mode.jpeg"
       alt="Relation Mode"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 5 — Relation Mode</em></figcaption>
</figure>

### Events

Groups entities into structured events — actions such as synthesis steps or characterization procedures. Each event shows a trigger word and the entities that act as arguments. See [Events Mode](../features/events) for full details.

### Tables

Lists all tables detected in the PDF. Click a table entry to open the inline editor for correcting OCR errors, editing captions, or running LLM to generate natural-language descriptions. See [Tables Mode](../features/tables) for full details.

### Paragraphs

Organises the document into raw text segments. Use this mode to correct misread paragraph text or to drag-and-drop paragraphs into the correct reading order.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/paragraph_mode.jpeg"
       alt="Paragraph Mode"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 6 — Paragraph Mode</em></figcaption>
</figure>

### LLM

Switches the PDF to paragraph-block view. Click any block to open the LLM extraction dialog, choose a prompt preset and model, then run extraction. Results can be compared with the built-in model output and merged. See [LLM Extraction](../features/llm_extraction) for full details.

> **Tip:** The filter icon works in sync with the selected mode, enabling precise control over what appears in both the PDF and the sidebar.
