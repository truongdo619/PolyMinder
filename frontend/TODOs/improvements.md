# PolyMinder Improvement TODOs

Generated: 2026-03-17

---

## 🔴 High Priority (Correctness & Stability)

### 1. Migrate existing API call sites to `src/api/` layer
The `src/api/` modules were created but none of the 80+ existing call sites have been
migrated. Until migration happens, the API layer provides no benefit.
- Start with `DocumentList.tsx` (fetchDocuments, upload, delete)
- Then `ResultComponent.tsx` (re-extract, save, update history)
- Then `SettingSidebar.tsx` (save, download)
- Benefit: consistent error handling, easier to mock in tests, single place to change
  base URLs or auth headers

### 2. Add a test framework
There are zero tests in the codebase. Even basic smoke tests would catch regressions.
- Install Vitest (works natively with Vite, zero config)
- Add unit tests for pure utility functions first:
  - `src/lib/` — coordinate math, bounding rect calculation
  - `src/api/` — new API layer functions (easy to mock axiosInstance)
  - `src/lib/settingsHelpers.ts` — entity/relation schema helpers
- Add component render tests for stateless components using `@testing-library/react`
- Add `"test": "vitest"` script to package.json

### 3. Fix `exhaustive-deps` ESLint warnings
Running `npm run lint` shows many `react-hooks/exhaustive-deps` warnings. These indicate
that useEffect/useCallback/useMemo hooks have stale closure bugs where they silently use
outdated state or prop values. Each warning should be investigated and either:
- Fixed by adding the missing dependency
- Suppressed with a `// eslint-disable-next-line` comment + explanation of why it's safe

### 4. Replace `as { ... }` type casts in authenticate.ts and axiosSetup.ts
The error handling in these files uses `error as { response?: ... }` casts. Replace with
a proper axios error type guard using `axios.isAxiosError(error)` which is the correct
typed approach:
```ts
import axios from 'axios';
if (axios.isAxiosError(error)) {
  const detail = error.response?.data?.detail;
}
```

### 5. Handle task polling cancellation in DocumentList
The polling interval for upload task status (`setInterval` in DocumentList) runs even
after a document's task is complete in some edge cases. Ensure intervals are cleared
when `status === 'completed'` or `status === 'failed'`.

---

## 🟡 Medium Priority (UX & Reliability)

### 6. User-facing error messages (snackbar notifications)
Most API errors currently only `console.error`. Users see no feedback when something
fails. Add Snackbar notifications for:
- Upload failures (network error, file too large, unsupported format)
- Save/download failures
- Re-extraction failures
- LLM call failures (timeout, quota exceeded)
The `DocumentList.tsx` already has a Snackbar pattern — replicate it in other pages.

### 7. Loading states for LLM and extraction operations
Long-running operations (LLM inference, re-extract all entities) block the UI but give
no progress indication beyond a spinner. Consider:
- Showing estimated time or step count ("Running NLP model (step 2/3)...")
- Using the `/task-status/:id` polling pattern (already used for uploads) for other
  long operations if the backend supports it
- Disable affected buttons while operation is in progress (some already do this)

### 8. Keyboard accessibility and focus management
- The annotation workspace (`ResultComponent`) traps focus poorly when dialogs open
- Entity type select in `CommentForm` should be keyboard-navigable
- After closing a dialog, focus should return to the trigger element
- Add `aria-label` attributes to icon-only buttons (Download, Delete, Print icons)

### 9. PDF page navigation
Currently the PDF viewer scrolls continuously through all pages. For long documents
(50+ pages), this is slow to navigate. Add:
- A page number input / jump-to-page control in the toolbar
- Keyboard shortcuts (← → or Page Up/Down) to jump between pages
- The `PDFpageChange` callback is already wired up in `ResultComponent` — it just
  needs a UI control

### 10. Undo / redo for entity edits
Currently there is no way to undo an accidental entity delete or type change. The
backend has update history (`/get-update-history/:id`) but it requires a full page
reload. A lightweight in-memory undo stack for the current session would significantly
improve the annotation workflow.

### 11. Responsive layout for smaller screens
The annotation workspace (`ResultComponent`) uses a fixed two-column layout that breaks
below ~1200px viewport width. The sidebar panels (Sidebar, ParagraphSidebar, etc.)
should collapse to a drawer/tab on smaller screens rather than overflowing.

---

## 🟢 Code Quality & Maintainability

### 12. Execute the component decomposition plan
`plan/decomposition-plan.md` describes how to split the 6 oversized components.
Priority order (highest line count first):
1. `TableCommentForm.tsx` (1975 lines) — extract table editing panel, cell editor, entity mapper
2. `LLMCommentForm.tsx` (1643 lines) — extract prompt editor, result preview, diff viewer
3. `TwoSideComparisonDialog.tsx` (1578 lines) — extract merge controls, diff panel
4. `ResultComponent.tsx` (1381 lines) — extract mode controllers, hash routing hook
5. `SettingSidebar.tsx` (1389 lines) — extract filter panel, download options, statistics
6. `EventSidebar.tsx` (938 lines) — extract event editor, argument list

### 13. Split GlobalContext into focused contexts
`GlobalContext` holds 9 unrelated pieces of state (`bratOutput`, `tableOutput`,
`LLLOutput`, `documentId`, `updateId`, `fileName`, `supportedModels`, `settings`).
Any state change re-renders the entire app tree. Split into:
- `DocumentContext` — documentId, updateId, fileName
- `AnnotationContext` — bratOutput, tableOutput, LLLOutput
- `AppSettingsContext` — settings, supportedModels
This is a medium-risk refactor — should be done carefully with the test suite in place.

### 14. Add `useCallback`/`useMemo` to heavy components
Inline arrow functions and object literals in JSX props create new references every
render, causing unnecessary child re-renders. Key locations:
- `ResultComponent` — all handler functions passed to Sidebar, SettingSidebar, Toolbar
- `Sidebar` — `editHighlight`, `onHighlightClick` callbacks
- `ParagraphSidebar` — drag-and-drop handlers
- `SettingSidebar` — filter computation (`countOccurrences`, `sortedRelationOccurrences`)

### 15. Consistent auth token retrieval
`localStorage.getItem('accessToken')` is called inline in 80+ places. Centralise into
a helper:
```ts
// src/lib/auth.ts
export const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`
});
```
The new `src/api/` layer already does this — migrate remaining call sites.

### 16. Remove remaining `any` types caught by ESLint
`npm run lint` reports `@typescript-eslint/no-explicit-any` warnings. Key files:
- `src/pdf_highlighter/components/LLMCommentForm.tsx` — brat_item and output types
- `src/components/TwoSideComparisonDialog.tsx` — merge response types
- `src/GlobalState.tsx` — bratOutput/tableOutput/LLLOutput typed as `any`

---

## 🔵 Feature Ideas

### 17. Offline / draft saving
Annotations are lost if the browser closes before the user clicks Save. Add:
- Auto-save to `localStorage` every 30 seconds as a draft
- On next page load, detect an unsaved draft and offer to restore it
- Visual indicator showing "Unsaved changes" vs "Saved"

### 18. Export to different formats
Currently exports JSON and highlighted PDF. Add:
- CSV export of entity table (entity text, type, page number, paragraph)
- BioNLP/BRAT `.ann` format export for interoperability with other annotation tools
- Excel/XLSX via `xlsx` library for non-technical users

### 19. Multi-document search
Add a search across all uploaded documents to find specific polymer names or entity
types without opening each document individually. The backend would need a new
`/search` endpoint.

### 20. Annotation guidelines / label descriptions
The entity type selector (`CommentForm`) shows only the type name (e.g. `POLYMER`,
`PROP_NAME`). Add tooltips or a collapsible help panel showing:
- What each entity type means
- Example text for each type
- Which relation types are allowed between which entity types
This reduces annotation errors by new users.

### 21. Dark mode
MUI 5 supports dark mode via `createTheme({ palette: { mode: 'dark' } })`. The
`HomePage` already uses `getLPTheme` which supports both modes. Extend to the
annotation workspace and persist the user's preference in `localStorage`.

### 22. Collaborative annotation
Currently one user annotates at a time. For larger projects, add:
- Document locking (show who is currently editing a document)
- Annotation comparison between two users (inter-annotator agreement)
- Comment threads on specific entities/relations for discussion

---

## 🏗️ Infrastructure

### 23. Docker / deployment automation
Provide a `docker-compose.yml` that starts both the frontend and the FastAPI backend
together. Currently deploying requires manual steps. A single `docker-compose up` would
lower the barrier for self-hosting.

### 24. Environment-based configuration
Currently `VITE_BACKEND_URL` and `VITE_PDF_BACKEND_URL` must be set at build time,
meaning a separate build is needed for each deployment target. Consider making the
backend URL configurable at runtime by fetching it from `/config.json` (similar to how
`/settings.json` is already loaded at runtime).

### 25. CI/CD pipeline
Add a GitHub Actions workflow that:
- Runs `npx tsc --noEmit` on every PR
- Runs `npm run lint`
- Runs `npm run build` to verify production build
- (Optional) Deploys to the JAIST server on merge to main
