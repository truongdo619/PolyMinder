import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
} from "../../components/DocComponents";
import img_v3_1_signin_page_png from "../../photos/v3.1/signin_page.png";
import img_v3_1_document_page_png from "../../photos/v3.1/document_page.png";
import img_Result_PNG from "../../photos/Result.PNG";

export const toc = [
  { id: "1-sign-in", title: "1. Sign In", level: 2 },
  { id: "2-end-to-end-annotation-workflow", title: "2. End to End Annotation Workflow", level: 2 },
  { id: "3-manage-your-documents", title: "3. Manage Your Documents", level: 2 },
  { id: "4-refine-annotations", title: "4. Refine Annotations", level: 2 },
];

export const searchContent = `
<!--                                                             -->
# Quick Start Guide
Learn the basics of working with PolyMinder.  
<!--                                                             -->

---

## 1. Sign In
<p style='text-align: justify;'> Open [Sign-in](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signin) page, enter your username and password, and press Sign In.  If you have not have an account, choose [Sign Up](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signup), complete the registration form, and then return to the sign in page. </p>


<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/signinpage.png" alt="PolyMinder sign in screen" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 1   Sign in interface</em></figcaption>
</figure>


## 2. End to End Annotation Workflow

<p style='text-align: justify;'> After signing in, upload a PDF through the web interface. PolyMinder parses the document, runs its NER & RE models, and overlays the predicted entities and relations directly on the original pages. You may then verify or refine each annotation and finally download a clean, fully annotated PDF. </p>


| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Upload one or more PDF files. | Files are queued for processing. |
| 2 | PolyMinder parses each document and runs NER & RE models. | Entities and relations are extracted. |
| 3 | The system overlays predictions on the PDF. | An interactive result page is generated. |
| 4 | You verify / refine annotations and download the final PDF. | Clean, high quality annotations are saved. |

---

## 3. Manage Your Documents

<p style='text-align: justify;'> Click Documents in the top toolbar to open the management console. This view shows every file you have uploaded, its current processing status, and options to rename, delete, or download the annotated result. </p>

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/documentpage.png" alt="Document management page" style="width:100%;" />
  <figcaption><em>Figure 3   Document management console</em></figcaption>
</figure>

---

## 4. Refine Annotations

<p style='text-align: justify;'> Select any processed document to launch the interactive result viewer. Inline editing tools allow you to correct or add entities and relations; changes are saved automatically. </p>

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Result.PNG" alt="Result viewer with inline editing" style="width:100%;" />
  <figcaption><em>Figure 4   Interactive result viewer</em></figcaption>
</figure>
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Quickstart() {
  return (
    <Box>
      <DocHeader level={1} id="quick-start-guide">Quick Start Guide</DocHeader>
      <DocText>Learn the basics of working with PolyMinder.</DocText>
      <DocHeader level={2} id="1-sign-in">1. Sign In</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_signin_page_png} alt="PolyMinder sign in screen" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Sign in interface</Box>
      </Box>
      <DocHeader level={2} id="2-end-to-end-annotation-workflow">2. End to End Annotation Workflow</DocHeader>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Step</th>
            <th style={thStyle}>Action</th>
            <th style={thStyle}>System Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>1</td>
            <td style={tdStyle}>Upload one or more PDF files.</td>
            <td style={tdStyle}>Files are queued for processing.</td>
          </tr>
          <tr>
            <td style={tdStyle}>2</td>
            <td style={tdStyle}>PolyMinder parses each document and runs NER &amp; RE models.</td>
            <td style={tdStyle}>Entities and relations are extracted.</td>
          </tr>
          <tr>
            <td style={tdStyle}>3</td>
            <td style={tdStyle}>The system overlays predictions on the PDF.</td>
            <td style={tdStyle}>An interactive result page is generated.</td>
          </tr>
          <tr>
            <td style={tdStyle}>4</td>
            <td style={tdStyle}>You verify / refine annotations and download the final PDF.</td>
            <td style={tdStyle}>Clean, high quality annotations are saved.</td>
          </tr>
        </tbody>
      </table>
      <DocHeader level={2} id="3-manage-your-documents">3. Manage Your Documents</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_document_page_png} alt="Document management page" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 3   Document management console</Box>
      </Box>
      <DocHeader level={2} id="4-refine-annotations">4. Refine Annotations</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_Result_PNG} alt="Result viewer with inline editing" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 4   Interactive result viewer</Box>
      </Box>
    </Box>
  );
}
