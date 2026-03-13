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
import img_documents_header_png from "../../photos/documents_header.png";
import img_documents_page_png from "../../photos/documents_page.png";

export const toc = [
  { id: "open-the-dashboard", title: "Open the Dashboard", level: 2 },
  { id: "key-actions", title: "Key Actions", level: 2 },
];

export const searchContent = `
<!--                                                             -->
# Document Management
PolyMinder s dashboard lets you upload, monitor, and curate all of your PDFs in one place.  
<!--                                                             -->

---

## Open the Dashboard

1. Click Documents on the top toolbar immediately after logging in.  

   <figure style="width:100%;margin:1rem auto;text-align:center;">
     <img src="./src/DocsPage/photos/documentsheader.png" alt="Documents button in header" style="width:100%;border:1px solid #ddd;border-radius:6px;" />
     <figcaption><em>Figure 1   Navigation to the dashboard</em></figcaption>
   </figure>

2. The dashboard appears, listing every PDF you have uploaded along with its processing status.  



## Key Actions

| Action | How to Perform | Result |
|--------|----------------|--------|
| Upload PDF | Click Upload Document and select one or more files. | The files enter the processing queue. |
| View / Refine | Select a document title to open the interactive viewer. | Entities and relations are overlaid for verification and editing. |
| Download Original | Click the <kbd> </kbd> icon next to a file. | Saves the unannotated PDF to your device. |
| Delete | Click the <kbd>  </kbd> icon. | Removes the document and its annotations from the system. |

<figure style="width:100%;margin:1rem auto;text-align:center;">
   <img src="./src/DocsPage/photos/documentspage.png" alt="Document dashboard" style="width:100%;border:1px solid #ddd;border-radius:6px;" />
   <figcaption><em>Figure 2   Dashboard overview</em></figcaption>
</figure>
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Documentmanagement() {
  return (
    <Box>
      <DocHeader level={1} id="document-management">Document Management</DocHeader>
      <DocText>PolyMinder s dashboard lets you upload, monitor, and curate all of your PDFs in one place.</DocText>
      <DocHeader level={2} id="open-the-dashboard">Open the Dashboard</DocHeader>
      <DocList>
        <DocListItem>Click Documents on the top toolbar immediately after logging in.</DocListItem>
      </DocList>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_documents_header_png} alt="Documents button in header" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Navigation to the dashboard</Box>
      </Box>
      <DocList>
        <DocListItem>The dashboard appears, listing every PDF you have uploaded along with its processing status.</DocListItem>
      </DocList>
      <DocHeader level={2} id="key-actions">Key Actions</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Action</th>
            <th style={thStyle}>How to Perform</th>
            <th style={thStyle}>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Upload PDF</td>
            <td style={tdStyle}>Click Upload Document and select one or more files.</td>
            <td style={tdStyle}>The files enter the processing queue.</td>
          </tr>
          <tr>
            <td style={tdStyle}>View / Refine</td>
            <td style={tdStyle}>Select a document title to open the interactive viewer.</td>
            <td style={tdStyle}>Entities and relations are overlaid for verification and editing.</td>
          </tr>
          <tr>
            <td style={tdStyle}>Download Original</td>
            <td style={tdStyle}>Click the &lt;kbd&gt; &lt;/kbd&gt; icon next to a file.</td>
            <td style={tdStyle}>Saves the unannotated PDF to your device.</td>
          </tr>
          <tr>
            <td style={tdStyle}>Delete</td>
            <td style={tdStyle}>Click the &lt;kbd&gt;  &lt;/kbd&gt; icon.</td>
            <td style={tdStyle}>Removes the document and its annotations from the system.</td>
          </tr>
        </tbody>
      </table>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_documents_page_png} alt="Document dashboard" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Dashboard overview</Box>
      </Box>
    </Box>
  );
}
