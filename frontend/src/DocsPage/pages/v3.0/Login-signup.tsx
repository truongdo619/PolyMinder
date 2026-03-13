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
import img_Sign_in_header_png from "../../photos/Sign_in_header.png";
import img_Sign_in_png from "../../photos/Sign_in.png";
import img_Sign_up_header_png from "../../photos/Sign_up_header.png";
import img_Sign_up_png from "../../photos/Sign_up.png";

export const toc = [
  { id: "log-in", title: "Log In", level: 2 },
  { id: "sign-up", title: "Sign Up", level: 2 },
];

export const searchContent = `
<!--                                                             -->
# Login & Sign Up
A PolyMinder account is required to access the system s annotation tools. Choose [Login](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signin) if you already have credentials, or [Sign Up](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signup) to create a new profile.
<!--                                                             -->

---

## Log In

Click Sign In on the top right of the homepage. A dialog appears where you can enter your e mail address and password, then press Log In to open your dashboard.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Signinheader.png"
       alt="Log In button on the homepage"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Log In button in the header</em></figcaption>
</figure>

<figure style="width:75%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Signin.png"
       alt="Log In dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2   Log In dialog</em></figcaption>
</figure>

---

## Sign Up

If you are a new user, click Sign Up in the same header area. Fill in the requested information e mail, password, and password confirmation then click Sign Up. Your account is created immediately and you will be redirected to the Log In screen.

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Signupheader.png"
       alt="Sign Up button on the homepage"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 3   Sign Up button in the header</em></figcaption>
</figure>

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Signup.png"
       alt="Sign Up dialog"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 4   Sign Up dialog</em></figcaption>
</figure>
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Loginsignup() {
  return (
    <Box>
      <DocHeader level={1} id="login-sign-up">Login &amp; Sign Up</DocHeader>
      <DocText>A PolyMinder account is required to access the system s annotation tools. Choose <DocLink href="https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signin">Login</DocLink> if you already have credentials, or <DocLink href="https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signup">Sign Up</DocLink> to create a new profile.</DocText>
      <DocHeader level={2} id="log-in">Log In</DocHeader>
      <DocText>Click Sign In on the top right of the homepage. A dialog appears where you can enter your e mail address and password, then press Log In to open your dashboard.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_Sign_in_header_png} alt="Log In button on the homepage" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Log In button in the header</Box>
      </Box>
      <Box sx={{ width: "75%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_Sign_in_png} alt="Log In dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Log In dialog</Box>
      </Box>
      <DocHeader level={2} id="sign-up">Sign Up</DocHeader>
      <DocText>If you are a new user, click Sign Up in the same header area. Fill in the requested information e mail, password, and password confirmation then click Sign Up. Your account is created immediately and you will be redirected to the Log In screen.</DocText>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_Sign_up_header_png} alt="Sign Up button on the homepage" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 3   Sign Up button in the header</Box>
      </Box>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_Sign_up_png} alt="Sign Up dialog" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 4   Sign Up dialog</Box>
      </Box>
    </Box>
  );
}
