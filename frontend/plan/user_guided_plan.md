# Plan: Guided User Experience — "What To Do Next" Actions

## Problem Statement

PolyMinder has a rich feature set (6 annotation modes, LLM extraction, table parsing, graph summarization, filtering, export) but no structured guidance. New users land on the annotation workspace with no indication of the typical workflow. They must discover features by trial and error or by reading documentation.

**Goal:** Add contextual "what to do next" guidance that appears at the right moment in the user's workflow, making each step discoverable without cluttering the UI for experienced users.

---

## Design Principles

1. **Non-intrusive** — Guidance is dismissible and remembers dismissal via localStorage
2. **Contextual** — Actions appear based on current state, not as a static tutorial
3. **Actionable** — Every guidance item has a clickable action that takes the user to the next step
4. **Progressive** — Guidance reveals complexity gradually (entities → relations → LLM → export)
5. **Minimal footprint** — One new shared component + small hooks into existing components

---

## Architecture

### New Files

```
src/
├── components/
│   ├── GuidanceSystem/
│   │   ├── GuidanceBanner.tsx        # Reusable banner component
│   │   ├── GuidanceTooltip.tsx       # Floating tooltip for specific elements
│   │   ├── WorkflowStepper.tsx       # Stepper showing workflow progress
│   │   ├── useGuidance.ts            # Hook for guidance state management
│   │   ├── guidanceConfig.ts         # All guidance definitions
│   │   └── index.ts                  # Re-exports
│   └── ... (existing components modified)
└── style/
    └── Guidance.css                  # Guidance-specific styles
```

### Modified Files

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/ResultComponent.tsx` | Minor | Add WorkflowStepper and GuidanceBanner |
| `src/components/Sidebar.tsx` | Minor | Add contextual guidance for empty states |
| `src/components/SettingSidebar.tsx` | Minor | Add guidance for mode switching and export |
| `src/components/LLMSidebar.tsx` | Minor | Add first-use guidance |
| `src/DocumentListPage/DocumentList.tsx` | Minor | Add empty-state and first-upload guidance |
| `src/GlobalState.tsx` | Minor | Add `guidanceState` to context |

---

## Implementation Plan

### Phase 1: Core Guidance Infrastructure ✅ COMPLETED

#### 1.1 Guidance State Hook (`useGuidance.ts`)

Manages which guidance items have been seen/dismissed, persisted in localStorage.

```tsx
// src/components/GuidanceSystem/useGuidance.ts
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'polyminder_guidance_state';

export interface GuidanceState {
  dismissedIds: Set<string>;
  completedSteps: Set<string>;
  guidanceEnabled: boolean;
}

const loadState = (): GuidanceState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissedIds: new Set(), completedSteps: new Set(), guidanceEnabled: true };
    const parsed = JSON.parse(raw);
    return {
      dismissedIds: new Set(parsed.dismissedIds ?? []),
      completedSteps: new Set(parsed.completedSteps ?? []),
      guidanceEnabled: parsed.guidanceEnabled ?? true,
    };
  } catch {
    return { dismissedIds: new Set(), completedSteps: new Set(), guidanceEnabled: true };
  }
};

const saveState = (state: GuidanceState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    dismissedIds: [...state.dismissedIds],
    completedSteps: [...state.completedSteps],
    guidanceEnabled: state.guidanceEnabled,
  }));
};

export const useGuidance = () => {
  const [state, setState] = useState<GuidanceState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const dismiss = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, dismissedIds: new Set(prev.dismissedIds) };
      next.dismissedIds.add(id);
      return next;
    });
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setState(prev => {
      const next = { ...prev, completedSteps: new Set(prev.completedSteps) };
      next.completedSteps.add(stepId);
      return next;
    });
  }, []);

  const toggleGuidance = useCallback(() => {
    setState(prev => ({ ...prev, guidanceEnabled: !prev.guidanceEnabled }));
  }, []);

  const resetGuidance = useCallback(() => {
    setState({ dismissedIds: new Set(), completedSteps: new Set(), guidanceEnabled: true });
  }, []);

  const shouldShow = useCallback((id: string) => {
    return state.guidanceEnabled && !state.dismissedIds.has(id);
  }, [state]);

  const isStepComplete = useCallback((stepId: string) => {
    return state.completedSteps.has(stepId);
  }, [state]);

  return { state, dismiss, completeStep, toggleGuidance, resetGuidance, shouldShow, isStepComplete };
};
```

#### 1.2 Guidance Configuration (`guidanceConfig.ts`)

Centralized definition of all guidance items and workflow steps.

```tsx
// src/components/GuidanceSystem/guidanceConfig.ts

export interface GuidanceItem {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  /** Which mode or page this guidance applies to */
  context: 'documents' | 'result' | 'entities' | 'relations' | 'events'
    | 'tables' | 'paragraphs' | 'llm' | 'settings' | 'global';
  /** Optional condition function — item only shows when this returns true */
  condition?: (state: GuidanceConditionState) => boolean;
  /** Priority for ordering (lower = show first) */
  priority: number;
}

export interface GuidanceConditionState {
  highlightCount: number;
  relationCount: number;
  selectedMode: string;
  hasLLMOutput: boolean;
  hasTableOutput: boolean;
  documentId: string | null;
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  /** How to detect this step is complete */
  isComplete: (state: GuidanceConditionState) => boolean;
}

// ─── Workflow Steps (top-level progress indicator) ──────────────────

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
    isComplete: (s) => s.relationCount > 0,
  },
  {
    id: 'run-llm',
    label: 'Run LLM Extraction',
    description: 'Use LLM mode to extract additional entities from paragraphs.',
    isComplete: (s) => s.hasLLMOutput,
  },
  {
    id: 'export',
    label: 'Export Results',
    description: 'Download your annotated document as PDF or JSON.',
    isComplete: () => false, // Completed when user clicks download
  },
];

// ─── Contextual Guidance Items ──────────────────────────────────────

export const GUIDANCE_ITEMS: GuidanceItem[] = [
  // --- Documents Page ---
  {
    id: 'first-upload',
    title: 'Get Started',
    description: 'Upload your first PDF to begin extracting polymer entities and relations.',
    actionLabel: 'Upload PDF',
    context: 'documents',
    condition: (s) => s.documentId === null,
    priority: 1,
  },

  // --- Result Page: Entities Mode ---
  {
    id: 'entities-intro',
    title: 'Entities Extracted',
    description: 'The system has automatically detected entities in your PDF. '
      + 'Click any entity in the sidebar to scroll to it. Right-click to edit or delete.',
    actionLabel: 'Got it',
    context: 'entities',
    condition: (s) => s.highlightCount > 0 && s.selectedMode === 'Entities',
    priority: 10,
  },
  {
    id: 'add-entity-hint',
    title: 'Add Your Own Entity',
    description: 'Select text in the PDF to create a new entity annotation. '
      + 'A tooltip will appear letting you choose the entity type.',
    actionLabel: 'Try it',
    context: 'entities',
    condition: (s) => s.selectedMode === 'Entities',
    priority: 20,
  },
  {
    id: 'confirm-entities-hint',
    title: 'Confirm Correct Entities',
    description: 'Click the star icon next to an entity to mark it as confirmed. '
      + 'This helps track your review progress.',
    actionLabel: 'Got it',
    context: 'entities',
    condition: (s) => s.highlightCount > 5 && s.selectedMode === 'Entities',
    priority: 30,
  },

  // --- Relations Mode ---
  {
    id: 'switch-to-relations',
    title: 'Next: Check Relations',
    description: 'Switch to Relations mode in the left panel to see how entities '
      + 'are connected (e.g., has_property, has_value).',
    actionLabel: 'Switch to Relations',
    context: 'entities',
    condition: (s) => s.highlightCount > 0 && s.relationCount > 0 && s.selectedMode === 'Entities',
    priority: 40,
  },
  {
    id: 'relations-intro',
    title: 'Relations View',
    description: 'This shows entities that have relationships. Click any entity '
      + 'to see its relations in the edit dialog.',
    actionLabel: 'Got it',
    context: 'relations',
    condition: (s) => s.selectedMode === 'Relations',
    priority: 10,
  },

  // --- LLM Mode ---
  {
    id: 'try-llm',
    title: 'Try LLM Extraction',
    description: 'Switch to LLM mode to use large language models for additional extraction. '
      + 'Click any paragraph block on the PDF to configure and run.',
    actionLabel: 'Switch to LLM',
    context: 'entities',
    condition: (s) => s.highlightCount > 0 && !s.hasLLMOutput && s.selectedMode === 'Entities',
    priority: 50,
  },
  {
    id: 'llm-first-run',
    title: 'Run Your First LLM Extraction',
    description: 'Click on any highlighted paragraph block in the PDF. '
      + 'This opens a dialog where you can choose a prompt preset and run the LLM.',
    actionLabel: 'Got it',
    context: 'llm',
    condition: (s) => s.selectedMode === 'LLM' && !s.hasLLMOutput,
    priority: 10,
  },
  {
    id: 'llm-compare-hint',
    title: 'Compare LLM vs Model Output',
    description: 'Right-click an LLM-extracted entity to compare it with the '
      + 'model-based extraction and merge the best results.',
    actionLabel: 'Got it',
    context: 'llm',
    condition: (s) => s.selectedMode === 'LLM' && s.hasLLMOutput,
    priority: 20,
  },

  // --- Tables Mode ---
  {
    id: 'tables-intro',
    title: 'Table Extraction',
    description: 'Tables detected in the PDF are shown here. Click a table to '
      + 'view its content and run LLM conversion to natural language.',
    actionLabel: 'Got it',
    context: 'tables',
    condition: (s) => s.hasTableOutput && s.selectedMode === 'Tables',
    priority: 10,
  },

  // --- Settings / Export ---
  {
    id: 'export-hint',
    title: 'Export Your Work',
    description: 'Use "Download Result" in the left panel to export your annotations '
      + 'as a highlighted PDF or JSON file.',
    actionLabel: 'Show me',
    context: 'settings',
    priority: 60,
  },
  {
    id: 'save-checkpoint',
    title: 'Save a Checkpoint',
    description: 'Save your current progress as a named checkpoint. '
      + 'You can revert to any checkpoint later from the document info dialog.',
    actionLabel: 'Got it',
    context: 'settings',
    priority: 70,
  },
  {
    id: 'summarize-hint',
    title: 'Summarize Your Document',
    description: 'Click "Summarize Result" to see a graph visualization of all '
      + 'extracted entities and relations.',
    actionLabel: 'Got it',
    context: 'settings',
    priority: 80,
  },
];
```

#### 1.3 GuidanceBanner Component (`GuidanceBanner.tsx`)

A dismissible info banner that appears at the top of sidebars or content areas.

```tsx
// src/components/GuidanceSystem/GuidanceBanner.tsx
import React from 'react';
import { Alert, AlertTitle, Button, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface GuidanceBannerProps {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  onDismiss: (id: string) => void;
  visible: boolean;
  severity?: 'info' | 'success' | 'warning';
}

const GuidanceBanner: React.FC<GuidanceBannerProps> = ({
  id, title, description, actionLabel, onAction, onDismiss, visible, severity = 'info',
}) => {
  return (
    <Collapse in={visible}>
      <Alert
        severity={severity}
        icon={<LightbulbIcon fontSize="inherit" />}
        action={
          <IconButton
            aria-label="dismiss"
            color="inherit"
            size="small"
            onClick={() => onDismiss(id)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          mx: 1, mb: 1, mt: 1,
          '& .MuiAlert-message': { width: '100%' },
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <AlertTitle sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</AlertTitle>
        <span style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{description}</span>
        {onAction && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              onAction();
              onDismiss(id);
            }}
            sx={{
              mt: 1, display: 'block',
              textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Alert>
    </Collapse>
  );
};

export default GuidanceBanner;
```

#### 1.4 WorkflowStepper Component (`WorkflowStepper.tsx`)

A compact horizontal stepper at the top of ResultComponent showing the overall annotation workflow.

```tsx
// src/components/GuidanceSystem/WorkflowStepper.tsx
import React from 'react';
import {
  Stepper, Step, StepLabel, StepButton,
  Paper, Typography, Collapse, IconButton, Tooltip, Box
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { WORKFLOW_STEPS, GuidanceConditionState } from './guidanceConfig';

interface WorkflowStepperProps {
  conditionState: GuidanceConditionState;
  onStepClick?: (stepId: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  conditionState, onStepClick, visible, onToggleVisibility,
}) => {
  const activeStepIndex = WORKFLOW_STEPS.findIndex(
    step => !step.isComplete(conditionState)
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafbfc',
      }}
    >
      {/* Collapsed header */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 0.5, cursor: 'pointer',
        }}
        onClick={onToggleVisibility}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpOutlineIcon sx={{ fontSize: 16, color: '#1976d2' }} />
          <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>
            Workflow Guide
            {!visible && activeStepIndex >= 0 && (
              <span style={{ fontWeight: 400, marginLeft: 8 }}>
                — Next: {WORKFLOW_STEPS[activeStepIndex].label}
              </span>
            )}
          </Typography>
        </Box>
        <IconButton size="small">
          {visible ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Expanded stepper */}
      <Collapse in={visible}>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Stepper
            activeStep={activeStepIndex === -1 ? WORKFLOW_STEPS.length : activeStepIndex}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': { fontSize: '0.7rem' },
              '& .MuiStepIcon-root': { fontSize: '1.2rem' },
            }}
          >
            {WORKFLOW_STEPS.map((step) => {
              const completed = step.isComplete(conditionState);
              return (
                <Step key={step.id} completed={completed}>
                  <Tooltip title={step.description} arrow placement="bottom">
                    <StepButton onClick={() => onStepClick?.(step.id)}>
                      <StepLabel
                        StepIconComponent={() =>
                          completed
                            ? <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                            : <RadioButtonUncheckedIcon sx={{ color: '#bbb', fontSize: 20 }} />
                        }
                      >
                        {step.label}
                      </StepLabel>
                    </StepButton>
                  </Tooltip>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default WorkflowStepper;
```

#### 1.5 Re-export (`index.ts`)

```tsx
// src/components/GuidanceSystem/index.ts
export { default as GuidanceBanner } from './GuidanceBanner';
export { default as WorkflowStepper } from './WorkflowStepper';
export { useGuidance } from './useGuidance';
export * from './guidanceConfig';
```

---

### Phase 2: Integration into Existing Components ✅ COMPLETED

#### 2.1 ResultComponent — Add WorkflowStepper + Context

Add the stepper bar above the PDF viewer area and pass guidance context to sidebars.

**Location:** `src/components/ResultComponent.tsx`

**Changes at the top of the file (imports):**

```tsx
// Add to existing imports
import { WorkflowStepper, GuidanceBanner, useGuidance } from './GuidanceSystem';
import type { GuidanceConditionState } from './GuidanceSystem/guidanceConfig';
import { GUIDANCE_ITEMS } from './GuidanceSystem/guidanceConfig';
```

**Changes inside `ResultComponent` function (after existing state declarations, ~line 268):**

```tsx
// --- Guidance System State ---
const guidance = useGuidance();
const [stepperVisible, setStepperVisible] = useState(true);

// Build the condition state for guidance items
const guidanceConditionState: GuidanceConditionState = {
  highlightCount: highlights.length,
  relationCount: relationHighlights.length,
  selectedMode,
  hasLLMOutput: Array.isArray(LLLOutput) && LLLOutput.length > 0
    && LLLOutput.some((item: any) => item.entities?.length > 0),
  hasTableOutput: Array.isArray(tableOutput) && tableOutput.length > 0,
  documentId,
};

// Get the relevant guidance items for the current context
const currentContext = selectedMode.toLowerCase() as GuidanceConditionState['selectedMode'];
const activeGuidanceItems = GUIDANCE_ITEMS
  .filter(item => {
    const contextMatch = item.context === currentContext
      || item.context === 'result'
      || item.context === 'global';
    const conditionMatch = item.condition
      ? item.condition(guidanceConditionState)
      : true;
    return contextMatch && conditionMatch && guidance.shouldShow(item.id);
  })
  .sort((a, b) => a.priority - b.priority)
  .slice(0, 2); // Show at most 2 banners at a time

// Handler for workflow step clicks
const handleWorkflowStepClick = (stepId: string) => {
  switch (stepId) {
    case 'upload':
      navigateTo('/documents');
      break;
    case 'review-entities':
      setSelectedMode('Entities');
      break;
    case 'review-relations':
      setSelectedMode('Relations');
      break;
    case 'run-llm':
      setSelectedMode('LLM');
      break;
    case 'export':
      // Scroll settings sidebar to download section
      break;
  }
};

// Mark guidance steps as complete when mode changes
useEffect(() => {
  if (selectedMode === 'Relations') guidance.completeStep('review-relations');
  if (selectedMode === 'LLM') guidance.completeStep('run-llm');
}, [selectedMode]);
```

**Changes in the JSX return (add stepper above the PDF viewer area):**

The stepper goes between the Toolbar and the main content area. Find the existing `<Toolbar ... />` JSX and add after it:

```tsx
{/* Workflow Stepper — placed between Toolbar and main PDF area */}
<WorkflowStepper
  conditionState={guidanceConditionState}
  onStepClick={handleWorkflowStepClick}
  visible={stepperVisible}
  onToggleVisibility={() => setStepperVisible(prev => !prev)}
/>
```

#### 2.2 Sidebar — Add Contextual Guidance Banners

**Location:** `src/components/Sidebar.tsx`

Add guidance banners at the top of the entity list when relevant.

**Changes (imports at top):**

```tsx
import { GuidanceBanner, useGuidance } from './GuidanceSystem';
import { GUIDANCE_ITEMS, GuidanceConditionState } from './GuidanceSystem/guidanceConfig';
```

**Changes (inside Sidebar component, before the return):**

```tsx
const guidance = useGuidance();

// Build condition state from props
const guidanceState: GuidanceConditionState = {
  highlightCount: highlights.length,
  relationCount: highlights.filter(h => h.relations?.length).length,
  selectedMode,
  hasLLMOutput: false,
  hasTableOutput: false,
  documentId: globalContext.documentId,
};
```

**Changes (inside the JSX, after the `<h2>` heading and before the entity list):**

```tsx
{/* Contextual guidance */}
{highlights.length === 0 && guidance.shouldShow('entities-empty') && (
  <GuidanceBanner
    id="entities-empty"
    title="No Entities Yet"
    description="Select text in the PDF and click 'Add highlight' to create your first entity."
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}

{highlights.length > 0 && selectedMode === 'Entities' && guidance.shouldShow('entities-intro') && (
  <GuidanceBanner
    id="entities-intro"
    title="Entities Extracted"
    description="Click any entity to scroll to it in the PDF. Right-click for edit/delete options."
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}

{highlights.length > 5 && selectedMode === 'Entities' && guidance.shouldShow('confirm-entities-hint') && (
  <GuidanceBanner
    id="confirm-entities-hint"
    title="Confirm Correct Entities"
    description="Click the star icon to mark entities you've verified as correct."
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}
```

#### 2.3 LLMSidebar — Add First-Use Guidance

**Location:** `src/components/LLMSidebar.tsx`

Replace the existing static instruction box with a dismissible GuidanceBanner that provides clearer next steps.

**Changes (imports):**

```tsx
import { GuidanceBanner, useGuidance } from './GuidanceSystem';
```

**Changes (inside LLMSidebar component, before return):**

```tsx
const guidance = useGuidance();
const hasEntities = highlights.some(h => h.comment !== "BLOCK_LLM");
```

**Changes (replace the existing static blue instruction box, lines 44-59):**

```tsx
{/* Replace the static instruction box with guidance banners */}
{guidance.shouldShow('llm-first-run') && !hasEntities && (
  <GuidanceBanner
    id="llm-first-run"
    title="Run Your First LLM Extraction"
    description={
      'Click on any highlighted paragraph block in the PDF viewer. '
      + 'This opens a dialog where you can choose a prompt preset, '
      + 'select a model, and run the extraction.'
    }
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
    severity="info"
  />
)}

{guidance.shouldShow('llm-compare-hint') && hasEntities && (
  <GuidanceBanner
    id="llm-compare-hint"
    title="Compare & Merge Results"
    description={
      'Right-click any LLM-extracted entity to compare it with '
      + 'the model-based extraction. You can merge the best results.'
    }
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
    severity="success"
  />
)}

{/* Keep the static fallback for when guidance is dismissed */}
{!guidance.shouldShow('llm-first-run') && !hasEntities && (
  <div
    style={{
      backgroundColor: "#e8f4fd",
      border: "1px solid #b3d9f2",
      borderRadius: "8px",
      padding: "1rem",
      marginTop: "10px",
    }}
  >
    <p style={{ fontSize: "13px", margin: 0, color: "#5d6d7e" }}>
      Click on a paragraph block in the PDF to run LLM extraction.
    </p>
  </div>
)}
```

#### 2.4 SettingSidebar — Add Mode-Switching and Export Guidance

**Location:** `src/components/SettingSidebar.tsx`

**Changes (imports at top):**

```tsx
import { GuidanceBanner, useGuidance } from './GuidanceSystem';
```

**Changes (inside the component, after state declarations):**

```tsx
const guidance = useGuidance();
```

**Changes (in the JSX, after the mode selection buttons and before the filter list):**

```tsx
{/* Guidance: Suggest next mode */}
{selectedMode === 'Entities' && highlights.length > 0
  && guidance.shouldShow('switch-to-relations') && (
  <GuidanceBanner
    id="switch-to-relations"
    title="Next: Check Relations"
    description="Entities look good? Switch to Relations to verify how they connect."
    actionLabel="Switch to Relations"
    onAction={() => setSelectedMode('Relations')}
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}

{selectedMode === 'Relations' && guidance.shouldShow('try-llm') && (
  <GuidanceBanner
    id="try-llm"
    title="Try LLM Extraction"
    description="Use LLM mode to extract additional entities the model may have missed."
    actionLabel="Switch to LLM"
    onAction={() => setSelectedMode('LLM')}
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}

{selectedMode !== 'Entities' && guidance.shouldShow('export-hint') && (
  <GuidanceBanner
    id="export-hint"
    title="Ready to Export?"
    description={'Use "Download Result" above to save your annotations as PDF or JSON.'}
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
    severity="success"
  />
)}
```

#### 2.5 DocumentList — Empty State and First-Upload Guidance

**Location:** `src/DocumentListPage/DocumentList.tsx`

**Changes (imports):**

```tsx
import { GuidanceBanner, useGuidance } from '../components/GuidanceSystem';
```

**Changes (inside DocumentList component, after state declarations):**

```tsx
const guidance = useGuidance();
```

**Changes (in JSX, above the MUIDataTable, conditionally when table is empty):**

```tsx
{tableData.length === 0 && guidance.shouldShow('first-upload') && (
  <GuidanceBanner
    id="first-upload"
    title="Welcome to PolyMinder!"
    description={
      'Upload a scientific PDF to get started. The system will automatically '
      + 'extract polymer entities and relations using NLP models.'
    }
    actionLabel="Upload PDF"
    onAction={() => setOpenUploadDialog(true)}
    onDismiss={guidance.dismiss}
    visible={true}
    severity="info"
  />
)}

{tableData.length > 0 && tableData.every(d => d.status === 'completed')
  && guidance.shouldShow('open-document-hint') && (
  <GuidanceBanner
    id="open-document-hint"
    title="Open a Document"
    description="Click on any document name to open it in the annotation workspace."
    actionLabel="Got it"
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}
```

---

### Phase 3: Guidance Styles ✅ COMPLETED

#### 3.1 CSS File (`Guidance.css`)

```css
/* src/style/Guidance.css */

/* Pulse animation for the workflow stepper active step */
@keyframes guidancePulse {
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.3); }
  70% { box-shadow: 0 0 0 6px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
}

.guidance-active-step .MuiStepIcon-root {
  animation: guidancePulse 2s infinite;
}

/* Subtle entrance animation for banners */
.MuiAlert-root.guidance-banner {
  animation: guidanceSlideIn 0.3s ease-out;
}

@keyframes guidanceSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Compact stepper styling */
.guidance-stepper .MuiStepLabel-label {
  font-size: 0.7rem !important;
  line-height: 1.3;
}

.guidance-stepper .MuiStepConnector-line {
  border-color: #e0e0e0;
}

.guidance-stepper .MuiStepConnector-root.Mui-completed .MuiStepConnector-line {
  border-color: #4caf50;
}

/* Override for guidance banner inside sidebar */
.sidebar .MuiAlert-root {
  margin: 8px;
  font-size: 0.8rem;
}

.sidebar .MuiAlert-root .MuiAlertTitle-root {
  font-size: 0.85rem;
}
```

---

### Phase 4: Settings Toggle ✅ COMPLETED

#### 4.1 Add Guidance Toggle to SettingSidebar

Add a small toggle at the bottom of the SettingSidebar to enable/disable guidance globally.

**Location:** `src/components/SettingSidebar.tsx` (at the bottom of the sidebar JSX)

```tsx
{/* Guidance toggle — bottom of settings sidebar */}
<Divider sx={{ my: 1 }} />
<Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <Typography variant="caption" sx={{ color: '#888' }}>
    Show guidance tips
  </Typography>
  <FormControlLabel
    control={
      <Checkbox
        checked={guidance.state.guidanceEnabled}
        onChange={() => guidance.toggleGuidance()}
        size="small"
      />
    }
    label=""
    sx={{ mr: 0 }}
  />
</Box>
```

---

## Summary of All Changes

| File | Type | What Changes |
|------|------|-------------|
| `src/components/GuidanceSystem/useGuidance.ts` | **NEW** | Hook for guidance state (localStorage persistence) |
| `src/components/GuidanceSystem/guidanceConfig.ts` | **NEW** | All guidance items + workflow steps definitions |
| `src/components/GuidanceSystem/GuidanceBanner.tsx` | **NEW** | Dismissible info banner component |
| `src/components/GuidanceSystem/WorkflowStepper.tsx` | **NEW** | Horizontal workflow progress stepper |
| `src/components/GuidanceSystem/GuidanceContext.tsx` | **NEW** | Shared React context so all components read one state instance |
| `src/components/GuidanceSystem/index.ts` | **NEW** | Re-exports (updated to include GuidanceProvider, useGuidanceContext) |
| `src/style/Guidance.css` | **NEW** | Animation and layout styles |
| `src/App.tsx` | **MODIFY** | Wraps app in `<GuidanceProvider>`, imports Guidance.css |
| `src/components/ResultComponent.tsx` | **MODIFY** | Uses `useGuidanceContext()`, WorkflowStepper, step completion effects |
| `src/components/Sidebar.tsx` | **MODIFY** | Uses `useGuidanceContext()`, 3 conditional banners |
| `src/components/SettingSidebar.tsx` | **MODIFY** | Uses `useGuidanceContext()`, 2 mode-switching banners, enable/disable toggle |
| `src/components/LLMSidebar.tsx` | **MODIFY** | Uses `useGuidanceContext()`, replaces static instruction box with banners |
| `src/DocumentListPage/DocumentList.tsx` | **MODIFY** | Uses `useGuidanceContext()`, 2 banners |
| `src/components/EventSidebar.tsx` | **MODIFY** | Uses `useGuidanceContext()`, 2 banners (events-intro, events-paragraph-filter) |
| `src/components/TableSidebar.tsx` | **MODIFY** | Uses `useGuidanceContext()`, 2 banners (tables-intro, tables-empty) |
| `src/components/ParagraphSidebar.tsx` | **MODIFY** | Uses `useGuidanceContext()`, 1 banner (paragraphs-intro) |

**No existing functionality removed or broken. Typecheck: 63 errors before → 63 errors after (zero new issues).**

---

## Bug Fix: Workflow Step Completion ✅ FIXED

Three bugs caused steps to tick at the wrong time (or never):

**Bug 1 — `WorkflowStepper` ignored `completedSteps` entirely.**
`step.isComplete(conditionState)` was the only check. The `completeStep()` calls in `ResultComponent`
wrote into `completedSteps` but `WorkflowStepper` never read it.
Fix: `WorkflowStepper` now calls `useGuidanceContext().isStepComplete(step.id)` and OR's it with
`step.isComplete(conditionState)`. A step ticks if either condition is true.

**Bug 2 — "Check Relations" ticked immediately on document load.**
`isComplete: (s) => s.relationCount > 0` fired as soon as the NLP model found any relations,
before the user did anything.
Fix: `isComplete` changed to `() => false`. The step now ticks only via `completeStep('review-relations')`
which is called in `ResultComponent` when the user switches to Relations mode.

**Bug 3 — "Export Results" never ticked.**
`isComplete: () => false` with no code ever calling `completeStep('export')`.
Fix: `downloadDetailedReport` and `downloadJsonReport` in `SettingSidebar` now call
`guidance.completeStep('export')` on successful download.

| Step | Ticks when |
|------|-----------|
| Upload PDF | `documentId !== null` (auto on opening result view) |
| Review Entities | `highlights.length > 0` (auto when doc has entities) |
| Check Relations | User switches to Relations mode |
| Run LLM Extraction | `LLLOutput` has entities OR user switches to LLM mode |
| Export Results | User successfully downloads PDF or JSON |

---

## Bug Fix: "Show guidance tips" Toggle ✅ FIXED

**Root cause:** Each component originally called `useGuidance()` independently, creating a separate React
state instance per component (each loaded once from localStorage at mount). Toggling in `SettingSidebar`
only updated that component's own state; the other four components were never re-rendered.

**Fix:** `GuidanceContext.tsx` wraps `useGuidance()` in a React context (`GuidanceProvider`) placed at
the app root in `App.tsx`. All components now call `useGuidanceContext()` to consume the single shared
state instance. When the toggle fires, React propagates the state change to every consumer simultaneously.

```
App.tsx
└── GuidanceProvider          ← single useGuidance() instance lives here
    ├── DocumentList          ← useGuidanceContext() reads shared state
    ├── ResultComponent       ← useGuidanceContext()
    │   ├── Sidebar           ← useGuidanceContext()
    │   ├── LLMSidebar        ← useGuidanceContext()
    │   └── SettingSidebar    ← useGuidanceContext() + toggle writes here
```

---

---

### Phase 5: Extended Coverage — All Remaining Modes ✅ COMPLETED

Four modes previously had zero guidance: **Events**, **Tables**, **Paragraphs**, and **Relations (empty state)**. The SettingSidebar also had two undisplayed items (`summarize-hint`, `save-checkpoint`). This phase fills those gaps.

#### 5.1 New Guidance Items (`guidanceConfig.ts`)

Seven new `GUIDANCE_ITEMS` added:

| ID | Context | Condition | Description |
|----|---------|-----------|-------------|
| `tables-empty` | tables | `!hasTableOutput && mode=Tables` | No tables detected in document |
| `relations-empty` | relations | `mode=Relations && relationCount===0` | No relations found yet, suggest re-running RE model |
| `events-intro` | events | `mode=Events` | Explains what Events mode shows |
| `events-paragraph-filter` | events | `mode=Events` | Explains the paragraph selection filter |
| `paragraphs-intro` | paragraphs | `mode=Paragraphs` | Explains editing and reordering |
| `summarize-hint` | settings | `highlightCount > 0` | Directs user to Summarize Result button |
| `save-checkpoint` | settings | always | Reminds user about checkpoint saving |

#### 5.2 Relations empty-state banner (`Sidebar.tsx`)

Added after the existing `entities-empty` banner — only shows when `selectedMode === 'Relations' && highlights.length === 0`:

```tsx
{highlights.length === 0 && selectedMode === 'Relations' && guidance.shouldShow('relations-empty') && (
  <GuidanceBanner
    id="relations-empty"
    title="No Relations Found"
    description="No relationships were extracted yet. ..."
    severity="warning"
    onDismiss={guidance.dismiss}
    visible={true}
  />
)}
```

Also fixed `entities-empty` condition to also check `selectedMode === 'Entities'` so it no longer shows in Relations mode.

#### 5.3 EventSidebar (`EventSidebar.tsx`)

Added `useGuidanceContext()` and two banners after the description block:
- `events-intro` — always shown on first visit to Events mode
- `events-paragraph-filter` — always shown on first visit, explains the checkbox filter

#### 5.4 TableSidebar (`TableSidebar.tsx`)

Added `useGuidanceContext()` and two banners after the description block:
- `tables-intro` — shown when tables exist (was defined in config but never rendered)
- `tables-empty` — shown when `highlights.length === 0`, warning severity

#### 5.5 ParagraphSidebar (`ParagraphSidebar.tsx`)

Added `useGuidanceContext()` and one banner:
- `paragraphs-intro` — shown on first visit, explains editing and drag-to-reorder

#### 5.6 SettingSidebar — Additional banners

Two previously defined-but-unrendered items now displayed after the mode banners:
- `summarize-hint` (success severity) — only when `highlights.length > 0`
- `save-checkpoint` — always shown until dismissed

#### Coverage Map (after Phase 5)

| Mode / Page | Banners shown | Trigger |
|-------------|--------------|---------|
| Documents (empty) | `first-upload` | no documents |
| Documents (has docs) | `open-document-hint` | all docs complete |
| Entities (has entities) | `entities-intro`, `confirm-entities-hint` | on mode enter |
| Entities (empty) | `entities-empty` | no highlights |
| Relations (has relations) | `relations-intro` | on mode enter |
| Relations (empty) | `relations-empty` | relationCount = 0 |
| Events | `events-intro`, `events-paragraph-filter` | on mode enter |
| Tables (has tables) | `tables-intro` | on mode enter |
| Tables (empty) | `tables-empty` | no table output |
| Paragraphs | `paragraphs-intro` | on mode enter |
| LLM (no output) | `llm-first-run` | on mode enter |
| LLM (has output) | `llm-compare-hint` | has LLM entities |
| Settings sidebar | `switch-to-relations`, `try-llm`, `summarize-hint`, `save-checkpoint`, `export-hint` | various |

---

## Implementation Status: ✅ ALL PHASES COMPLETE (including bug fix)

## Implementation Order

1. **Create `GuidanceSystem/` directory** and all 5 new files
2. **Create `Guidance.css`** and import it in `App.tsx`
3. **Integrate into `ResultComponent.tsx`** — WorkflowStepper + guidance state
4. **Integrate into `Sidebar.tsx`** — entity-mode banners
5. **Integrate into `LLMSidebar.tsx`** — replace static instructions
6. **Integrate into `SettingSidebar.tsx`** — mode-switching hints + toggle
7. **Integrate into `DocumentList.tsx`** — empty-state guidance
8. **Manual testing** — walk through the full workflow as a new user

---

---

### Phase 6: Documentation Improvements ✅ COMPLETED

**Problem:** The existing docs cover only the basic workflow. Three major modes (LLM, Tables, Events) have zero documentation. The Workflow Guide we built has no docs. The FAQ is empty. `result-visualization.md` describes only 3 of 6 modes.

#### 6.1 New markdown pages (v3.1)

| File | Nav title | Covers |
|------|-----------|--------|
| `llm-extraction.md` | LLM Extraction | How to switch to LLM mode, click paragraph blocks, choose prompts, run extraction, compare & merge results |
| `tables.md` | Tables Mode | What tables are, how to view table content, edit, run LLM on a table |
| `events.md` | Events Mode | What events are, paragraph checkbox filter, reading the event list |
| `workflow-guide.md` | Workflow Guide | The 5-step stepper, step conditions, how to collapse, guidance tips toggle |

#### 6.2 Updated markdown pages

| File | What changes |
|------|-------------|
| `result-visualization.md` | Extend Change Mode section to cover all 6 modes (add LLM, Tables, Events) |
| `quickstart.md` | Add Workflow Guide callout; expand step 4 to name all modes |
| `faq.md` | Replace placeholder with 10 real Q&A entries |

#### 6.3 DocsPage.tsx

- Import 4 new markdown files
- Register new pages under `v3.1 > features`:
  - `llm_extraction` → "LLM Extraction"
  - `tables` → "Tables Mode"
  - `events` → "Events Mode"
  - `workflow_guide` → "Workflow Guide"

---

## Future Extensions

- **Guided tour mode** — A step-by-step walkthrough using react-joyride that highlights specific UI elements
- **Keyboard shortcut hints** — Show shortcuts in guidance banners (e.g., "Press Ctrl+S to save")
- **Analytics** — Track which guidance items are dismissed vs actioned to improve content
- **Per-document progress** — Track workflow completion per document, not just globally
- **Onboarding wizard** — A one-time modal for brand-new users with a 3-step intro
