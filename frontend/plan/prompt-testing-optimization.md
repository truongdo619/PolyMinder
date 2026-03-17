# Prompt: Comprehensive Testing & Source Code Optimization for PolyMinder v3.3

Read CLAUDE.md first for full project context.

## Phase 1: Code Audit & Static Analysis ✅ COMPLETED

1. **TypeScript strictness** ✅ — Enabled `strict` mode in `tsconfig.json`, fixed
   `include` from `["src/pdf_highlighter"]` to `["src"]`, added `resolveJsonModule`,
   `noUnusedLocals`, `noImplicitReturns`. Fixed all 682 → 0 type errors across the
   entire codebase. Created `src/global.d.ts` for ambient declarations (image modules,
   mui-datatables, jQuery/BRAT globals) and `src/axios.d.ts` for axios module
   augmentation.

2. **Dead code & stale files** ✅ — Removed:
   - `src/components/LLMSidebar copy.tsx` (stale copy, nothing imported it)
   - `src/DocumentListPage/DocumentList.legacy.tsx` (legacy backup)
   - `src/DocsPage/pages/v3.0/Editing-function copy.tsx` (duplicate)
   - `src/context.ts` (duplicate re-export)
   - `src/HomePage/getLPTheme.tsx` (deduplicated to `src/lib/getLPTheme.tsx`)
   - `src/ContactSupportPage/getLPTheme.tsx` (deduplicated)
   - `src/pdf_highlighter/components/MyCustomNode.tsx` (unused)
   - ~300 unused imports removed across 50+ DocsPage files and 14 component files
   - `CommentedHighlight` consolidated: `src/types.ts` now re-exports from
     `src/pdf_highlighter/types.ts`

3. **Duplicate re-exports** ✅ — `src/context.ts` deleted. All imports consolidated
   to use `src/react-pdf-highlighter-extended.ts` as the single entry point.

## Phase 2: Performance Optimization ✅ COMPLETED

4. **Bundle size** ✅ — Initial JS reduced from 3,588 kB to 118 kB (97% reduction):
   - Route-level code splitting with `React.lazy()` + `Suspense` for
     DocumentListPage, ResultComponent, DocsPage
   - Vite `manualChunks`: pdf-viewer, vis, mui-core, data-grid
   - Removed unused dependencies: react-draggable, react-dropzone, cytoscape,
     react-cytoscapejs, reactflow (~975 kB saved)
   - Added `sourcemap: "hidden"` for production builds

5. **Large component decomposition** ✅ — Plan created at
   `plan/decomposition-plan.md` with extraction tables for 6 large components.
   (Implementation deferred per plan instructions — "Do NOT refactor yet")

6. **Unnecessary re-renders** — Documented in audit report. Key finding: GlobalContext
   re-renders entire subtree on any state change. Splitting contexts recommended but
   deferred (risk of breaking changes in a large refactor).

7. **Memory leaks** ✅ — Audited and fixed:
   - ResizeObserver cleanup in SummerizeGraph
   - setTimeout cleanup in SummerizeGraph useEffect
   - All useEffect event listeners verified to have cleanup returns

## Phase 3: API Layer Hardening ✅ COMPLETED

8. **Centralize API calls** ✅ — Created `src/api/` directory with typed modules:
   - `auth.ts` — login, register, forgotPassword, resetPassword
   - `documents.ts` — fetchDocuments, getDocument, deleteDocument, uploadPdf,
     uploadPdfWithJson, downloadDocument, getTaskStatus
   - `entities.ts` — createEntity, updateEntity, deleteEntity, setVisible,
     changeEditStatus, applyUpdate
   - `relations.ts` — updateRelations
   - `llm.ts` — runWithLLM, parseLLMOutput, compareWithModelOutput, mergeLLMResult
   - `tables.ts` — generateTableContent, editTables
   - `paragraphs.ts` — editParagraph, reorderParagraph
   - `export.ts` — saveDocument, downloadHighlightedDocument, downloadJson,
     downloadEntity, downloadParaInfo
   - `index.ts` — re-exports everything
   All functions use shared axios instance with proper TypeScript types.
   (Migration of existing call sites to use the new API layer is a follow-up task)

9. **Error handling** ✅ — Audited all try/catch blocks:
   - No silent `catch(e) {}` blocks found
   - All catch blocks have `console.error` logging
   - 401s handled by axios interceptor in `axiosSetup.ts`
   - Fixed `error: any` casts to proper type guards in authenticate.ts and
     DocumentList.tsx

## Phase 4: Build & Developer Experience ✅ COMPLETED

10. **Add ESLint** ✅ — Installed and configured:
    - `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`
    - `eslint-plugin-react-hooks` (rules-of-hooks: error, exhaustive-deps: warn)
    - `eslint-plugin-react` (jsx best practices)
    - Added `"lint": "eslint src --ext .ts,.tsx"` to package.json
    - `.eslintrc.json` created with recommended presets

11. **Vite config review** ✅ — Updated `vite.config.ts`:
    - Source maps: `sourcemap: "hidden"` (separate, not inlined)
    - Chunk splitting: `manualChunks` for pdf-viewer, vis, mui-core, data-grid
    - Dev server: `host: "0.0.0.0", port: 3002` (already configured)
