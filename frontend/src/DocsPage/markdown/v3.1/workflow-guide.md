# Workflow Guide

PolyMinder includes a built-in **Workflow Guide** that tracks your annotation progress and surfaces contextual tips at each stage — so you always know what to do next.

---

## 1. The Progress Stepper

When you open a document, a compact progress bar appears at the top of the PDF viewer area. It shows five workflow steps:

| Step | Completes when |
|------|---------------|
| **Upload PDF** | A document is open in the viewer |
| **Review Entities** | The document has at least one extracted entity |
| **Check Relations** | You visit Relations mode |
| **Run LLM Extraction** *(optional)* | You visit LLM mode or LLM output exists |
| **Export Results** | You successfully download the annotated PDF or JSON |

A green check mark appears on each step as you complete it. The counter in the header (e.g. **(2/4)**) shows required steps completed — the LLM step is optional and does not count towards the total.

---

## 2. Optional Steps

The **Run LLM Extraction** step is marked **(optional)** and displayed with a lighter blue icon. You can export your work at any time without running LLM extraction. The stepper skips this step when calculating which step is "next".

---

## 3. Clicking a Step

Each step is clickable. Clicking a step navigates you directly to the relevant mode:

* **Review Entities** → switches to Entities mode
* **Check Relations** → switches to Relations mode
* **Run LLM Extraction** → switches to LLM mode
* **Export Results** → use "Download Result" in the settings panel

---

## 4. Collapse and Expand

Click anywhere on the stepper header bar to collapse or expand it.

When collapsed, the header shows a one-line summary:
* `— Next: Check Relations` — the next required step
* `— All steps complete!` — when all required steps are done

---

## 5. Contextual Guidance Banners

In addition to the stepper, PolyMinder shows **contextual guidance banners** inside sidebars. These are small dismissible alerts that appear when:

* You enter a mode for the first time (e.g., *"Events Mode — events group related entities…"*)
* An empty state needs explanation (e.g., *"No Relations Found — try re-running the RE model"*)
* An obvious next action exists (e.g., *"Entities look good? Switch to Relations mode"*)

Dismiss a banner by clicking **×**. It will not appear again for that browser session.

---

## 6. Enable or Disable Guidance

To turn off all guidance banners and the stepper:

1. Open the **Settings** panel (left sidebar).
2. Scroll to the bottom.
3. Uncheck **Show guidance tips**.

This setting is saved in your browser and persists across sessions. Re-check the box to restore guidance.

---

## 7. Reset Guidance

Guidance banners remember which ones you have dismissed. Opening a **new document** automatically resets which workflow steps have been completed — dismissed banners are preserved.

To reset all dismissed banners manually, clear your browser's local storage for the PolyMinder site (browser developer tools → Application → Local Storage → delete `polyminder_guidance_state`).

---

## Tips

* The stepper resets on every new document — your progress on one document does not affect another.
* Guidance banners are per-mode: switching modes shows the banner relevant to that mode.
* The stepper does not block any action — you can export at any time regardless of which steps are ticked.
