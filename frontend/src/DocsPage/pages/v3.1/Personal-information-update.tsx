import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocList,
  DocListItem,
  DocCallout
} from "../../components/DocComponents";
import img_v3_1_personal_info_update_png from "../../photos/v3.1/personal_info_update.png";
import img_v3_1_update_password_png from "../../photos/v3.1/update_password.png";

export const toc = [
  { id: "1-accessing-your-profile-settings", title: "1. Accessing Your Profile Settings", level: 2 },
  { id: "2-editing-personal-information", title: "2. Editing Personal Information", level: 2 },
  { id: "3-changing-your-password", title: "3. Changing Your Password", level: 2 },
  { id: "4-troubleshooting", title: "4. Troubleshooting", level: 2 },
];

export const searchContent = `
# Personal Information Update

This guide shows you how to update the profile details stored in PolyMinder and how to change your account password.

---

## 1. Accessing Your Profile Settings  

1. Click your avatar (top right corner) and choose Profile from the dropdown.  
2. The profile page opens with a two tab layout:
   - Personal Information (default)  
   - Password

---

## 2. Editing Personal Information  

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/personalinfoupdate.png"
       alt="Personal information form"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 1   Personal information form</em></figcaption>
</figure>

1. Ensure Personal Information is selected in the left sidebar.  
2. Update any field:
   - Username (read only in most installations)  
   - Full Name  
   - Email  
   - Address  
   - Workplace  
   - Phone
3. Click Save. A toast message confirms that your changes are stored.

> Note: Some organisations lock certain fields (e.g., Username) for compliance reasons.  
> If a field is greyed out, contact an administrator to request a change.

---

## 3. Changing Your Password  

<figure style="width:100%;margin:1.25rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/updatepassword.png"
       alt="Password update form"
       style="width:100%;border:1px solid #ddd;border-radius:6px;" />
  <figcaption><em>Figure 2   Password change form</em></figcaption>
</figure>


1. Click Password in the left sidebar to switch tabs.  
2. Enter your Current Password.  
3. Type a New Password that meets the security policy.  
4. Re enter the new password in Confirm New Password.  
5. Click Update Password. A confirmation banner appears if the operation is successful.

> Password Tips  
>  Use at least 8 characters (12+ recommended).  
>  Combine upper  and lowercase letters, digits, and symbols.  
>  Avoid dictionary words and personal information.

<!-- ---

## 4. Troubleshooting  

 Forgot your current password?  
  Click Forgot Password on the login screen to receive a reset link.

 Save button disabled?  
  Make sure required fields (marked with ) are filled out.

 Email already in use?  
  The system prevents duplicate addresses. Choose another or contact support. -->
`;


export default function Personalinformationupdate() {
  return (
    <Box>
      <DocHeader level={1} id="personal-information-update">Personal Information Update</DocHeader>
      <DocText>This guide shows you how to update the profile details stored in PolyMinder and how to change your account password.</DocText>
      <DocHeader level={2} id="1-accessing-your-profile-settings">1. Accessing Your Profile Settings</DocHeader>
      <DocList>
        <DocListItem>Click your avatar (top right corner) and choose Profile from the dropdown.</DocListItem>
        <DocListItem>The profile page opens with a two tab layout:</DocListItem>
        <DocListItem>Personal Information (default)</DocListItem>
        <DocListItem>Password</DocListItem>
      </DocList>
      <DocHeader level={2} id="2-editing-personal-information">2. Editing Personal Information</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_personal_info_update_png} alt="Personal information form" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 1   Personal information form</Box>
      </Box>
      <DocList>
        <DocListItem>Ensure Personal Information is selected in the left sidebar.</DocListItem>
        <DocListItem>Update any field:</DocListItem>
        <DocListItem>Username (read only in most installations)</DocListItem>
        <DocListItem>Full Name</DocListItem>
        <DocListItem>Email</DocListItem>
        <DocListItem>Address</DocListItem>
        <DocListItem>Workplace</DocListItem>
        <DocListItem>Phone</DocListItem>
        <DocListItem>Click Save. A toast message confirms that your changes are stored.</DocListItem>
      </DocList>
      <DocCallout type="info">Note: Some organisations lock certain fields (e.g., Username) for compliance reasons.</DocCallout>
      <DocCallout type="info">If a field is greyed out, contact an administrator to request a change.</DocCallout>
      <DocHeader level={2} id="3-changing-your-password">3. Changing Your Password</DocHeader>
      <Box sx={{ width: "100%", margin: "1.25rem auto", textAlign: "center" }}>
        <img src={img_v3_1_update_password_png} alt="Password update form" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />
        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>Figure 2   Password change form</Box>
      </Box>
      <DocList>
        <DocListItem>Click Password in the left sidebar to switch tabs.</DocListItem>
        <DocListItem>Enter your Current Password.</DocListItem>
        <DocListItem>Type a New Password that meets the security policy.</DocListItem>
        <DocListItem>Re enter the new password in Confirm New Password.</DocListItem>
        <DocListItem>Click Update Password. A confirmation banner appears if the operation is successful.</DocListItem>
      </DocList>
      <DocCallout type="info">Password Tips</DocCallout>
      <DocCallout type="info">Use at least 8 characters (12+ recommended).</DocCallout>
      <DocCallout type="info">Combine upper  and lowercase letters, digits, and symbols.</DocCallout>
      <DocCallout type="info">Avoid dictionary words and personal information.</DocCallout>
      <DocHeader level={2} id="4-troubleshooting">4. Troubleshooting</DocHeader>
      <DocText>Forgot your current password?</DocText>
      <DocText>Click Forgot Password on the login screen to receive a reset link.</DocText>
      <DocText>Save button disabled?</DocText>
      <DocText>Make sure required fields (marked with ) are filled out.</DocText>
      <DocText>Email already in use?</DocText>
      <DocText>The system prevents duplicate addresses. Choose another or contact support. --&gt;</DocText>
    </Box>
  );
}
