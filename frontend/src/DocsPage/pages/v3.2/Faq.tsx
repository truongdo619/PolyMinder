import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink
} from "../../components/DocComponents";

export const toc = [
  { id: "general", title: "General", level: 2 },
  { id: "what-is-polyminder", title: "What is PolyMinder?", level: 3 },
  { id: "who-is-polyminder-for", title: "Who is PolyMinder for?", level: 3 },
  { id: "documents-and-processing", title: "Documents and Processing", level: 2 },
  { id: "how-long-does-processing-take", title: "How long does processing take?", level: 3 },
  { id: "my-document-has-been-processing-for-a-long-time-what-should-i-do", title: "My document has been \"Processing\" for a long time. What should I do?", level: 3 },
  { id: "can-i-upload-scanned-pdfs", title: "Can I upload scanned PDFs?", level: 3 },
  { id: "entities-and-relations", title: "Entities and Relations", level: 2 },
  { id: "why-are-some-entities-missing-or-incorrect", title: "Why are some entities missing or incorrect?", level: 3 },
  { id: "how-do-i-re-run-the-models-after-editing", title: "How do I re-run the models after editing?", level: 3 },
  { id: "what-entity-types-does-polyminder-support", title: "What entity types does PolyMinder support?", level: 3 },
  { id: "what-relation-types-are-supported", title: "What relation types are supported?", level: 3 },
  { id: "can-i-add-my-own-entity-or-relation-types", title: "Can I add my own entity or relation types?", level: 3 },
  { id: "llm-extraction", title: "LLM Extraction", level: 2 },
  { id: "what-does-llm-extraction-do-differently-from-the-built-in-model", title: "What does LLM Extraction do differently from the built-in model?", level: 3 },
  { id: "which-llm-models-are-available", title: "Which LLM models are available?", level: 3 },
  { id: "my-llm-extraction-returned-garbled-text-what-happened", title: "My LLM extraction returned garbled text. What happened?", level: 3 },
  { id: "saving-and-exporting", title: "Saving and Exporting", level: 2 },
  { id: "can-i-undo-changes", title: "Can I undo changes?", level: 3 },
  { id: "what-is-the-difference-between-all-data-and-confirmed-only-exports", title: "What is the difference between \"All Data\" and \"Confirmed Only\" exports?", level: 3 },
  { id: "where-are-my-exported-files-saved", title: "Where are my exported files saved?", level: 3 },
  { id: "workflow-guide", title: "Workflow Guide", level: 2 },
  { id: "what-is-the-workflow-guide-stepper", title: "What is the Workflow Guide stepper?", level: 3 },
  { id: "can-i-hide-the-workflow-guide", title: "Can I hide the Workflow Guide?", level: 3 },
  { id: "account", title: "Account", level: 2 },
  { id: "how-do-i-change-my-password", title: "How do I change my password?", level: 3 },
  { id: "i-forgot-my-password-how-do-i-reset-it", title: "I forgot my password. How do I reset it?", level: 3 },
];

export const searchContent = `
# Frequently Asked Questions

---

## General

### What is PolyMinder?

PolyMinder is a web-based annotation system for scientific PDFs focused on polymer science. It automatically extracts polymer-related entities (such as polymer names, properties, values, and methods) and the relationships between them using fine-tuned NER and RE models. You can review, correct, and export the results directly in the browser.

### Who is PolyMinder for?

PolyMinder is designed for researchers in polymer science and materials science who need to extract structured information from large collections of papers   without manually reading and tagging every document from scratch.

---

## Documents and Processing

### How long does processing take?

Processing time depends on document length. A typical 8-page paper takes 30 90 seconds. Very long documents (30+ pages) may take 2 5 minutes. The document status in the dashboard updates automatically   no need to refresh.

### My document has been "Processing" for a long time. What should I do?

If a document stays in Processing for more than 10 minutes, try refreshing the page. If the status does not update, the backend queue may be busy or the document may have caused an error. Contact support with the document name and upload time.

### Can I upload scanned PDFs?

PolyMinder works best with text-embedded PDFs (i.e., PDFs where text can be selected in a viewer). Scanned image-only PDFs cannot be parsed for text, so entities and relations will not be extracted. Consider running OCR first (e.g., with Adobe Acrobat or Tesseract) before uploading.

---

## Entities and Relations

### Why are some entities missing or incorrect?

The NER model is trained on the PolyNERE corpus (750 polymer-science abstracts). It performs well on polymer-related text but may miss entities in unusual writing styles, heavily formatted sections, or domains outside its training distribution. Use [LLM Extraction](../features/llmextraction) to supplement the model on paragraphs with missed entities, or add entities manually by selecting text in the PDF.

### How do I re-run the models after editing?

After significant edits, you may want to re-extract relations to reflect new or corrected entities. Click the Re-run NER & RE Models button in the toolbar (the refresh icon at the top of the result page). This re-processes the document with the current paragraph and entity state.

### What entity types does PolyMinder support?

PolyMinder recognises 16 entity types: VALUE, POLYMER, POLYMERFAMILY, PROPVALUE, PROPNAME, MONOMER, ORGANIC, INORGANIC, MATERIALAMOUNT, CONDITION, REFEXP, OTHERMATERIAL, COMPOSITE, SYNMETHOD, CHARMETHOD, and EVENT.

### What relation types are supported?

Nine relation types: <OVERLAP>, hasproperty, hasvalue, hasamount, hascondition, abbreviationof, refersto, synthesisedby, and characterizedby.

### Can I add my own entity or relation types?

Not through the UI in the current version. Entity and relation schemas are defined in the backend settings.json. Contact your administrator to add custom types to the configuration.

---

## LLM Extraction

### What does LLM Extraction do differently from the built-in model?

The built-in NER/RE models are fast statistical models trained on a fixed dataset. LLM Extraction sends the paragraph text to a large language model (e.g., GPT-4) with a custom prompt, which can generalise to unusual phrasing or rare polymer names. The trade-off is speed and API cost   LLM extraction is slower and optional.

### Which LLM models are available?

Available models depend on your backend configuration. Administrators can add API keys for OpenAI, Anthropic, or other providers. The model list in the LLM dialog reflects whatever is configured on the server.

### My LLM extraction returned garbled text. What happened?

The LLM response parser expects a specific JSON format from the model. If the model returns free text or an unexpected structure, parsing will fail or produce incorrect entities. Try a different prompt preset or re-run the extraction. Some models are more consistent with structured output than others.

---

## Saving and Exporting

### Can I undo changes?

PolyMinder does not have an in-session undo button. However, you can save Checkpoints before making large edits and restore them later. See [Save Checkpoints](../features/savecheckpoints).

### What is the difference between "All Data" and "Confirmed Only" exports?

 All Data   exports every entity and relation regardless of confirmation status.
 Confirmed Only   exports only entities/relations you have marked with the   star icon. Use this for high-quality, reviewed output.

### Where are my exported files saved?

Files are downloaded directly to your browser's default download folder (usually ~/Downloads). PolyMinder does not store exported files on the server.

---

## Workflow Guide

### What is the Workflow Guide stepper?

The stepper is a 5-step progress bar at the top of the result page that tracks your annotation workflow: Upload PDF   Review Entities   Check Relations   Run LLM (optional)   Export Results. Steps tick automatically as you complete them. See [Workflow Guide](../features/workflowguide) for details.

### Can I hide the Workflow Guide?

Yes. Click the stepper header to collapse it, or uncheck Show guidance tips at the bottom of the settings panel to hide all guidance banners.

---

## Account

### How do I change my password?

Go to Profile (click your username in the top bar)   Change Password. Enter your current password, then your new one, and confirm. See [Personal Information Update](../features/personalization).

### I forgot my password. How do I reset it?

On the sign-in page, click Forgot Password. Enter your registered email address and follow the link sent to your inbox.
`;


export default function Faq() {
  return (
    <Box>
      <DocHeader level={1} id="frequently-asked-questions">Frequently Asked Questions</DocHeader>
      <DocHeader level={2} id="general">General</DocHeader>
      <DocHeader level={3} id="what-is-polyminder">What is PolyMinder?</DocHeader>
      <DocText>PolyMinder is a web-based annotation system for scientific PDFs focused on polymer science. It automatically extracts polymer-related entities (such as polymer names, properties, values, and methods) and the relationships between them using fine-tuned NER and RE models. You can review, correct, and export the results directly in the browser.</DocText>
      <DocHeader level={3} id="who-is-polyminder-for">Who is PolyMinder for?</DocHeader>
      <DocText>PolyMinder is designed for researchers in polymer science and materials science who need to extract structured information from large collections of papers   without manually reading and tagging every document from scratch.</DocText>
      <DocHeader level={2} id="documents-and-processing">Documents and Processing</DocHeader>
      <DocHeader level={3} id="how-long-does-processing-take">How long does processing take?</DocHeader>
      <DocText>Processing time depends on document length. A typical 8-page paper takes 30 90 seconds. Very long documents (30+ pages) may take 2 5 minutes. The document status in the dashboard updates automatically   no need to refresh.</DocText>
      <DocHeader level={3} id="my-document-has-been-processing-for-a-long-time-what-should-i-do">My document has been "Processing" for a long time. What should I do?</DocHeader>
      <DocText>If a document stays in Processing for more than 10 minutes, try refreshing the page. If the status does not update, the backend queue may be busy or the document may have caused an error. Contact support with the document name and upload time.</DocText>
      <DocHeader level={3} id="can-i-upload-scanned-pdfs">Can I upload scanned PDFs?</DocHeader>
      <DocText>PolyMinder works best with text-embedded PDFs (i.e., PDFs where text can be selected in a viewer). Scanned image-only PDFs cannot be parsed for text, so entities and relations will not be extracted. Consider running OCR first (e.g., with Adobe Acrobat or Tesseract) before uploading.</DocText>
      <DocHeader level={2} id="entities-and-relations">Entities and Relations</DocHeader>
      <DocHeader level={3} id="why-are-some-entities-missing-or-incorrect">Why are some entities missing or incorrect?</DocHeader>
      <DocText>The NER model is trained on the PolyNERE corpus (750 polymer-science abstracts). It performs well on polymer-related text but may miss entities in unusual writing styles, heavily formatted sections, or domains outside its training distribution. Use <DocLink href="../features/llmextraction">LLM Extraction</DocLink> to supplement the model on paragraphs with missed entities, or add entities manually by selecting text in the PDF.</DocText>
      <DocHeader level={3} id="how-do-i-re-run-the-models-after-editing">How do I re-run the models after editing?</DocHeader>
      <DocText>After significant edits, you may want to re-extract relations to reflect new or corrected entities. Click the Re-run NER &amp; RE Models button in the toolbar (the refresh icon at the top of the result page). This re-processes the document with the current paragraph and entity state.</DocText>
      <DocHeader level={3} id="what-entity-types-does-polyminder-support">What entity types does PolyMinder support?</DocHeader>
      <DocText>PolyMinder recognises 16 entity types: VALUE, POLYMER, POLYMERFAMILY, PROPVALUE, PROPNAME, MONOMER, ORGANIC, INORGANIC, MATERIALAMOUNT, CONDITION, REFEXP, OTHERMATERIAL, COMPOSITE, SYNMETHOD, CHARMETHOD, and EVENT.</DocText>
      <DocHeader level={3} id="what-relation-types-are-supported">What relation types are supported?</DocHeader>
      <DocText>Nine relation types: &lt;OVERLAP&gt;, hasproperty, hasvalue, hasamount, hascondition, abbreviationof, refersto, synthesisedby, and characterizedby.</DocText>
      <DocHeader level={3} id="can-i-add-my-own-entity-or-relation-types">Can I add my own entity or relation types?</DocHeader>
      <DocText>Not through the UI in the current version. Entity and relation schemas are defined in the backend settings.json. Contact your administrator to add custom types to the configuration.</DocText>
      <DocHeader level={2} id="llm-extraction">LLM Extraction</DocHeader>
      <DocHeader level={3} id="what-does-llm-extraction-do-differently-from-the-built-in-model">What does LLM Extraction do differently from the built-in model?</DocHeader>
      <DocText>The built-in NER/RE models are fast statistical models trained on a fixed dataset. LLM Extraction sends the paragraph text to a large language model (e.g., GPT-4) with a custom prompt, which can generalise to unusual phrasing or rare polymer names. The trade-off is speed and API cost   LLM extraction is slower and optional.</DocText>
      <DocHeader level={3} id="which-llm-models-are-available">Which LLM models are available?</DocHeader>
      <DocText>Available models depend on your backend configuration. Administrators can add API keys for OpenAI, Anthropic, or other providers. The model list in the LLM dialog reflects whatever is configured on the server.</DocText>
      <DocHeader level={3} id="my-llm-extraction-returned-garbled-text-what-happened">My LLM extraction returned garbled text. What happened?</DocHeader>
      <DocText>The LLM response parser expects a specific JSON format from the model. If the model returns free text or an unexpected structure, parsing will fail or produce incorrect entities. Try a different prompt preset or re-run the extraction. Some models are more consistent with structured output than others.</DocText>
      <DocHeader level={2} id="saving-and-exporting">Saving and Exporting</DocHeader>
      <DocHeader level={3} id="can-i-undo-changes">Can I undo changes?</DocHeader>
      <DocText>PolyMinder does not have an in-session undo button. However, you can save Checkpoints before making large edits and restore them later. See <DocLink href="../features/savecheckpoints">Save Checkpoints</DocLink>.</DocText>
      <DocHeader level={3} id="what-is-the-difference-between-all-data-and-confirmed-only-exports">What is the difference between "All Data" and "Confirmed Only" exports?</DocHeader>
      <DocText>All Data   exports every entity and relation regardless of confirmation status.</DocText>
      <DocText>Confirmed Only   exports only entities/relations you have marked with the   star icon. Use this for high-quality, reviewed output.</DocText>
      <DocHeader level={3} id="where-are-my-exported-files-saved">Where are my exported files saved?</DocHeader>
      <DocText>Files are downloaded directly to your browser's default download folder (usually ~/Downloads). PolyMinder does not store exported files on the server.</DocText>
      <DocHeader level={2} id="workflow-guide">Workflow Guide</DocHeader>
      <DocHeader level={3} id="what-is-the-workflow-guide-stepper">What is the Workflow Guide stepper?</DocHeader>
      <DocText>The stepper is a 5-step progress bar at the top of the result page that tracks your annotation workflow: Upload PDF   Review Entities   Check Relations   Run LLM (optional)   Export Results. Steps tick automatically as you complete them. See <DocLink href="../features/workflowguide">Workflow Guide</DocLink> for details.</DocText>
      <DocHeader level={3} id="can-i-hide-the-workflow-guide">Can I hide the Workflow Guide?</DocHeader>
      <DocText>Yes. Click the stepper header to collapse it, or uncheck Show guidance tips at the bottom of the settings panel to hide all guidance banners.</DocText>
      <DocHeader level={2} id="account">Account</DocHeader>
      <DocHeader level={3} id="how-do-i-change-my-password">How do I change my password?</DocHeader>
      <DocText>Go to Profile (click your username in the top bar)   Change Password. Enter your current password, then your new one, and confirm. See <DocLink href="../features/personalization">Personal Information Update</DocLink>.</DocText>
      <DocHeader level={3} id="i-forgot-my-password-how-do-i-reset-it">I forgot my password. How do I reset it?</DocHeader>
      <DocText>On the sign-in page, click Forgot Password. Enter your registered email address and follow the link sent to your inbox.</DocText>
    </Box>
  );
}
