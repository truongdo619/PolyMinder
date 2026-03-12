export interface GuidanceConditionState {
  highlightCount: number;
  relationCount: number;
  selectedMode: string;
  hasLLMOutput: boolean;
  hasTableOutput: boolean;
  documentId: string | null;
}

export interface GuidanceItem {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  context: 'documents' | 'result' | 'entities' | 'relations' | 'events'
    | 'tables' | 'paragraphs' | 'llm' | 'settings' | 'global';
  condition?: (state: GuidanceConditionState) => boolean;
  priority: number;
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  optional?: boolean;
  isComplete: (state: GuidanceConditionState) => boolean;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'upload',
    label: 'Upload PDF',
    description: 'Upload a scientific PDF to start annotating.',
    isComplete: (s) => s.documentId !== null,
  },
  {
    id: 'review-entities',
    label: 'Review Entities',
    description: 'Review the automatically extracted entities. Edit or confirm them.',
    isComplete: (s) => s.highlightCount > 0,
  },
  {
    id: 'review-relations',
    label: 'Check Relations',
    description: 'Switch to Relations mode to verify extracted relationships.',
    isComplete: () => false,
  },
  {
    id: 'run-llm',
    label: 'Run LLM Extraction (optional)',
    description: 'Use LLM mode to extract additional entities from paragraphs.',
    optional: true,
    isComplete: (s) => s.hasLLMOutput,
  },
  {
    id: 'export',
    label: 'Export Results',
    description: 'Download your annotated document as PDF or JSON.',
    isComplete: () => false,
  },
];

export const GUIDANCE_ITEMS: GuidanceItem[] = [
  {
    id: 'first-upload',
    title: 'Get Started',
    description: 'Upload your first PDF to begin extracting polymer entities and relations.',
    actionLabel: 'Upload PDF',
    context: 'documents',
    condition: (s) => s.documentId === null,
    priority: 1,
  },
  {
    id: 'open-document-hint',
    title: 'Open a Document',
    description: 'Click on any document name to open it in the annotation workspace.',
    actionLabel: 'Got it',
    context: 'documents',
    priority: 2,
  },
  {
    id: 'entities-intro',
    title: 'Entities Extracted',
    description:
      'The system has automatically detected entities in your PDF. '
      + 'Click any entity in the sidebar to scroll to it. Right-click to edit or delete.',
    actionLabel: 'Got it',
    context: 'entities',
    condition: (s) => s.highlightCount > 0 && s.selectedMode === 'Entities',
    priority: 10,
  },
  {
    id: 'entities-empty',
    title: 'No Entities Yet',
    description:
      'Select text in the PDF and click "Add highlight" to create your first entity.',
    actionLabel: 'Got it',
    context: 'entities',
    condition: (s) => s.highlightCount === 0 && s.selectedMode === 'Entities',
    priority: 5,
  },
  {
    id: 'confirm-entities-hint',
    title: 'Confirm Correct Entities',
    description:
      'Click the star icon next to an entity to mark it as confirmed. '
      + 'This helps track your review progress.',
    actionLabel: 'Got it',
    context: 'entities',
    condition: (s) => s.highlightCount > 5 && s.selectedMode === 'Entities',
    priority: 30,
  },
  {
    id: 'switch-to-relations',
    title: 'Next: Check Relations',
    description:
      'Entities look good? Switch to Relations mode to see how they connect '
      + '(e.g., has_property, has_value).',
    actionLabel: 'Switch to Relations',
    context: 'entities',
    condition: (s) => s.highlightCount > 0 && s.relationCount > 0 && s.selectedMode === 'Entities',
    priority: 40,
  },
  {
    id: 'relations-intro',
    title: 'Relations View',
    description:
      'This shows entities that have relationships. Click any entity '
      + 'to see its relations in the edit dialog.',
    actionLabel: 'Got it',
    context: 'relations',
    condition: (s) => s.selectedMode === 'Relations',
    priority: 10,
  },
  {
    id: 'try-llm',
    title: 'Try LLM Extraction',
    description:
      'Use LLM mode to extract additional entities the model may have missed. '
      + 'Click any paragraph block on the PDF to configure and run.',
    actionLabel: 'Switch to LLM',
    context: 'settings',
    condition: (s) => s.highlightCount > 0 && !s.hasLLMOutput,
    priority: 50,
  },
  {
    id: 'llm-first-run',
    title: 'Run Your First LLM Extraction',
    description:
      'Click on any highlighted paragraph block in the PDF. '
      + 'This opens a dialog where you can choose a prompt preset and run the LLM.',
    actionLabel: 'Got it',
    context: 'llm',
    condition: (s) => s.selectedMode === 'LLM' && !s.hasLLMOutput,
    priority: 10,
  },
  {
    id: 'llm-compare-hint',
    title: 'Compare & Merge Results',
    description:
      'Right-click any LLM-extracted entity to compare it with '
      + 'the model-based extraction and merge the best results.',
    actionLabel: 'Got it',
    context: 'llm',
    condition: (s) => s.selectedMode === 'LLM' && s.hasLLMOutput,
    priority: 20,
  },
  {
    id: 'tables-intro',
    title: 'Table Extraction',
    description:
      'Tables detected in the PDF are shown here. Click a table to '
      + 'view its content and run LLM conversion to natural language.',
    actionLabel: 'Got it',
    context: 'tables',
    condition: (s) => s.hasTableOutput && s.selectedMode === 'Tables',
    priority: 10,
  },
  {
    id: 'tables-empty',
    title: 'No Tables Detected',
    description:
      'No tables were found in this document. '
      + 'Only PDFs with embedded table structures are automatically extracted.',
    actionLabel: 'Got it',
    context: 'tables',
    condition: (s) => !s.hasTableOutput && s.selectedMode === 'Tables',
    priority: 5,
  },
  {
    id: 'relations-empty',
    title: 'No Relations Found',
    description:
      'No relationships were extracted yet. Relations link entities together '
      + '(e.g. has_property, has_value). If you have added or edited entities, '
      + 'try re-running the RE model from the toolbar.',
    actionLabel: 'Got it',
    context: 'relations',
    condition: (s) => s.selectedMode === 'Relations' && s.relationCount === 0,
    priority: 5,
  },
  {
    id: 'events-intro',
    title: 'Events Mode',
    description:
      'Events capture structured actions in the text — such as synthesis steps or '
      + 'measurement procedures. Each event groups related entities from a paragraph.',
    actionLabel: 'Got it',
    context: 'events',
    condition: (s) => s.selectedMode === 'Events',
    priority: 10,
  },
  {
    id: 'events-paragraph-filter',
    title: 'Filter by Paragraph',
    description:
      'Use "Adjust your selection" to choose which paragraphs contribute to event '
      + 'detection. Unchecking a paragraph excludes it from the results.',
    actionLabel: 'Got it',
    context: 'events',
    condition: (s) => s.selectedMode === 'Events',
    priority: 20,
  },
  {
    id: 'paragraphs-intro',
    title: 'Paragraphs Mode',
    description:
      'This view shows the raw text segments extracted from your PDF. '
      + 'You can edit the text of any paragraph or drag-and-drop to fix the reading order.',
    actionLabel: 'Got it',
    context: 'paragraphs',
    condition: (s) => s.selectedMode === 'Paragraphs',
    priority: 10,
  },
  {
    id: 'summarize-hint',
    title: 'Visualise Your Extractions',
    description:
      'Click "Summarize Result" to generate an interactive graph showing all '
      + 'extracted entities and how they relate to each other.',
    actionLabel: 'Got it',
    context: 'settings',
    condition: (s) => s.highlightCount > 0,
    priority: 55,
  },
  {
    id: 'export-hint',
    title: 'Export Your Work',
    description:
      'Use "Download Result" in the left panel to export your annotations '
      + 'as a highlighted PDF or JSON file.',
    actionLabel: 'Got it',
    context: 'settings',
    priority: 60,
  },
  {
    id: 'save-checkpoint',
    title: 'Save a Checkpoint',
    description:
      'Save your current progress as a named checkpoint. '
      + 'You can revert to any checkpoint later from the document info dialog.',
    actionLabel: 'Got it',
    context: 'settings',
    priority: 70,
  },
];
