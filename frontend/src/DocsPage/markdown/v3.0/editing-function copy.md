<!-- ­–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– -->
# Editing Annotations
PolyMinder lets you **verify, correct, and enrich** every paragraph, entity, and relationship directly inside the PDF viewer.  
<!-- ­–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– -->

## 1 · Paragraph Text

**Open the Paragraph Viewer**: Click the **Paragraph** tab in the right‑hand sidebar.

<figure style="width:52%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Paragraph_view.PNG"
       alt="Paragraph viewer"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Paragraph viewer panel</em></figcaption>
</figure>

**Inspect & Edit**: Click the **pencil** icon to enter edit mode, modify the content, and press **Save & Reload**.  
   <figure style="width:55%;margin:1rem auto;text-align:center;">
     <img src="./src/DocsPage/photos/para_edit_instruct.png"
          alt="Edit instruction"
          style="width:100%;border:1px solid #ddd;border-radius:6px;" />
     <figcaption><em>Editing dialog</em></figcaption>
   </figure>

> **Note:** All paragraph edits are versioned. You can restore earlier text from **History → Paragraph Revisions**.

---

## 2 · Entities

**Locate Entities**  
Switch to the **Entity** tab. Click an entity in the sidebar or directly on the PDF to open its detail card.

<figure style="width:55%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Entity_click.PNG"
       alt="Entity selected"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Entity detail card</em></figcaption>
</figure>

**Show All Entities**  
Press **Show All Entities** to highlight every mention inside the current paragraph.

<figure style="width:45%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/show_all_entity.PNG"
       alt="Show all entities"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Batch highlighting</em></figcaption>
</figure>

**Edit or Delete**  
1. Click the **pencil** icon to open the entity editor.  
   <figure style="width:55%;margin:1rem auto;text-align:center;">
     <img src="./src/DocsPage/photos/edit_entity.PNG"
          alt="Entity editor"
          style="width:100%;border:1px solid #ddd;border-radius:6px;" />
     <figcaption><em>Entity editor</em></figcaption>
   </figure>
2. Change the entity type using the dropdown.  
   <img src="./src/DocsPage/photos/change_entity_type.PNG"
        alt="Change entity type"
        style="width:100%;max-width:340px;border:1px solid #ddd;border-radius:6px;margin:0.5rem 0;" />
3. Correct the text by selecting a new span in the paragraph.  
   <img src="./src/DocsPage/photos/change_text_of_entity.PNG"
        alt="Change entity text"
        style="width:100%;max-width:340px;border:1px solid #ddd;border-radius:6px;margin:0.5rem 0;" />
4. Click **Delete** to remove an entity if it is incorrect.

---

## 3 · Relationships

Inside the same editor, open the **Relation** tab to manage links between entities.

<figure style="width:50%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/edit_relation.png"
       alt="Relation tab"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Existing relations</em></figcaption>
</figure>

**Add or Modify Relations**  
1. Click the **＋** icon to create a new relation.  
2. Specify the target entity, relation type, and (optionally) a confidence score.  
   <figure style="width:60%;margin:1rem auto;text-align:center;">
     <img src="./src/DocsPage/photos/add_new_relation.PNG"
          alt="Add relation icon"
          style="width:100%;border:1px solid #ddd;border-radius:6px;" />
     <figcaption><em>Adding a relation</em></figcaption>
   </figure>
3. Confirm the details and save.  
   <figure style="width:60%;margin:1rem auto;text-align:center;">
     <img src="./src/DocsPage/photos/add_new_relation_detail.PNG"
          alt="Relation detail form"
          style="width:100%;border:1px solid #ddd;border-radius:6px;" />
     <figcaption><em>Relation detail form</em></figcaption>
   </figure>

---

## 4 · Commit Changes

When all edits are complete, click **Save & Reload**. The viewer refreshes with updated annotations, and the change log records your session.

Edits are **non‑destructive** until saved, allowing you to experiment freely.  
For batch operations or API‑based updates, see **Advanced Editing** in the main documentation.
