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
import img_v3_1_filter_entity_jpeg from "../../photos/v3.1/filter_entity.jpeg";
import img_v3_1_filter_icon_jpeg from "../../photos/v3.1/filter_icon.jpeg";
import img_filter_dialog_png from "../../photos/filter_dialog.png";

export const toc = [
  { id: "1-quick-entity-filter", title: "1. Quick Entity Filter", level: 2 },
  { id: "2-advanced-filter-dialog", title: "2. Advanced Filter Dialog", level: 2 },
  { id: "3-resetting-filters", title: "3. Resetting Filters", level: 2 },
  { id: "why-filter", title: "Why Filter?", level: 3 },
];

export const searchContent = `
<!--                                                             -->
# Filtering Results
Focus on the information you need by limiting the viewer to a subset of entities or relations.  
<!--                                                             -->

---

## 1. Quick Entity Filter

Click any entity type in the setting bar. The PDF instantly refreshes to display only that category.

<figure style="width:100%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/filterentity.jpeg"
       alt="Entity list in the sidebar"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Entity categories in the sidebar</em></figcaption>
</figure>

---

## 2. Advanced Filter Dialog

Need more granular control? Use the filter toolbar icon.

<figure style="width:100%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/filtericon.jpeg"
       alt="Filter icon in toolbar"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2   Filter icon in the PDF toolbar</em></figcaption>
</figure>

Clicking the icon opens a dialog where you can:

| Option | Description |
|--------|-------------|
| Entity Type | Choose one or more entity categories (e.g., Polymer, Propname, Condition). |
| Relation Type | Restrict to specific relationships (e.g., hasproperty, hascondition). |


<figure style="width:55%;margin:1rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/filterdialog.png"
       alt="Advanced filter dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 3   Advanced filter dialog</em></figcaption>
</figure>

Press Apply to update the viewer; the active filter badge in the toolbar shows the number of rules currently in effect.

---

## 3. Resetting Filters

Click the All Entity Types button in the sidebar to clear all filters and return to the full annotation view.

---

### Why Filter?

 Reduce visual clutter when working with densely annotated pages.  
 Speed up validation by isolating one entity class at a time.  
 Spot model errors quickly e.g., filter to Propname entities to check unit consistency.  

Filtering is non destructive: it only changes what you see, never the underlying annotations.
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Filteringfunction() {
  return (
    <Box>
      <DocHeader level={1} id="filtering-results">Filtering Results</DocHeader>
      <DocText>Focus on the information you need by limiting the viewer to a subset of entities or relations.</DocText>
      <DocHeader level={2} id="1-quick-entity-filter">1. Quick Entity Filter</DocHeader>
      <DocText>Click any entity type in the setting bar. The PDF instantly refreshes to display only that category.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_filter_entity_jpeg} alt="Entity list in the sidebar" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Entity categories in the sidebar</Box>
      </Box>
      <DocHeader level={2} id="2-advanced-filter-dialog">2. Advanced Filter Dialog</DocHeader>
      <DocText>Need more granular control? Use the filter toolbar icon.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_filter_icon_jpeg} alt="Filter icon in toolbar" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Filter icon in the PDF toolbar</Box>
      </Box>
      <DocText>Clicking the icon opens a dialog where you can:</DocText>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Option</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Entity Type</td>
            <td style={tdStyle}>Choose one or more entity categories (e.g., Polymer, Propname, Condition).</td>
          </tr>
          <tr>
            <td style={tdStyle}>Relation Type</td>
            <td style={tdStyle}>Restrict to specific relationships (e.g., hasproperty, hascondition).</td>
          </tr>
        </tbody>
      </table>
      <Box sx={{ width: "55%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_filter_dialog_png} alt="Advanced filter dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 3   Advanced filter dialog</Box>
      </Box>
      <DocText>Press Apply to update the viewer; the active filter badge in the toolbar shows the number of rules currently in effect.</DocText>
      <DocHeader level={2} id="3-resetting-filters">3. Resetting Filters</DocHeader>
      <DocText>Click the All Entity Types button in the sidebar to clear all filters and return to the full annotation view.</DocText>
      <DocHeader level={3} id="why-filter">Why Filter?</DocHeader>
      <DocText>Reduce visual clutter when working with densely annotated pages.</DocText>
      <DocText>Speed up validation by isolating one entity class at a time.</DocText>
      <DocText>Spot model errors quickly e.g., filter to Propname entities to check unit consistency.</DocText>
      <DocText>Filtering is non destructive: it only changes what you see, never the underlying annotations.</DocText>
    </Box>
  );
}
