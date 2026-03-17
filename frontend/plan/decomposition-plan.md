# Component Decomposition Plan — PolyMinder v3.3

**Date:** 2026-03-15
**Status:** Plan only — no refactoring applied yet

---

## Cross-Cutting Shared Extractions (Do First)

These patterns are duplicated across multiple large components. Extract them as
shared utilities before decomposing individual files.

### Shared Hooks

| Hook | Files Using It | Description |
|------|---------------|-------------|
| `useLLMSettings` | TableCommentForm, LLMCommentForm | `selectedModel`, `topK`, `topP`, `temperature`, `maxTokens`, `thinkingMode` state + model init effect |
| `useNotification` | EventSidebar, LLMCommentForm, TwoSideComparisonDialog | `openSnackbar`, `notification`, `severity` state + close handler |
| `usePagination` | EventSidebar (reusable) | `currentPage`, `totalPages`, page change handler, reset on mode change |

### Shared Components

| Component | Files Using It | Description |
|-----------|---------------|-------------|
| `LLMSettingsAccordion` | TableCommentForm (L1209-1363), LLMCommentForm (L869-1030) | Advanced settings accordion (model param sliders + thinking mode) |
| `EntityRelationEditDialog` | TableCommentForm (L1722-1967), TwoSideComparisonDialog (L202-561), Sidebar | Tabbed entity/relation editing with EditedEntityComponent |
| `ParagraphSelectionDialog` | EventSidebar (L814-901), ResultComponent (L1404-1546) | Checkbox list of paragraphs with select-all |

### Shared Utilities

| Utility | Files Using It | Description |
|---------|---------------|-------------|
| `parseBratData` | TwoSideComparisonDialog (L126-168), TableCommentForm (L236-264) | Parse BRAT entity/relation format to structured data |

**Suggested location:** `src/components/shared/` for components, `src/hooks/` for hooks, `src/utils/` for utilities.

---

## 1. TableCommentForm.tsx (1,975 lines → ~400 lines)

**Current:** Monolithic form handling table preview, LLM extraction, grid editing, and entity/relation editing.

### Extractions

| # | Name | Type | Lines | New File |
|---|------|------|-------|----------|
| 1 | `useLLMSettings` | hook | L154-168 | `src/hooks/useLLMSettings.ts` (shared) |
| 2 | `useTableBratDocs` | hook | L194-264 | `src/hooks/useTableBratDocs.ts` |
| 3 | `useTableEditGrid` | hook | L833-937 | `src/hooks/useTableEditGrid.ts` |
| 4 | `LLMSettingsAccordion` | component | L1209-1363 | `src/components/shared/LLMSettingsAccordion.tsx` (shared) |
| 5 | `LLMExtractionDialog` | component | L1120-1435 | `src/pdf_highlighter/components/LLMExtractionDialog.tsx` |
| 6 | `TableEditDialog` | component | L1438-1719 | `src/pdf_highlighter/components/TableEditDialog.tsx` |
| 7 | `EntityRelationEditDialog` | component | L1722-1967 | `src/components/shared/EntityRelationEditDialog.tsx` (shared) |
| 8 | `TablePreviewSection` | component | L982-1040 | `src/pdf_highlighter/components/TablePreviewSection.tsx` |

**After:** TableCommentForm becomes an orchestrator (~400 lines) composing these pieces.

**Dependency order:** Extract hooks first (1-3), then shared components (4, 7), then local components (5, 6, 8).

---

## 2. LLMCommentForm.tsx (1,643 lines → ~350 lines)

**Current:** Dual-view form (prepare vs result) with prompt presets, model params, and result actions.

### Extractions

| # | Name | Type | Lines | New File |
|---|------|------|-------|----------|
| 1 | `useLLMSettings` | hook | L287-294 | (shared, already extracted) |
| 2 | `useLLMPrompts` | hook | L296-335 | `src/hooks/useLLMPrompts.ts` |
| 3 | `useEffectiveHighlight` | hook | L238-284 | `src/hooks/useEffectiveHighlight.ts` |
| 4 | `useLLMResultActions` | hook | L463-627 | `src/hooks/useLLMResultActions.ts` |
| 5 | `LLMSettingsAccordion` | component | L869-1171 | (shared, already extracted) |
| 6 | `LLMPrepareView` | component | L683-1317 | `src/pdf_highlighter/components/LLMPrepareView.tsx` |
| 7 | `LLMResultView` | component | L1323-1639 | `src/pdf_highlighter/components/LLMResultView.tsx` |

**After:** LLMCommentForm becomes a mode switcher (~350 lines) between prepare and result views.

---

## 3. ResultComponent.tsx (1,582 lines → ~450 lines)

**Current:** Main workspace orchestrator managing PDF viewer, all sidebars, toolbar, context menus, resizable panels, dialogs, and 6 view modes.

### Extractions

| # | Name | Type | Lines | New File |
|---|------|------|-------|----------|
| 1 | `useHighlightState` | hook | L200-262 | `src/hooks/useHighlightState.ts` |
| 2 | `useHighlightFilters` | hook | L720-790 | `src/hooks/useHighlightFilters.ts` |
| 3 | `useParagraphGeometry` | hook | L556-611 | `src/hooks/useParagraphGeometry.ts` |
| 4 | `useResizablePanels` | hook | L289-350 | `src/hooks/useResizablePanels.ts` |
| 5 | `useLLMComparisonWorkflow` | hook | L300-487 | `src/hooks/useLLMComparisonWorkflow.ts` |
| 6 | `useUpdateHistory` | hook | L813-871 | `src/hooks/useUpdateHistory.ts` |
| 7 | `DocumentInfoDialog` | component | L1288-1400 | `src/components/DocumentInfoDialog.tsx` |
| 8 | `ParagraphSelectionDialog` | component | L1404-1546 | `src/components/shared/ParagraphSelectionDialog.tsx` (shared) |
| 9 | `ModeSpecificPdfLoader` | component | L877-1092 | `src/components/ModeSpecificPdfLoader.tsx` |

**After:** ResultComponent becomes a layout orchestrator (~450 lines) composing sidebar, PDF viewer, toolbar, and dialogs.

**Dependency note:** Extract hooks (1-6) first. `ModeSpecificPdfLoader` (9) depends on highlight state from (1) and filter state from (2) — extract last.

---

## 4. TwoSideComparisonDialog.tsx (1,578 lines → ~250 lines)

**Current:** Side-by-side comparison with already-factored local sub-components, but all in one file.

### Extractions

| # | Name | Type | Lines | New File |
|---|------|------|-------|----------|
| 1 | `parseBratData` | utility | L126-168 | `src/utils/bratParser.ts` (shared) |
| 2 | `CopyButton` | component | L172-188 | `src/components/shared/CopyButton.tsx` |
| 3 | `SectionHeader` | component | L190-200 | `src/components/shared/SectionHeader.tsx` |
| 4 | `EntityEditDialog` | component | L202-561 | Merge with shared `EntityRelationEditDialog` |
| 5 | `AddEntityDialog` | component | L563-670 | `src/components/comparison/AddEntityDialog.tsx` |
| 6 | `EntityListItem` | component | L672-756 | `src/components/comparison/EntityListItem.tsx` |
| 7 | `EntityListSection` | component | L758-804 | `src/components/comparison/EntityListSection.tsx` |
| 8 | `ComparisonColumn` | component | L806-964 | `src/components/comparison/ComparisonColumn.tsx` |
| 9 | `useEntityCRUD` | hook | L1175-1415 | `src/hooks/useEntityCRUD.ts` |
| 10 | `useMergeWorkflow` | hook | L988-1133 | `src/hooks/useMergeWorkflow.ts` |

**After:** TwoSideComparisonDialog becomes a layout shell (~250 lines) with two ComparisonColumns and merge controls.

**Note:** Sub-components are already factored as local functions — this is mostly about moving them to separate files. Lowest effort of all 6 decompositions.

---

## 5. SettingSidebar.tsx (1,454 lines → ~300 lines)

**Current:** Configuration panel with mode selection, entity/relation filters, download, save, and summary.

### Extractions

| # | Name | Type | Lines | New File |
|---|------|------|-------|----------|
| 1 | `useFilterState` | hook | L129-131, L259-263, L449-659 | `src/hooks/useFilterState.ts` |
| 2 | `useSummary` | hook | L143-181 | `src/hooks/useSummary.ts` |
| 3 | `useDownload` | hook | L133-135, L269-422 | `src/hooks/useDownload.ts` |
| 4 | `useCheckpointSave` | hook | L137-217 | `src/hooks/useCheckpointSave.ts` |
| 5 | `ModeFilterList` | component | L683-916 | `src/components/settings/ModeFilterList.tsx` |
| 6 | `DownloadDialog` | component | L1124-1219 | `src/components/settings/DownloadDialog.tsx` |
| 7 | `FilterSubDialog` | component | L1223-1270 | `src/components/settings/FilterSubDialog.tsx` |
| 8 | `CheckpointDialog` | component | L1272-1292 | `src/components/settings/CheckpointDialog.tsx` |
| 9 | `SummaryDialog` | component | L1294-1436 | `src/components/settings/SummaryDialog.tsx` |

**After:** SettingSidebar becomes a sidebar shell (~300 lines) with mode selection and composed dialogs.

**Dependency note:** `useDownload` depends on `useFilterState` (reads `checkedItems`). Extract `useFilterState` first.

---

## 6. EventSidebar.tsx (962 lines → ~250 lines)

**Current:** Event list with edit, delete, star, and paragraph selection.

### Extractions

| # | Name | Type | Lines | New File |
|---|------|------|-------|----------|
| 1 | `useNotification` | hook | L146-152 | `src/hooks/useNotification.ts` (shared) |
| 2 | `usePagination` | hook | L172-255 | `src/hooks/usePagination.ts` (shared) |
| 3 | `useEventEditing` | hook | L81-139, L272-319 | `src/hooks/useEventEditing.ts` |
| 4 | `useEditStatus` | hook | L321-383 | `src/hooks/useEditStatus.ts` |
| 5 | `useEventDelete` | hook | L386-445 | `src/hooks/useEventDelete.ts` |
| 6 | `useParagraphSelection` | hook | L155-244 | `src/hooks/useParagraphSelection.ts` |
| 7 | `EventEditDialog` | component | L632-812 | `src/components/events/EventEditDialog.tsx` |
| 8 | `ParagraphSelectionDialog` | component | L814-901 | (shared, already extracted) |
| 9 | `EventListItem` | component | L508-604 | `src/components/events/EventListItem.tsx` |

**After:** EventSidebar becomes a list view (~250 lines) with pagination and composed dialogs.

---

## Implementation Order

**Phase A: Shared foundations (no component changes needed)**
1. Create `src/hooks/useLLMSettings.ts`
2. Create `src/hooks/useNotification.ts`
3. Create `src/hooks/usePagination.ts`
4. Create `src/utils/bratParser.ts`
5. Create `src/components/shared/LLMSettingsAccordion.tsx`
6. Create `src/components/shared/EntityRelationEditDialog.tsx`
7. Create `src/components/shared/ParagraphSelectionDialog.tsx`

**Phase B: Simplest decompositions**
8. TwoSideComparisonDialog (already factored, just move to files)
9. EventSidebar (smallest, fewest dependencies)

**Phase C: Medium decompositions**
10. SettingSidebar (clear dialog extractions)
11. ResultComponent (most dependencies, but clear hook boundaries)

**Phase D: Complex decompositions**
12. LLMCommentForm (view mode split)
13. TableCommentForm (most extractions, largest file)

---

## Expected Results

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| TableCommentForm.tsx | 1,975 | ~400 | -80% |
| LLMCommentForm.tsx | 1,643 | ~350 | -79% |
| ResultComponent.tsx | 1,582 | ~450 | -72% |
| TwoSideComparisonDialog.tsx | 1,578 | ~250 | -84% |
| SettingSidebar.tsx | 1,454 | ~300 | -79% |
| EventSidebar.tsx | 962 | ~250 | -74% |
| **Total** | **9,194** | **~2,000** | **-78%** |

New files created: ~30 (hooks + components + utilities)
Net code change: slight increase (~500 lines) due to import boilerplate,
but each file becomes independently testable and maintainable.
