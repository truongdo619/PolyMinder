
<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    background-color: #f5f5f5;
    font-size: 18px;
    color: #2c3e50;  /* Darker text color for better readability */
  }
  
  .content {
    max-width: 80vw;  /* Limit content width for better readability */
    margin: 0 auto;  /* Center content horizontally */
    padding: 20px;
    background-color: white;  /* Add a background for contrast */
    box-shadow: 0 0 10px rgba(0,0,0,0.1);  /* Subtle shadow for focus */
    border-radius: 8px;  /* Rounded corners for better aesthetics */
  }

  h1, h2, h3 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
  }
  
  h1 {
    font-size: 3em;
    margin-top: 0;
  }
  
  h2 {
    font-size: 2.5em;
  }
  
  h3 {
    font-size: 2em;
  }
  
  p {
    color: #34495e;
    font-size: 1.3em;
    margin-bottom: 20px;
  }
  
  ul {
    margin: 20px;
    padding-left: 40px;
  }
  
  li {
    margin-bottom: 10px;
    font-size: 1.2em;
  }

  a {
    color: #3498db;
    text-decoration: none;
    font-size: 1.2em;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  
  table th, table td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
    font-size: 1.2em;
  }
  
  table th {
    background-color: #3498db;
    color: white;
  }

  button {
    background-color: #3498db;
    color: white;
    padding: 15px 25px;
    border: none;
    cursor: pointer;
    font-size: 1.3em;
  }

  button:hover {
    background-color: #2980b9;
  }
</style>

<div class="content">

# User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Contact Support](#contact-support)

---

## 1. Introduction
Welcome to the **[Your Software Name]** user manual. This guide will help you install, configure, and use the software efficiently.



## 2. Features
### 2.1 Sign up and Login
#### How to Sign Up for an Account
1. Navigate to the **Sign Up** page. You can find this by clicking the **Sign Up** button on the homepage.

   ![Sign Up Button](./photos/signup_button.PNG)

2. Fill in the required fields:
   - **Full Name**: Enter your full name.
   - **Email Address**: Provide a valid email address. 
   - **Password**: Choose a secure password that meets the system's requirements (e.g., minimum 8 characters, includes uppercase letters, numbers, and special characters).
   - **Confirm Password**: Fill in your password once again for verification. 
   ![Sign Up Form](./photos/signup_form.PNG)

3. Click on the **Sign Up** button to submit your information.

4. Check your email for a confirmation link. Click the link to verify your account and complete the sign-up process.

   ![Email Confirmation](./photos/email_confirmation.PNG)

---

#### How to Log In
1. Navigate to the **Login** page by clicking the **Login** button on the homepage.

   ![Login Button](./photos/login_button.PNG)

2. Enter your **Email Address** and **Password** into the respective fields.

   ![Login Form](./photos/login_form.PNG)

3. Click the **Login** button to access your account.

4. If you forget your password, click on the **Forgot Password** link below the login form. Follow the instructions sent to your email to reset your password.

   ![Forgot Password](./photos/forgot_password.PNG)

---

#### Troubleshooting Sign-Up and Login Issues
- **Invalid Email**: Ensure your email address is correctly formatted and active.
- **Password Requirements**: Confirm your password meets the system's security requirements.
- **Account Not Verified**: If your account hasn’t been verified, check your email for the confirmation link or request a new one.
- **Forgot Password**: Use the **Forgot Password** option to reset your password if necessary.
- For additional assistance, contact our support team via the **Contact Support** section.

---

### 2.2 Using the Document Management Page

After logging in, you will be directed to the **Document Management** page, where you can manage all uploaded documents. Below is a guide on how to use this page effectively:

---

#### Features of the Document Management Page

1. **Viewing Uploaded Documents**:
   - The table displays all the documents you have uploaded.
   - Columns include:
     - **ID**: Unique identifier for the document.
     - **File Name**: Name of the uploaded file.
     - **Uploaded Time**: The timestamp when the document was uploaded.
     - **# Pages**: Total pages in the document.
     - **# Entities**: Number of entities extracted from the document.
     - **# Relations**: Number of relationships extracted.
     - **Status**: Current processing status of the document (e.g., Completed, In Progress, or Error).

2. **Navigating to Document Details**:
   - To view detailed information about a document, click on the **File Name**. This will redirect you to the **Detail View** page, where you can access the full content and analysis of the document.

3. **Downloading a Document**:
   - Click on the **Download** button (📥) in the **Actions** column to download the processed document and its results.

4. **Printing a Document**:
   - Click on the **Print** button (🖨️) to print the document directly from the browser.

5. **Deleting a Document**:
   - Click on the **Delete** button (🗑️) to permanently remove a document from the system.
     - **Warning**: Deletion is irreversible. Ensure you download any necessary files before proceeding.

6. **Searching for Documents**:
   - Use the **Search** bar above the table to quickly find a specific document by typing its name, ID, or other attributes.

7. **Filtering Documents**:
   - Use the **Filter** button (⚙️) to filter the displayed documents based on:
     - Status (e.g., Completed, In Progress).
     - Date uploaded.
     - Number of pages, entities, or relations.

8. **Sorting Documents**:
   - Click on the column headers (e.g., **ID**, **File Name**, **Uploaded Time**) to sort documents in ascending or descending order based on that attribute.

---

#### Additional Notes:
- By default, the page displays 10 documents per view. You can change the number of displayed rows using the **Rows per page** dropdown at the bottom-right corner of the table.
- Use the pagination controls (arrows at the bottom) to navigate between pages of documents.

This intuitive interface ensures that you can manage your uploaded documents with ease and efficiency.


### 2.3 PDF Upload and Processing
Users can upload PDF files into the system for automatic **Named Entity Recognition (NER)** and **Relation Extraction**. The system will analyze the document and label entities and their relationships within the text.

#### How to Upload a PDF:
1. Navigate to the **Dashboard** after accessing to system.

![Dashboard of system](./photos/dashboard.PNG)

2. In the **Upload** section of the dashboard, click on the **Upload PDF** button.

3. Select your PDF file from your local system.

![Upload the PDF files](./photos/choose_file.PNG)

4. Once uploaded, the system will begin processing the file and extract the entities and relationships.

![The result of extracting process](./photos/Result.PNG)

### 2.4 Paragraphs and Entities Editing Function
After the system processes the uploaded PDF and extracts entities and relations, users can edit the extracted text, entities, and relationships.

#### Editing Extracted Text:
1. Go to the **Paragraph Viewer** section by choosing the **Paragraph** button on the top of the most right sidebar. The extracted text area will be hightlighted on the PDF file and the list of paragraphs extracted from the PDF file will be displayed on the right sidebar.

![Paragraph Viewer](./photos/Paragraph_view.PNG)

2. Click on any parts of the hightlighted areas to check the content inside that paragraph.

![Check the content of a paragraph](./photos/Paragraph_click.PNG)

3. To edit the text of the paragraph, Click on the edit button in the corner of paragraph panel to open the editting window and start edit the content of the paragraph. 

![Click on the edit button to edit the content of the paragraph](./photos/para_edit_instruct.png)

![Paragraph editing window](./photos/Paragraph_edit.PNG)

4. Click the button **Download JSON** to download the information of the current paragraph under JSON format.

5. Save changes by clicking the **Save & load** button.

#### Editing Named Entities and Relationship:
1. In the **Entity Viewer**, the system will display a list of recognized entities, go to the **Entity Viewer** section by choosing the **Entity** button on the top of the most right sidebar .

2. To see the detailed information of an entity, click on the highlighted area on the PDF viewer or click on the entity panel in the list of entity shown on the right sidebar. The detail window will show up and the screen will be scrolled to the position of the entity in the document and the entity in the list will be highlighted. 

![Check the detailed information of an entity](./photos/Entity_click.PNG)

3. The button **SHOW ALL ENTITIES** will visualize all the entities in the same paragraph that contain the current entity.

![Show all entity](./photos/show_all_entity.PNG)

4. Click the button **Download JSON** to download the information of the current entity under JSON format.

![Downloaded JSON information](./photos/downloadJSON_entity.PNG)

5. To modify the information of the entity, click on the edit button in the right corner of each entity panel in the right sidebar. After the editting window show up, user can modify the type and text of the current entity as well as the relations to other entities.

![Entity edit button](./photos/edit_open_instruct.PNG)

![Entity editting window](./photos/edit_entity.PNG)

6. To change the type of the entity, click on the current type to open up the list of available entity types and choose the new type.

![Change the entity type](./photos/change_entity_type.PNG)

7. To change the text of the entity, drag and click on the new span of text in the current paragraph.

![Change the text of entity](./photos/change_text_of_entity.PNG)

8. To delete the current entity, click the **DELETE** button on the right corner of the window. Be cautious, because this action cannot be undone.  

9. To change the relation of the current entity, click on the **RELATION** button on the menu bar inside the editting window.

![Open relation editting window](./photos/edit_relation.png)

10. To add new relation of current entity, click on the add button on the window.

![Add relation button](./photos/add_new_relation.PNG)

![Add new relation window](./photos/add_new_relation_detail.PNG)

To add the relation type, click on the field **Relation Type** to open the list of available relation type and choose the suitable relation type.

![List of available relation type](./photos/add_relation_type.PNG)

To add the object to the relation, click on the field **Object Entity** to open the list of availabel entities inside the same paragraph and choose the suitable entity. 

![List of available entities](./photos/add_relation_object.PNG)

Once finished, click button **ADD** to add new relation to current entity. 

![Save the new relation](./photos/finish_add_relation.PNG)

![Result of adding new relation](./photos/add_relation_result.PNG)

11. To modify the information of an existing relation, click on the relation type of that relation or object entity and choose the new relation type and object entity as step 10.

12. To delete an existing relation from the current entity, click on the delete button on the row of that relation. 

![Delete relation button](./photos/delete_relation.PNG)

13. Once finished, click **SAVE & RELOAD** to save changes, otherwise click **CANCEL** to undo the changes.

The information of whole document can be downloaded by clicking the **DOWNLOAD RESULT** button on the most right corner of the interface. With the change of users, the downloaded results will be also changed arccording the changes of user

![Download result button](./photos/download_button.PNG)

## 3. Contact Support
If you encounter any issues, please contact our support team:

- **Email**: support@yoursoftware.com
- **Phone**: +1-800-123-4567
- **Website**: [Support Page](http://yoursoftware.com/support)

</div>