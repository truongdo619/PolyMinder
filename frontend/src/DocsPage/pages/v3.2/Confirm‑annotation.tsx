import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocList,
  DocListItem
} from "../../components/DocComponents";
import img_v3_1_confirm_star_jpeg from "../../photos/v3.1/confirm_star.jpeg";

export const toc = [
  { id: "benefits", title: "Benefits", level: 2 },
  { id: "confirming-an-item", title: "Confirming an Item", level: 2 },
  { id: "un-confirming", title: "Un confirming", level: 2 },
];

export const searchContent = `
# Confirm Annotation

Mark entities or relations as verified to separate reviewed data from items still under inspection.

---

## Benefits  

 Quality assurance   track which annotations have been double checked.  
 Selective export   choose Confirmed Only when downloading results.  
 Team clarity   collaborators instantly see what is done versus pending.

---

## Confirming an Item  

1. Open the entity or relation mode (  icon).  
2. Toggle Confirmed at the top of each item in sidebar.  

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="/src/DocsPage/photos/v3.1/confirmstar.jpeg"
       alt="Sign Up dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Confirm toggle</em></figcaption>
</figure>

3. Click Save & Reload. Confirmed items will show a filled-star icon in the sidebar.

---

## Un confirming  

Need to revisit a decision? Click the filled star again, and Confirm.  
The icon will revert to an empty star, indicating it s back in the review stage.
`;


export default function Confirmannotation() {
  return (
    <Box>
      <DocHeader level={1} id="confirm-annotation">Confirm Annotation</DocHeader>
      <DocText>Mark entities or relations as verified to separate reviewed data from items still under inspection.</DocText>
      <DocHeader level={2} id="benefits">Benefits</DocHeader>
      <DocText>Quality assurance   track which annotations have been double checked.</DocText>
      <DocText>Selective export   choose Confirmed Only when downloading results.</DocText>
      <DocText>Team clarity   collaborators instantly see what is done versus pending.</DocText>
      <DocHeader level={2} id="confirming-an-item">Confirming an Item</DocHeader>
      <DocList>
        <DocListItem>Open the entity or relation mode (  icon).</DocListItem>
        <DocListItem>Toggle Confirmed at the top of each item in sidebar.</DocListItem>
      </DocList>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_confirm_star_jpeg} alt="Sign Up dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Confirm toggle</Box>
      </Box>
      <DocList>
        <DocListItem>Click Save &amp; Reload. Confirmed items will show a filled-star icon in the sidebar.</DocListItem>
      </DocList>
      <DocHeader level={2} id="un-confirming">Un confirming</DocHeader>
      <DocText>Need to revisit a decision? Click the filled star again, and Confirm.</DocText>
      <DocText>The icon will revert to an empty star, indicating it s back in the review stage.</DocText>
    </Box>
  );
}
