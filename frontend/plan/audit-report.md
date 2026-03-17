# PolyMinder v3.3 — Comprehensive Audit Report

**Date:** 2026-03-15
**Scope:** Code audit, performance analysis, API layer review, build & DX

---

## Phase 1: Code Audit & Static Analysis

### 1. TypeScript Strictness

**`tsconfig.json` status:**
- `strict: true` — already enabled (includes `strictNullChecks`, `noImplicitAny`, etc.)
- `noUnusedLocals: true` — enabled
- `noUnusedParameters: false` — **LOOSE** (recommend enabling)
- `noImplicitReturns: true` — enabled
- `skipLibCheck: true` — acceptable (fixes WeakMap build bugs)

**CRITICAL ISSUE FIXED:** `include` was `["src/pdf_highlighter"]` — only the library
sub-package was type-checked! Changed to `["src"]` to cover the full codebase.

**Result: 682 TypeScript errors surfaced** (build still passes via esbuild):

| Error Code | Count | Description |
|------------|-------|-------------|
| TS6133 | 339 | Unused variables/imports (dead code) |
| TS2307 | 100 | Cannot find module (image imports, missing `.d.ts`) |
| TS2339 | 100 | Property does not exist on type |
| TS7006 | 24 | Implicit `any` on parameters |
| TS18048 | 18 | Possibly `undefined` value |
| TS7031 | 7 | Binding element implicitly `any` |
| TS18047 | 6 | Possibly `null` value |
| Other | 88 | Various type errors (TS2345, TS2353, TS7034, etc.) |

**Quick fix needed:** Add `src/global.d.ts` with image module declarations:
```typescript
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.PNG';
declare module '*.JPG';
declare module '*.JPEG';
```

**Quick fix needed:** Add `"resolveJsonModule": true` to `compilerOptions` (fixes TS2732).

**Quick fix needed:** Add Vite client types reference for `import.meta.env`:
```typescript
/// <reference types="vite/client" />
```

### 2. Dead Code & Stale Files

**Files deleted (confirmed zero imports):**
- `src/components/LLMSidebar copy.tsx` (441 lines) — stale copy of ParagraphSidebar
- `src/DocumentListPage/DocumentList.legacy.tsx` (476 lines) — legacy backup
- `src/DocsPage/pages/v3.0/Editing-function copy.tsx` (137 lines) — stale docs copy
- `src/context.ts` (1 line) — unused re-export with incorrect path (`../../pdf_highlighter`)

**Total lines removed:** 1,055

**Unused imports/variables (339 instances):** Most are in DocsPage (`DocLink`,
`DocList`, `DocCallout`, etc. imported but unused). Also scattered across:
- `ContactSupportPage.tsx`: `setShowCustomTheme` unused
- `DocsPage.tsx`: `Divider`, `Collapse`, `InputLabel`, `ExpandLess`, `ExpandMore`,
  `toggleSection`, `open` unused
- Multiple v3.0/v3.1/v3.2 doc pages: `tableStyle`, `thStyle`, `tdStyle` unused

**Recommendation:** Run auto-fix for unused imports. Many are just leftover from
copy-paste of doc pages. Estimate: ~200 of the 339 are in DocsPage files.

### 3. Duplicate Type Definitions

**`CommentedHighlight` — CONSOLIDATED:**
- Canonical definition: `src/pdf_highlighter/types.ts` (lines 179-182)
- `src/types.ts` now re-exports from `react-pdf-highlighter-extended` (was a duplicate definition)
- 19 files import from `src/types.ts`, 10 from `pdf_highlighter/types.ts` — all now use the
  same underlying definition

### 4. Duplicate Re-exports

**`src/context.ts` — DELETED** (zero imports, wrong path anyway)

**`src/react-pdf-highlighter-extended.ts` — KEPT** (13 files import from it)
- This is the sole entry point for the `pdf_highlighter` library from app code
- No consolidation needed now that `context.ts` is removed

### 5. Duplicate Theme File

**`getLPTheme.tsx` exists in two locations (632 lines each, byte-identical):**
- `src/HomePage/getLPTheme.tsx`
- `src/ContactSupportPage/getLPTheme.tsx`

**Recommendation:** Move to `src/lib/getLPTheme.tsx` or `src/theme/getLPTheme.tsx`
and import from both pages. Saves 632 lines.

---

## Phase 2: Performance Optimization

### 4. Bundle Size Analysis

**Current production build:**
- **JS:** 3,588 kB (902 kB gzipped) — single chunk, no code splitting
- **CSS:** 267 kB (43 kB gzipped)
- **Images:** 15+ MB total, including `visualization.drawio.png` at 7,405 kB

#### Unused Dependencies (can be removed from `package.json`):

| Package | Size Impact | Reason |
|---------|------------|--------|
| `react-draggable` | ~40 kB | Zero imports in codebase |
| `react-dropzone` | ~25 kB | Zero imports (uses `react-drag-drop-files` instead) |
| `cytoscape` | ~600 kB | Zero imports in codebase |
| `react-cytoscapejs` | ~10 kB | Zero imports in codebase |

#### Unused-in-practice Dependencies:

| Package | Used By | Issue |
|---------|---------|-------|
| `reactflow` | Only `MyCustomNode.tsx` | `MyCustomNode` is never imported anywhere (~300 kB wasted) |
| `mui-datatables` | Only `DocumentList.tsx` and deleted legacy file | Consider replacing with already-used `@mui/x-data-grid-pro` |

#### Drag Library Audit:
- `react-beautiful-dnd` — **USED** by ParagraphSidebar, TableSidebar (drag-to-reorder)
- `react-rnd` — **USED** by AreaHighlight (resize/drag area highlights)
- `react-draggable` — **NOT USED** (remove)

#### Heavy Dependencies That Should Be Lazy-Loaded:
- `vis-network` (~400 kB) — only used by SummerizeGraph + TreeVisualizationExample
- `pdfjs-dist` (~800 kB) — only needed on /result route
- `@mui/x-data-grid-pro` — only needed on /documents route

#### Large Image Assets:
- `visualization.drawio.png` — **7,405 kB** (used only in docs v3.1/v3.2). Consider:
  converting to WebP/AVIF, compressing, or hosting externally
- `PDFResult.png` — 1,959 kB (docs only)
- `scott-webb-hDyO6rr3kqk-unsplash.jpg` — 1,471 kB (homepage hero)
- `signin_page.png` — 772 kB (docs only)

#### Code Splitting Recommendations:

```typescript
// App.tsx — lazy load heavy routes
const ResultComponent = React.lazy(() => import('./components/ResultComponent'));
const DocumentListPage = React.lazy(() => import('./DocumentListPage/DocumentListPage'));
const DocsPage = React.lazy(() => import('./DocsPage/DocsPage'));
const SummerizeGraph = React.lazy(() => import('./components/SummerizeGraph'));
```

#### Vite Chunk Splitting:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'pdf-viewer': ['pdfjs-dist'],
        'vis': ['vis-network/standalone'],
        'mui': ['@mui/material', '@mui/icons-material'],
        'data-grid': ['@mui/x-data-grid-pro'],
      }
    }
  }
}
```

**Estimated savings:** Removing unused deps + code splitting could reduce initial
load from 3,588 kB to ~1,200-1,500 kB.

### 5. Large Component Decomposition

See separate file: `plan/decomposition-plan.md`

### 6. Unnecessary Re-renders

**Issues found:**

1. **No `useMemo`/`useCallback` in ResultComponent.tsx (1,582 lines)**
   - Event handlers defined inline on every render
   - Derived data (filtered highlights, extracted relations) recalculated each render
   - `scrollToHighlightFromHash` function recreated every render, causes event listener
     re-registration (line 702)

2. **No `useMemo`/`useCallback` in Sidebar.tsx (851 lines)**
   - `filterHighlights()` defined inline
   - Complex object conversions not memoized

3. **40+ inline `sx={{...}}` objects in SettingSidebar.tsx, Sidebar.tsx, ResultComponent.tsx**
   - MUI components receive new object references every render
   - Especially impactful inside `.map()` loops (new object per list item per render)

4. **GlobalProvider context** — `useMemo` is used for the context value (good), but
   the context holds ~15 state values. Any change to any one value re-renders the
   entire tree. Consider splitting into:
   - `DocumentContext` (documentId, updateId, fileName)
   - `OutputContext` (bratOutput, tableOutput, LLLOutput)
   - `SettingsContext` (settings, supportedModels)

### 7. Memory Leaks

**Event listeners:** All 11 addEventListener instances have proper cleanup.

**ResizeObserver:** All 3 instances properly disconnect().

**No MutationObserver usage found.**

**Axios requests:** NO AbortController anywhere. Components making API calls
(ResultComponent, Sidebar, SettingSidebar, ParagraphSidebar, TableSidebar,
EventSidebar, TwoSideComparisonDialog) risk setState-on-unmounted-component.

**BRAT scripts (GlobalState.tsx):**
- 10 scripts loaded dynamically, never removed from DOM
- If `bratBaseUrl` changes, old scripts persist; new ones added
- Cancellation flag prevents further loading but doesn't remove loaded scripts
- Low priority: scripts are needed for app lifetime, acceptable leak

**Uncanceled setTimeout (2 instances):**
- `ResultComponent.tsx:686-690` — 50ms hash update timer, no cleanup
- `Sidebar.tsx:362-369` — 100ms scroll-into-view timer, no cleanup

---

## Phase 3: API Layer Hardening

### 8. API Call Distribution

**Total API call sites: ~61 across 21 files**

Currently scattered across components with no centralization. Proposed `src/api/` structure:

| Module | Endpoints | Current locations |
|--------|----------|-------------------|
| `auth.ts` | login, register, refresh, forgot/reset password | authenticate.ts, SignInPage, SignUpPage |
| `documents.ts` | CRUD, upload, download, task status | DocumentList.tsx, SettingSidebar |
| `entities.ts` | create, update, delete, visibility, edit status | Sidebar, ResultComponent, EventSidebar |
| `relations.ts` | update relations | Sidebar, ResultComponent |
| `llm.ts` | run, parse, compare, merge, update, delete | LLMCommentForm, TwoSideComparisonDialog |
| `tables.ts` | generate, edit, update entities/relations | TableCommentForm, TableSidebar |
| `paragraphs.ts` | edit, reorder | ParagraphSidebar |
| `export.ts` | save, download highlighted/json/entity/para | SettingSidebar, ResultComponent |

### 9. Error Handling

**Summary:**

| Metric | Count | % |
|--------|-------|---|
| API calls with try-catch | ~30 | 49% |
| API calls without error handling | ~31 | 51% |
| Calls with user-facing notification | ~20 | 33% |
| Calls with only console.error | ~30 | 49% |
| Empty catch blocks | 1 | 1.6% |

**Empty catch block:** `TableCommentForm.tsx:199` — `try { JSON.parse(raw); } catch {}`

**Silent error swallowing:** Many `catch(error) { console.error(error) }` blocks
with no user notification:
- `SettingSidebar.tsx:167, 213, 392, 417`
- `ResultComponent.tsx:478, 534, 829, 865`
- `EventSidebar.tsx:239`
- `ParagraphSidebar.tsx:203, 280`
- `TableSidebar.tsx:203, 280`

**Axios interceptor (axiosSetup.ts):** Works correctly for 401 refresh flow.
However, sets `axios.defaults.headers.common` (global) instead of only the
instance headers — potential issue if multiple instances exist.

---

## Phase 4: Build & Developer Experience

### 10. ESLint

**Not installed.** No linting configuration exists.

**Recommendation:** Install:
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks
```

Add `"lint": "eslint src/ --ext .ts,.tsx"` to package.json scripts.

Key rules to enforce:
- `react-hooks/rules-of-hooks` (error)
- `react-hooks/exhaustive-deps` (warn)
- `@typescript-eslint/no-unused-vars` (error, replaces tsc TS6133)
- `@typescript-eslint/no-explicit-any` (warn)

### 11. Vite Config Review

**Current issues:**

1. **Source maps in production:** `sourceMap` not configured in vite build —
   defaults to off (acceptable, but `tsconfig.json` has `sourceMap: true` which
   only affects tsc, not the Vite build)

2. **No chunk splitting:** Single 3.6 MB JS bundle. Fix with `manualChunks`
   (see bundle size section above)

3. **No dev server proxy:** Backend on different port requires CORS. Consider:
   ```typescript
   server: {
     proxy: {
       '/api': 'http://localhost:8000'
     }
   }
   ```

4. **Missing `build.sourcemap` option:** Consider `'hidden'` for production
   debugging without exposing to users

---

## Quick Wins Applied

| Change | Impact |
|--------|--------|
| Deleted `LLMSidebar copy.tsx` | -441 lines dead code |
| Deleted `DocumentList.legacy.tsx` | -476 lines dead code |
| Deleted `Editing-function copy.tsx` | -137 lines dead code |
| Deleted `context.ts` | -1 line dead code |
| Consolidated `CommentedHighlight` type | Eliminated duplicate definition |
| Widened `tsconfig.json` include to `src/` | Full codebase now type-checked |

**Build verified:** `npx vite build` passes after all changes.

---

## Priority Action Items

### P0 — High Impact, Low Effort
1. Remove unused dependencies (`react-draggable`, `react-dropzone`, `cytoscape`,
   `react-cytoscapejs`) — saves ~675 kB
2. Add `global.d.ts` for image imports + `resolveJsonModule` — fixes ~103 TS errors
3. Clean up unused imports in DocsPage files — fixes ~200 TS errors
4. Add `React.lazy()` for `/result`, `/documents`, `/docs` routes — immediate load reduction
5. Install ESLint with react-hooks plugin

### P1 — High Impact, Medium Effort
6. Add Vite `manualChunks` configuration — proper chunk splitting
7. Delete `MyCustomNode.tsx` + remove `reactflow` dependency — saves ~300 kB
8. Deduplicate `getLPTheme.tsx` — saves 632 lines
9. Centralize API calls into `src/api/` modules
10. Add AbortController to axios calls in components with unmount risk

### P2 — Medium Impact, Higher Effort
11. Fix remaining ~280 TypeScript errors (TS2339, TS7006, TS18048, etc.)
12. Add `useCallback`/`useMemo` to ResultComponent and Sidebar
13. Extract inline `sx` objects to constants or `useMemo`
14. Clean up setTimeout timers with proper cleanup returns
15. Compress/optimize large image assets (especially 7.4 MB drawio PNG)

### P3 — Strategic Improvements
16. Decompose large components (see `plan/decomposition-plan.md`)
17. Split GlobalContext into focused contexts
18. Add consistent error handling with user-facing notifications
19. Consider replacing `mui-datatables` with `@mui/x-data-grid-pro`
