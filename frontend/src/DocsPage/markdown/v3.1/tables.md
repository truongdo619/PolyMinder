# Tables Mode

View, edit, and extract structured information from tables detected in your PDF.

---

## Overview

Scientific papers frequently present key data — polymer properties, synthesis conditions, measurement results — in tabular form. PolyMinder automatically detects tables in each uploaded PDF and makes them available in **Tables Mode** for review and entity extraction.

---

## 1. Switch to Tables Mode

In the left settings panel, click **Tables** in the mode list.

* The PDF viewer highlights detected table regions.
* The right sidebar lists all tables found in the document, ordered by page number.

If the document contains no tables, a notice is shown in the sidebar. This can happen when tables are image-embedded or the layout parser could not identify a clear grid structure.

---

## 2. Browse Detected Tables

Each table entry in the sidebar shows:
* **Table name / caption** — extracted from the text near the table
* **Page number** — where the table appears in the PDF
* **Row count** — the number of data rows detected

Click a table entry to scroll the PDF to that table's location and open the table editor below.

---

## 3. Table Editor

Clicking a table opens the inline editor, which shows:

* **Caption** — editable text field for the table title
* **Footnote** — editable text field for any footnote text beneath the table
* **Context** — surrounding paragraph text for reference
* **Body** — an editable grid of the table content (HTML table format)

You can correct OCR errors directly in the body grid. Click **Save** to persist your edits.

---

## 4. Run LLM on a Table

Tables often contain implicit relationships (e.g., a property column paired with a value column). Use the **Generate** button inside the table editor to convert the table into natural-language sentences that PolyMinder can then annotate.

1. Open a table entry from the sidebar.
2. Click **Generate (LLM)** in the editor.
3. The model produces natural-language descriptions of each row.
4. Click **Save** to store the generated text alongside the table.

The generated text is then available as a paragraph in the main annotation workflow, and entities within it can be extracted and linked like any other paragraph.

---

## 5. Edit Table Entities and Relations

After generating natural-language output, entities and relations can be added to the table-derived text using the same tools as the Entities and Relations modes.

Switch back to **Entities** or **Relations** mode to see table-derived annotations alongside the rest of the document.

---

## 6. Reorder Tables

If the detected table order does not match the logical reading order of the paper, click **Revise the order** at the top of the Tables sidebar.

A drag-and-drop dialog opens listing all tables. Drag them to the correct sequence and click **Save & Reload**.

---

## Tips

* Tables that appear as scanned images cannot be automatically parsed. Use the table editor to enter the content manually.
* Long tables with many columns may be truncated in the editor view; scroll horizontally to see all columns.
* Use the **Context** field to see which paragraph directly precedes or follows the table — this often clarifies ambiguous column headers.
