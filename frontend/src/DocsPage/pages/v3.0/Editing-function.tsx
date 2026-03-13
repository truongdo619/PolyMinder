import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink,
  DocList,
  DocListItem,
  DocInlineCode,
  DocCodeBlock,
  DocCallout
} from "../../components/DocComponents";
import img_v3_1_add_entity_jpeg from "../../photos/v3.1/add_entity.jpeg";
import img_v3_1_edit_entity_png from "../../photos/v3.1/edit_entity.png";
import img_change_entity_type_PNG from "../../photos/change_entity_type.PNG";
import img_change_text_of_entity_PNG from "../../photos/change_text_of_entity.PNG";
import img_v3_1_add_new_relation_png from "../../photos/v3.1/add_new_relation.png";
import img_v3_1_add_new_relation_detail_png from "../../photos/v3.1/add_new_relation_detail.png";
import img_v3_1_edit_relation_png from "../../photos/v3.1/edit_relation.png";
import img_v3_1_text_edit_dialog_jpeg from "../../photos/v3.1/text_edit_dialog.jpeg";

export const toc = [
  { id: "1-entities", title: "1. Entities", level: 2 },
  { id: "2-relations", title: "2. Relations", level: 2 },
  { id: "3-paragraph-text", title: "3. Paragraph Text", level: 2 },
];

export const searchContent = `
<!--                                                             -->
# Editing Annotations
PolyMinder allows you to correct every paragraph, entity, and relation without leaving the PDF viewer.  
<!--                                                             -->

## 1. Entities

Create an entity: Highlight the desired text directly in the PDF and click Add Highlight.

<figure style="width:100%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/addentity.jpeg" alt="Entity editor" style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Creating a new entity</em></figcaption>
</figure>

Modify an entity: Hit the pencil icon to open the entity editor.

<figure style="width:100%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/editentity.png"
       alt="Entity editor"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2   Edit entity control</em></figcaption>
</figure>

Choose a different category from the drop down list.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/changeentitytype.PNG"
       alt="Entity editor"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 3   Selecting a new entity category</em></figcaption>
</figure>

Update the entity text by selecting a new span in the paragraph.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/changetextofentity.PNG"
       alt="Entity editor"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 4   Replacing the entity span</em></figcaption>
</figure>

Remove an entity: Click Delete in the editor dialog to discard an incorrect entity.

---

## 2. Relations

Create a relation: In the editor, switch to the Relation tab and press   to define a new link.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/addnewrelation.png"
       alt="Add relation icon"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 5   Creating a relation</em></figcaption>
</figure>

Specify the source, target, and relation type, then click Save & Reload.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/addnewrelationdetail.png"
       alt="Relation detail form"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 6   Relation details form</em></figcaption>
</figure>

Edit a relation: Click the relation label (e.g., hasproperty), choose the correct type from the list, and save.

<figure style="width:75%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/editrelation.png"
       alt="Edit relation icon"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 7   Revising an existing relation</em></figcaption>
</figure>

Delete a relation: Use the <kbd>  </kbd> icon in the editor to remove an invalid link, then click Save & Reload.

---

## 3. Paragraph Text

Edit paragraph content: Open the Paragraph tab, select the pencil icon beside the paragraph you wish to change, adjust the text, and press Save & Reload.

<figure style="width:100%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/texteditdialog.jpeg"
       alt="Edit instruction"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 8   Paragraph editor dialog</em></figcaption>
</figure>
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Editingfunction() {
  return (
    <Box>
      <DocHeader level={1} id="editing-annotations">Editing Annotations</DocHeader>
      <DocText>PolyMinder allows you to correct every paragraph, entity, and relation without leaving the PDF viewer.</DocText>
      <DocHeader level={2} id="1-entities">1. Entities</DocHeader>
      <DocText>Create an entity: Highlight the desired text directly in the PDF and click Add Highlight.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_add_entity_jpeg} alt="Entity editor" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Creating a new entity</Box>
      </Box>
      <DocText>Modify an entity: Hit the pencil icon to open the entity editor.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_edit_entity_png} alt="Entity editor" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Edit entity control</Box>
      </Box>
      <DocText>Choose a different category from the drop down list.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_change_entity_type_PNG} alt="Entity editor" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 3   Selecting a new entity category</Box>
      </Box>
      <DocText>Update the entity text by selecting a new span in the paragraph.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_change_text_of_entity_PNG} alt="Entity editor" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 4   Replacing the entity span</Box>
      </Box>
      <DocText>Remove an entity: Click Delete in the editor dialog to discard an incorrect entity.</DocText>
      <DocHeader level={2} id="2-relations">2. Relations</DocHeader>
      <DocText>Create a relation: In the editor, switch to the Relation tab and press   to define a new link.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_add_new_relation_png} alt="Add relation icon" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 5   Creating a relation</Box>
      </Box>
      <DocText>Specify the source, target, and relation type, then click Save &amp; Reload.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_add_new_relation_detail_png} alt="Relation detail form" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 6   Relation details form</Box>
      </Box>
      <DocText>Edit a relation: Click the relation label (e.g., hasproperty), choose the correct type from the list, and save.</DocText>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_edit_relation_png} alt="Edit relation icon" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 7   Revising an existing relation</Box>
      </Box>
      <DocText>Delete a relation: Use the &lt;kbd&gt;  &lt;/kbd&gt; icon in the editor to remove an invalid link, then click Save &amp; Reload.</DocText>
      <DocHeader level={2} id="3-paragraph-text">3. Paragraph Text</DocHeader>
      <DocText>Edit paragraph content: Open the Paragraph tab, select the pencil icon beside the paragraph you wish to change, adjust the text, and press Save &amp; Reload.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_text_edit_dialog_jpeg} alt="Edit instruction" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 8   Paragraph editor dialog</Box>
      </Box>
    </Box>
  );
}
