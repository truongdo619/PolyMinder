# User Manual – v2.0

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. Features](#2-features)  
  • [2.1 PDF Upload & Processing](#21-pdf-upload--processing)  
  • [2.2 Paragraph & Entity Editing](#22-paragraph--entity-editing)
- [3. Contact Support](#3-contact-support)

---

## 1. Introduction <a id="1-introduction"></a>

Welcome to the **Material Science** user manual.  
This guide walks you through installation, configuration, and efficient use of the software.

---

## 2. Features <a id="2-features"></a>

### 2.1 PDF Upload & Processing <a id="21-pdf-upload--processing"></a>

Users can upload PDF files for automatic **Named Entity Recognition (NER)** and **Relation Extraction**.  
The system analyses the document and labels entities plus their relationships.

#### How to Upload a PDF
1. Navigate to the **Dashboard** after logging in.  
   <img src="./src/DocsPage/photos/dashboard.PNG"
        alt="Dashboard"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
2. In the **Upload** section, click **Upload PDF**.  
3. Select a PDF from your local machine.  
   <img src="./src/DocsPage/photos/choose_file.PNG"
        alt="Choose file"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
4. After upload, the system processes the file and extracts entities and relations.  
   <img src="./src/DocsPage/photos/Result.PNG"
        alt="Extraction result"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />

---

### 2.2 Paragraph & Entity Editing <a id="22-paragraph--entity-editing"></a>

After processing, you can refine extracted text, entities, and relationships.

#### Editing Extracted Text
1. Open **Paragraph Viewer** by clicking **Paragraph** on the right‑hand sidebar.  
   <img src="./src/DocsPage/photos/Paragraph_view.PNG"
        alt="Paragraph Viewer"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
2. Click any highlighted area in the PDF to preview its paragraph.  
   <img src="./src/DocsPage/photos/Paragraph_click.PNG"
        alt="Select paragraph"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
3. Press the **edit** icon to open the editor, adjust content, and save.  
   <img src="./src/DocsPage/photos/para_edit_instruct.png"
        alt="Edit button"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />  
   <img src="./src/DocsPage/photos/Paragraph_edit.PNG"
        alt="Edit dialog"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
4. Use **Download JSON** to export the current paragraph.  
5. Click **Save & Load** to apply changes.

#### Editing Named Entities & Relationships
1. Switch to **Entity Viewer** via the **Entity** button on the sidebar.  
2. Click a highlight in the PDF or an entity card to open its details.  
   <img src="./src/DocsPage/photos/Entity_click.PNG"
        alt="Entity detail"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
3. **SHOW ALL ENTITIES** reveals every entity in the current paragraph.  
   <img src="./src/DocsPage/photos/show_all_entity.PNG"
        alt="Show all entities"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
4. **Download JSON** exports the selected entity’s data.  
   <img src="./src/DocsPage/photos/downloadJSON_entity.PNG"
        alt="Download JSON"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
5. Press the **edit** icon to modify type, text, or relations.  
   <img src="./src/DocsPage/photos/edit_open_instruct.PNG"
        alt="Open entity editor"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />  
   <img src="./src/DocsPage/photos/edit_entity.PNG"
        alt="Entity editor"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
6. Change entity type from the dropdown.  
   <img src="./src/DocsPage/photos/change_entity_type.PNG"
        alt="Change type"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
7. Adjust the entity span by selecting new text in the paragraph.  
   <img src="./src/DocsPage/photos/change_text_of_entity.PNG"
        alt="Change span"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
8. Click **DELETE** to remove an entity (irreversible).  
9. Open the **RELATION** tab to manage links.  
   <img src="./src/DocsPage/photos/edit_relation.png"
        alt="Relation tab"
        style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
10. Click **＋** to add a relation.  
    <img src="./src/DocsPage/photos/add_new_relation.PNG"
         alt="Add relation"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />  
    <img src="./src/DocsPage/photos/add_new_relation_detail.PNG"
         alt="Relation details"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
11. Choose a **Relation Type** and **Object Entity**.  
    <img src="./src/DocsPage/photos/add_relation_type.PNG"
         alt="Relation type list"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />  
    <img src="./src/DocsPage/photos/add_relation_object.PNG"
         alt="Object entity list"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
12. Press **ADD** to save the new relation.  
    <img src="./src/DocsPage/photos/finish_add_relation.PNG"
         alt="Add relation result"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />  
    <img src="./src/DocsPage/photos/add_relation_result.PNG"
         alt="Relation added"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
13. Edit or delete existing relations as needed.  
    <img src="./src/DocsPage/photos/delete_relation.PNG"
         alt="Delete relation"
         style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />
14. Click **SAVE & RELOAD** to commit changes.

> **Note:** The **DOWNLOAD RESULT** button exports the entire document in multiple formats, always reflecting your latest edits.  
> <img src="./src/DocsPage/photos/download_button.PNG"
>      alt="Download result"
>      style="display:block;margin:1rem auto;width:75%;max-width:600px;border:1px solid #ddd;border-radius:6px;" />

---

## 3. Contact Support <a id="3-contact-support"></a>

Need assistance? Reach out to our support team:

- **Email:** truongdo@jaist.ac.jp
