<!-- ­–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– -->
# Quick‑Start Guide
Learn the basics of working with **PolyMinder.**  
<!-- ­–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– -->

---

## 1. Sign In
<p style='text-align: justify;'> Open [Sign-in](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signin) page, enter your username and password, and press **Sign In**.  If you have not have an account, choose [Sign Up](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder/signup), complete the registration form, and then return to the sign‑in page. </p>


<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/signin_page.png" alt="PolyMinder sign‑in screen" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;" />
  <figcaption><em>Figure 1 — Sign‑in interface</em></figcaption>
</figure>


## 2. End‑to‑End Annotation Workflow

<p style='text-align: justify;'> After signing in, upload a PDF through the web interface. PolyMinder `parses` the document, runs its `NER & RE models`, and overlays the `predicted entities and relations` directly on the original pages. You may then `verify` or `refine` each annotation and finally download a clean, fully annotated PDF. </p>


| Step | Action | System Response |
|------|--------|-----------------|
| 1 | **Upload** one or more PDF files. | Files are queued for processing. |
| 2 | PolyMinder **parses** each document and runs **NER & RE** models. | Entities and relations are extracted. |
| 3 | The system **overlays** predictions on the PDF. | An interactive result page is generated. |
| 4 | You **verify / refine** annotations and **download** the final PDF. | Clean, high‑quality annotations are saved. |

---

## 3. Manage Your Documents

<p style='text-align: justify;'> Click **Documents** in the top toolbar to open the management console. This view shows every file you have uploaded, its current processing status, and options to rename, delete, or download the annotated result. </p>

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/v3.1/document_page.png" alt="Document management page" style="width:100%;" />
  <figcaption><em>Figure 3 — Document management console</em></figcaption>
</figure>

---

## 4. Refine Annotations

<p style='text-align: justify;'> Select any **processed document** to launch the interactive result viewer. Inline editing tools allow you to `correct` or `add` entities and relations; changes are saved automatically. </p>

<figure style="width:100%;margin:1.5rem auto;text-align:center;">
  <img src="./src/DocsPage/photos/Result.PNG" alt="Result viewer with inline editing" style="width:100%;" />
  <figcaption><em>Figure 4 — Interactive result viewer</em></figcaption>
</figure>

