# Quick-Start Guide

Get up and running with PolyMinder in minutes.

---

## 1. Sign In

To access PolyMinder, sign in with a valid account. Visit the [Sign-in](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/signin) page, enter your username and password, and press **Sign In**. If you do not have an account yet, click [Sign Up](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/signup), complete the registration form, and then return to sign in.

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/signin_page.png" alt="PolyMinder sign-in screen" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 1 — Sign-in interface</em></figcaption>
</figure>

---

## 2. Upload a PDF

1. Click **Documents** in the top navigation bar.
2. Click **Upload PDF** and select one or more scientific PDF files.
3. PolyMinder queues the files for processing. The NER and RE models run automatically — this typically takes 30–120 seconds per document depending on length.
4. Once processing is complete, the document status changes to **Done**.

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/document_page.png" alt="Document management page" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 2 — Document management console</em></figcaption>
</figure>

---

## 3. Open the Result Page

Click any **completed document** name to open it in the interactive viewer. The page shows:

* The PDF with entities highlighted in color.
* A **sidebar** listing extracted entities.
* A **settings panel** for switching modes and downloading results.
* A **Workflow Guide** stepper at the top that tracks your progress through the annotation workflow.

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Result.PNG" alt="Result viewer" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 3 — Interactive result viewer</em></figcaption>
</figure>

---

## 4. Follow the Workflow Guide

The **Workflow Guide** stepper at the top of the viewer tracks five steps:

| Step | What to do |
|------|-----------|
| **Upload PDF** | Already done — the step ticks automatically |
| **Review Entities** | Check the entity list in the sidebar. Edit incorrect entities; click the ☆ star to confirm correct ones |
| **Check Relations** | Switch to **Relations** mode to verify how entities are linked |
| **Run LLM Extraction** *(optional)* | Switch to **LLM** mode and click any paragraph block to run a language model for extra entities |
| **Export Results** | Click **Download Result** to save the annotated PDF or JSON |

Click any step in the stepper to jump directly to that part of the workflow. See [Workflow Guide](../features/workflow_guide) for details.

---

## 5. Review and Edit Annotations

* **Edit an entity** — right-click a highlight in the PDF or click the pencil icon in the sidebar.
* **Delete an entity** — use the delete option in the edit dialog.
* **Add an entity** — select text in the PDF and click **Add Highlight**.
* **Edit a relation** — switch to Relations mode and click the relation label in the entity editor.

All changes are saved immediately. See [Editing Annotations](../features/editing) for a full reference.

---

## 6. Export Your Work

When your annotations are ready:

1. Click **Download Result** in the settings bar.
2. Choose the export format:
   * **Highlighted PDF** — the original PDF with colored annotation overlays.
   * **JSON** — structured data with all entities, relations, and metadata.
3. Choose whether to export **All Data** or **Confirmed Only**.

See [Export Results](../features/download) for all export options.

---

## What's next?

| Goal | Go to |
|------|-------|
| Learn all six working modes | [Result Visualization](../features/result_visualization) |
| Use LLM to find extra entities | [LLM Extraction](../features/llm_extraction) |
| Understand table extraction | [Tables Mode](../features/tables) |
| Understand event annotations | [Events Mode](../features/events) |
| Save annotation snapshots | [Save Checkpoints](../features/save_checkpoints) |
| Filter entities by type or page | [Filtering Results](../features/filtering) |
