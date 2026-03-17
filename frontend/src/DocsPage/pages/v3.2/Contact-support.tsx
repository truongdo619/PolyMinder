import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink,
  DocCallout
} from "../../components/DocComponents";
import img_v3_1_contact_support_png from "../../photos/v3.1/contact_support.png";

export const toc = [
  { id: "1-open-the-contact-form", title: "1. Open the Contact Form", level: 2 },
  { id: "2-fill-out-the-form", title: "2. Fill Out the Form", level: 2 },
  { id: "3-send-the-message", title: "3. Send the Message", level: 2 },
  { id: "4-alternative-contact-methods", title: "4. Alternative Contact Methods", level: 2 },
];

export const searchContent = `
# Contact Support

Have a question, found a bug, or need advice on using PolyMinder?  
Send us a message directly from the web app.

---

## 1. Open the Contact Form  

Click [Contact Support](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/support) in the main navigation bar to reach the support page.

---

## 2. Fill Out the Form  

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/contactsupport.png"
       alt="Contact Support form"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Contact Support page</em></figcaption>
</figure>

| Field | Description |
|-------|-------------|
| Your Name  | Enter the name you d like us to address you by. |
| Your Email Address  | Provide a valid address so we can reply. |
| How can we help?  | Describe your question, issue, or feedback. Include steps to reproduce bugs, file IDs, or screenshots if relevant. |

All fields marked with an asterisk () are required.

---

## 3. Send the Message  

Click Send Message.  
A confirmation banner appears, and the support team receives your request instantly.

> Response Time  
> We aim to reply within one business day. During peak periods it may take a little longer, but every ticket is answered in the order received.

---

## 4. Alternative Contact Methods  

If the form is unavailable, you can reach us via: truongdo[at]jaist.ac.jp


Thank you for helping us improve PolyMinder!
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Contactsupport() {
  return (
    <Box>
      <DocHeader level={1} id="contact-support">Contact Support</DocHeader>
      <DocText>Have a question, found a bug, or need advice on using PolyMinder?</DocText>
      <DocText>Send us a message directly from the web app.</DocText>
      <DocHeader level={2} id="1-open-the-contact-form">1. Open the Contact Form</DocHeader>
      <DocText>Click <DocLink href="https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/#/support">Contact Support</DocLink> in the main navigation bar to reach the support page.</DocText>
      <DocHeader level={2} id="2-fill-out-the-form">2. Fill Out the Form</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_contact_support_png} alt="Contact Support form" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Contact Support page</Box>
      </Box>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Field</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Your Name</td>
            <td style={tdStyle}>Enter the name you d like us to address you by.</td>
          </tr>
          <tr>
            <td style={tdStyle}>Your Email Address</td>
            <td style={tdStyle}>Provide a valid address so we can reply.</td>
          </tr>
          <tr>
            <td style={tdStyle}>How can we help?</td>
            <td style={tdStyle}>Describe your question, issue, or feedback. Include steps to reproduce bugs, file IDs, or screenshots if relevant.</td>
          </tr>
        </tbody>
      </table>
      <DocText>All fields marked with an asterisk () are required.</DocText>
      <DocHeader level={2} id="3-send-the-message">3. Send the Message</DocHeader>
      <DocText>Click Send Message.</DocText>
      <DocText>A confirmation banner appears, and the support team receives your request instantly.</DocText>
      <DocCallout type="info">Response Time</DocCallout>
      <DocCallout type="info">We aim to reply within one business day. During peak periods it may take a little longer, but every ticket is answered in the order received.</DocCallout>
      <DocHeader level={2} id="4-alternative-contact-methods">4. Alternative Contact Methods</DocHeader>
      <DocText>If the form is unavailable, you can reach us via: truongdo[at]jaist.ac.jp</DocText>
      <DocText>Thank you for helping us improve PolyMinder!</DocText>
    </Box>
  );
}
