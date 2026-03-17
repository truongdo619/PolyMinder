const fs = require('fs');

let doc = fs.readFileSync('src/DocsPage/DocsPage.tsx', 'utf8');

const imports = `
// --- Generated Imports (v3.3) ---
import OverviewV33, { toc as toc33Overview, searchContent as search33Overview } from "./pages/v3.3/Overview";

// --- Generated Imports (v3.1) ---
import OverviewV31, { toc as toc31Overview, searchContent as search31Overview } from "./pages/v3.1/Overview";
import InstallationV31, { toc as toc31Installation, searchContent as search31Installation } from "./pages/v3.1/Installation";
import QuickstartV31, { toc as toc31Quickstart, searchContent as search31Quickstart } from "./pages/v3.1/Quickstart";
import LoginSignupV31, { toc as toc31LoginSignup, searchContent as search31LoginSignup } from "./pages/v3.1/Login-signup";
import DocumentManagementV31, { toc as toc31DocumentManagement, searchContent as search31DocumentManagement } from "./pages/v3.1/Document-management";
import FilteringFunctionV31, { toc as toc31FilteringFunction, searchContent as search31FilteringFunction } from "./pages/v3.1/Filtering-function";
import EditingFunctionV31, { toc as toc31EditingFunction, searchContent as search31EditingFunction } from "./pages/v3.1/Editing-function";
import DownloadFunctionV31, { toc as toc31DownloadFunction, searchContent as search31DownloadFunction } from "./pages/v3.1/Download-function";
import ResultVisualizationV31, { toc as toc31ResultVisualization, searchContent as search31ResultVisualization } from "./pages/v3.1/Result-visualization";
import SaveCheckpointV31, { toc as toc31SaveCheckpoint, searchContent as search31SaveCheckpoint } from "./pages/v3.1/Save‑checkpoint";
import ConfirmAnnotationV31, { toc as toc31ConfirmAnnotation, searchContent as search31ConfirmAnnotation } from "./pages/v3.1/Confirm‑annotation";
import ParagraphSelectionV31, { toc as toc31ParagraphSelection, searchContent as search31ParagraphSelection } from "./pages/v3.1/Paragraph‑selection";
import PersonalInformationUpdateV31, { toc as toc31PersonalInformationUpdate, searchContent as search31PersonalInformationUpdate } from "./pages/v3.1/Personal-information-update";
import FaqV31, { toc as toc31Faq, searchContent as search31Faq } from "./pages/v3.1/Faq";
import ContactSupportV31, { toc as toc31ContactSupport, searchContent as search31ContactSupport } from "./pages/v3.1/Contact-support";
import LlmExtractionV31, { toc as toc31LlmExtraction, searchContent as search31LlmExtraction } from "./pages/v3.1/Llm-extraction";
import TablesV31, { toc as toc31Tables, searchContent as search31Tables } from "./pages/v3.1/Tables";
import EventsV31, { toc as toc31Events, searchContent as search31Events } from "./pages/v3.1/Events";
import WorkflowGuideV31, { toc as toc31WorkflowGuide, searchContent as search31WorkflowGuide } from "./pages/v3.1/Workflow-guide";

// --- Generated Imports (v3.0) ---
import OverviewV30, { toc as toc30Overview, searchContent as search30Overview } from "./pages/v3.0/Overview";
import InstallationV30, { toc as toc30Installation, searchContent as search30Installation } from "./pages/v3.0/Installation";
import QuickstartV30, { toc as toc30Quickstart, searchContent as search30Quickstart } from "./pages/v3.0/Quickstart";
import LoginSignupV30, { toc as toc30LoginSignup, searchContent as search30LoginSignup } from "./pages/v3.0/Login-signup";
import DocumentManagementV30, { toc as toc30DocumentManagement, searchContent as search30DocumentManagement } from "./pages/v3.0/Document-management";
import FilteringFunctionV30, { toc as toc30FilteringFunction, searchContent as search30FilteringFunction } from "./pages/v3.0/Filtering-function";
import EditingFunctionV30, { toc as toc30EditingFunction, searchContent as search30EditingFunction } from "./pages/v3.0/Editing-function";
import DownloadFunctionV30, { toc as toc30DownloadFunction, searchContent as search30DownloadFunction } from "./pages/v3.0/Download-function";

// --- Generated Imports (v2.0) ---
import OverviewV20, { toc as toc20Overview, searchContent as search20Overview } from "./pages/v2.0/Overview";

/* -------------------------------------------------------------------------- */
`;

const docsTree = `const docsByVersion: Record<(typeof versions)[number], DocsTree> = {
  // ── v3.3: current release ──
  "v3.3": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV33, toc: toc33Overview, searchContent: search33Overview },
        installation: { title: "Installation", Component: InstallationV31, toc: toc31Installation, searchContent: search31Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV31, toc: toc31Quickstart, searchContent: search31Quickstart },
        faq: { title: "Frequently Asked Questions", Component: FaqV31, toc: toc31Faq, searchContent: search31Faq },
        support: { title: "Contact Support", Component: ContactSupportV31, toc: toc31ContactSupport, searchContent: search31ContactSupport },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV31, toc: toc31LoginSignup, searchContent: search31LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV31, toc: toc31DocumentManagement, searchContent: search31DocumentManagement },
        result_visualization: { title: "Result Visualization", Component: ResultVisualizationV31, toc: toc31ResultVisualization, searchContent: search31ResultVisualization },
        workflow_guide: { title: "Workflow Guide", Component: WorkflowGuideV31, toc: toc31WorkflowGuide, searchContent: search31WorkflowGuide },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV31, toc: toc31FilteringFunction, searchContent: search31FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV31, toc: toc31EditingFunction, searchContent: search31EditingFunction },
        llm_extraction: { title: "LLM Extraction", Component: LlmExtractionV31, toc: toc31LlmExtraction, searchContent: search31LlmExtraction },
        tables: { title: "Tables Mode", Component: TablesV31, toc: toc31Tables, searchContent: search31Tables },
        events: { title: "Events Mode", Component: EventsV31, toc: toc31Events, searchContent: search31Events },
        save_checkpoints: { title: "Save Checkpoints", Component: SaveCheckpointV31, toc: toc31SaveCheckpoint, searchContent: search31SaveCheckpoint },
        confirm_annotations: { title: "Confirm Annotations", Component: ConfirmAnnotationV31, toc: toc31ConfirmAnnotation, searchContent: search31ConfirmAnnotation },
        paragraph_selection: { title: "Paragraph Selection", Component: ParagraphSelectionV31, toc: toc31ParagraphSelection, searchContent: search31ParagraphSelection },
        download: { title: "Export Results", Component: DownloadFunctionV31, toc: toc31DownloadFunction, searchContent: search31DownloadFunction },
        personalization: { title: "Personal Information Update", Component: PersonalInformationUpdateV31, toc: toc31PersonalInformationUpdate, searchContent: search31PersonalInformationUpdate },
      },
    },
  },

  // ── v3.2: similar to v3.1, without Guided UX pages ──
  "v3.2": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV31, toc: toc31Overview, searchContent: search31Overview },
        installation: { title: "Installation", Component: InstallationV31, toc: toc31Installation, searchContent: search31Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV31, toc: toc31Quickstart, searchContent: search31Quickstart },
        faq: { title: "Frequently Asked Questions", Component: FaqV31, toc: toc31Faq, searchContent: search31Faq },
        support: { title: "Contact Support", Component: ContactSupportV31, toc: toc31ContactSupport, searchContent: search31ContactSupport },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV31, toc: toc31LoginSignup, searchContent: search31LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV31, toc: toc31DocumentManagement, searchContent: search31DocumentManagement },
        result_visualization: { title: "Result Visualization", Component: ResultVisualizationV31, toc: toc31ResultVisualization, searchContent: search31ResultVisualization },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV31, toc: toc31FilteringFunction, searchContent: search31FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV31, toc: toc31EditingFunction, searchContent: search31EditingFunction },
        save_checkpoints: { title: "Save Checkpoints", Component: SaveCheckpointV31, toc: toc31SaveCheckpoint, searchContent: search31SaveCheckpoint },
        confirm_annotations: { title: "Confirm Annotations", Component: ConfirmAnnotationV31, toc: toc31ConfirmAnnotation, searchContent: search31ConfirmAnnotation },
        paragraph_selection: { title: "Paragraph Selection", Component: ParagraphSelectionV31, toc: toc31ParagraphSelection, searchContent: search31ParagraphSelection },
        download: { title: "Export Results", Component: DownloadFunctionV31, toc: toc31DownloadFunction, searchContent: search31DownloadFunction },
        personalization: { title: "Personal Information Update", Component: PersonalInformationUpdateV31, toc: toc31PersonalInformationUpdate, searchContent: search31PersonalInformationUpdate },
      },
    },
  },

  // ── v3.1: original release ──
  "v3.1": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV31, toc: toc31Overview, searchContent: search31Overview },
        installation: { title: "Installation", Component: InstallationV31, toc: toc31Installation, searchContent: search31Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV31, toc: toc31Quickstart, searchContent: search31Quickstart },
        faq: { title: "Frequently Asked Questions", Component: FaqV31, toc: toc31Faq, searchContent: search31Faq },
        support: { title: "Contact Support", Component: ContactSupportV31, toc: toc31ContactSupport, searchContent: search31ContactSupport },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV31, toc: toc31LoginSignup, searchContent: search31LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV31, toc: toc31DocumentManagement, searchContent: search31DocumentManagement },
        result_visualization: { title: "Result Visualization", Component: ResultVisualizationV31, toc: toc31ResultVisualization, searchContent: search31ResultVisualization },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV31, toc: toc31FilteringFunction, searchContent: search31FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV31, toc: toc31EditingFunction, searchContent: search31EditingFunction },
        save_checkpoints: { title: "Save Checkpoints", Component: SaveCheckpointV31, toc: toc31SaveCheckpoint, searchContent: search31SaveCheckpoint },
        confirm_annotations: { title: "Confirm Annotations", Component: ConfirmAnnotationV31, toc: toc31ConfirmAnnotation, searchContent: search31ConfirmAnnotation },
        paragraph_selection: { title: "Paragraph Selection", Component: ParagraphSelectionV31, toc: toc31ParagraphSelection, searchContent: search31ParagraphSelection },
        download: { title: "Export Results", Component: DownloadFunctionV31, toc: toc31DownloadFunction, searchContent: search31DownloadFunction },
        personalization: { title: "Personal Information Update", Component: PersonalInformationUpdateV31, toc: toc31PersonalInformationUpdate, searchContent: search31PersonalInformationUpdate },
      },
    },
  },

  "v3.0": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV30, toc: toc30Overview, searchContent: search30Overview },
        installation: { title: "Installation", Component: InstallationV30, toc: toc30Installation, searchContent: search30Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV30, toc: toc30Quickstart, searchContent: search30Quickstart },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV30, toc: toc30LoginSignup, searchContent: search30LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV30, toc: toc30DocumentManagement, searchContent: search30DocumentManagement },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV30, toc: toc30FilteringFunction, searchContent: search30FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV30, toc: toc30EditingFunction, searchContent: search30EditingFunction },
        download: { title: "Export Results", Component: DownloadFunctionV30, toc: toc30DownloadFunction, searchContent: search30DownloadFunction },
      },
    },
  },

  "v2.0": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV20, toc: toc20Overview, searchContent: search20Overview },
      },
    },
  }
};`;

doc = doc.replace(/\n\/\/ v3\.3 markdown[\s\S]*?\/\* -------------------------------------------------------------------------- \*\//, '\n' + imports);

doc = doc.replace(/const docsByVersion[\s\S]*?};/, docsTree);

fs.writeFileSync('src/DocsPage/DocsPage.tsx', doc);
