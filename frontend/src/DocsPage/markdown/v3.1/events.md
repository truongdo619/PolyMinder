# Events Mode

Extract and review structured event annotations that group related entities within a paragraph.

---

## Overview

An **event** in PolyMinder represents a structured action or process described in a single paragraph — for example, a synthesis step, a measurement procedure, or a characterization result. Unlike individual entities, events capture the *relationship between entities and the action that connects them*.

Events mode is particularly useful for understanding experimental workflows in polymer science papers, where multiple entities (polymer, monomer, condition, method) co-occur in a single procedural sentence.

---

## 1. Switch to Events Mode

In the left settings panel, click **Events** in the mode list.

* The PDF viewer shows entity highlights as usual.
* The right sidebar lists all detected event annotations grouped by paragraph.

---

## 2. Understanding the Event List

Each event card in the sidebar displays:

* **Trigger** — the action word or phrase that defines the event (e.g., *synthesized*, *measured*, *characterized*)
* **Arguments** — the entities that participate in the event, each labelled with a semantic role (e.g., *Agent*, *Theme*, *Instrument*)
* **Paragraph reference** — which paragraph the event was extracted from

Click any event card to scroll the PDF to the source paragraph.

---

## 3. Filter Which Paragraphs Contribute

By default, events are extracted from every paragraph in the document. For long papers you may want to restrict analysis to specific sections (e.g., only the Experimental section).

1. Click **Adjust your selection** at the top of the Events sidebar.
2. A dialog lists every paragraph with a checkbox.
3. Uncheck paragraphs you want to exclude.
4. Use **Select All** / **Clear All** for bulk actions.
5. Click **Save & Reload**.

PolyMinder re-runs event extraction using only the checked paragraphs. Unchecked paragraphs retain all their entity annotations — they are simply excluded from event grouping.

---

## 4. Edit an Event

1. Click the **pencil icon** on an event card.
   An edit dialog opens.

2. You can:
   * Change the **trigger text** and its character span.
   * Add, remove, or relabel **argument entities**.
   * Change the **argument role** for each participant.

3. Click **Save & Reload** to confirm.

---

## 5. Confirm an Event

Mark an event as reviewed by clicking the **star icon** on its card.
A filled star indicates the event has been verified. Confirmed events can be selectively included when exporting results.

---

## 6. Delete an Event

Click the **delete icon** on an event card and confirm.
The event is removed from the annotation, but the underlying entities remain in the document.

---

## Tips

* If no events appear in the sidebar, the NER/RE models may not have extracted trigger words from the current set of paragraphs. Try switching to **LLM Extraction** mode for those paragraphs.
* Events are most useful in the Experimental and Results sections of polymer papers. Use **Adjust your selection** to focus on those sections.
* Event arguments inherit their entity type from the main annotation — editing an entity in Entities mode also updates it here.
