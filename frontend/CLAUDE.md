# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PolyMinder is a React/TypeScript SPA for visualizing and annotating scientific PDFs, focused on extracting polymer-related entities and relationships from scientific literature. It connects to a Python FastAPI backend for NLP processing and LLM-assisted extraction.

**Version:** 3.1.0 (exposed as `APP_VERSION` at build time via `vite.config.ts`)

## Common Commands

| Command | Description |
|---------|-------------|
| `npm start` / `npm run dev` | Start Vite dev server (`0.0.0.0:3002`) |
| `npm run build` | Production build to `dist/` |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run build:docs` | Generate TypeDoc API docs for `pdf_highlighter` |
| `npm run clean` | Remove `dist/` and `public/` |

No test framework is configured — there are no test files or test runner.

## Architecture

**Stack:** React 18 + TypeScript 5 + Vite 4 + MUI 5

### Routing

HashRouter (`react-router-dom` v6) defined in `src/App.tsx`:

| Route | Component | Auth Required |
|-------|-----------|:---:|
| `/home` | `HomePage` | No |
| `/signin` | `SignInPage` | No |
| `/signup` | `SignUpPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/profile` | `ProfilePage` | No |
| `/support` | `ContactSupportPage` | No |
| `/documents` | `DocumentListPage` | Yes |
| `/result` | `ResultComponent` | Yes |
| `/docs/:version/:section/:page` | `DocsPage` | No |

Protected routes use a `<ProtectedRoute>` wrapper that checks `AuthContext.isAuthenticated` and redirects to `/signin`.

### State Management

Two React Context providers wrap the app in `src/App.tsx`:

- **`GlobalProvider`** (`src/GlobalState.tsx`) — Holds `bratOutput`, `tableOutput`, `LLLOutput` (note: variable is named `LLLOutput`, not `LLMOutput`), `documentId`, `updateId`, `fileName`, `supportedModels`, and `settings`. Also dynamically loads BRAT visualization scripts (jQuery + brat-client JS) based on `settings.bratBaseUrl`.

- **`AuthProvider`** (`src/AuthContext.tsx`) — Simple boolean `isAuthenticated` state. Checks `localStorage` for `accessToken`, `refreshToken`, and `username` on mount. Authentication functions (`authenticate`, `refreshAccessToken`, `register`, `logout`) live in `src/authenticate.ts`.

**Auth flow:** `src/axiosSetup.ts` exports a shared Axios instance with a response interceptor that catches 401s, calls `refreshAccessToken()`, and retries the original request. On refresh failure, it clears localStorage tokens.

### Key Modules

#### `src/pdf_highlighter/` — PDF Highlighting Library

Self-contained, reusable library built on `pdfjs-dist` (v2.16.105). Designed as an independent package (ESM + CJS exports via `package.json`) but lives in-tree.

**Components** (in `components/`):
- `PdfHighlighter` (899 lines) — Core rendering engine, manages PDF viewer, highlight layers, and selection
- `PdfLoader` — Handles PDF document loading and error states
- `TextHighlight` / `AreaHighlight` — Render text and area highlight overlays
- `HighlightLayer` — Composites highlights per page
- `MouseSelection` — Drag-to-select interaction
- `TipContainer` / `MonitoredHighlightContainer` — Tooltip and highlight container management
- `CommentForm` — Entity annotation form (with download entity/paragraph info)
- `LLMCommentForm` (1643 lines) — LLM-assisted extraction form (run-with-LLM, parse-LLM-output, compare-with-model-output endpoints)
- `TableCommentForm` (1975 lines) — Table extraction and editing form
- `BratEmbedding` / `BratEmbeddingDefault` — Embeds BRAT annotation visualizations
- `TreeVisualizationExample` / `MyCustomNode` — ReactFlow-based tree visualization

**Contexts** (in `contexts/`):
- `PdfHighlighterContext` — Provides `PdfHighlighterUtils` (scroll, zoom, selection management)
- `HighlightContext` — Provides `HighlightContainerUtils` (highlight editing callbacks)

**Lib** (in `lib/`): Coordinate conversion, bounding rect calculation, client rect optimization, text selection utilities, screenshot capture.

**Types** (`types.ts`): Core types — `Highlight`, `GhostHighlight`, `ViewportHighlight`, `PdfSelection`, `ScaledPosition`, `ViewportPosition`, `LTWH`, `LTWHP`, `Scaled`, `Content`, `Tip`, `PdfScaleValue`, `CommentedHighlight`.

**Re-export:** `src/context.ts` re-exports everything from `src/pdf_highlighter/`. `src/react-pdf-highlighter-extended.ts` also re-exports from `pdf_highlighter`.

#### `src/components/` — Annotation Workspace Components

Largest components by size:
- `TwoSideComparisonDialog` (1578 lines) — Side-by-side annotation comparison and merge tool (merge-LLM-result, update entities/relations)
- `SettingSidebar` (1389 lines) — Configuration panel: annotation settings, model selection, summarize-document, save, download highlighted PDF/JSON
- `ResultComponent` (1381 lines) — Main annotation workspace orchestrating PDF viewer, all sidebars, toolbar, context menus, and update history
- `Sidebar` (1377 lines) — Entity list, visibility toggles, entity editing (update/delete/create), relation management, edit status
- `EventSidebar` (938 lines) — Event entity view with visibility, editing, delete, status management
- `SummerizeGraph` (689 lines) — Graph visualization of extracted entities/relations (uses cytoscape)
- `MergePreviewDialog` (541 lines) — Preview dialog for merge operations
- `TableSidebar` / `ParagraphSidebar` (~490 lines each) — Table and paragraph editing with reorder support
- `LLMSidebar` (175 lines) — LLM interaction panel
- `Toolbar` (206 lines) — Re-extract all entities/relations actions
- `ResponsiveAppBar` (162 lines) — Top navigation bar

Other: `CommentForm`, `ContextMenu`, `ContextMenuLLM`, `ExpandableTip`, `ExpandableTipLLM`, `HighlightContainer`, `HighlightPopup`, `SplitButton`, `StrictModeDroppable`, `EditedEntityComponent`.

Note: `LLMSidebar copy.tsx` is a stale copy of `ParagraphSidebar` logic — do not modify.

### Page Structure

Each page lives in its own directory under `src/`:
- `src/HomePage/` — Landing page with theme (`getLPTheme.tsx`)
- `src/DocumentListPage/` — Document management (upload, list, delete, open). Has a `DocumentList.legacy.tsx` backup.
- `src/SignInPage/` — Sign in, forgot password, reset password
- `src/SignUpPage/` — User registration
- `src/ProfilePage/` — User profile and password change
- `src/ContactSupportPage/` — Support contact form
- `src/DocsPage/` — Documentation viewer

## Configuration

### Environment Variables (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Backend API base URL (auth, documents, entities, relations, LLM, tables) |
| `VITE_PDF_BACKEND_URL` | Backend URL for static PDF file serving (`/statics/...`) |

Both are accessed via `import.meta.env` and used across ~80+ API call sites.

### Settings (`settings.json`)

Defines the annotation schema. Loaded as bundled defaults in `GlobalState.tsx`, with optional runtime override via `fetch('/settings.json')`.

**Entity types** (16): VALUE, POLYMER, POLYMER_FAMILY, PROP_VALUE, PROP_NAME, MONOMER, ORGANIC, INORGANIC, MATERIAL_AMOUNT, CONDITION, REF_EXP, OTHER_MATERIAL, COMPOSITE, SYN_METHOD, CHAR_METHOD, EVENT. Each has `type`, `labels`, `bgColor`, `borderColor`.

**Relation types** (9): `<OVERLAP>`, has_property, has_value, has_amount, has_condition, abbreviation_of, refers_to, synthesised_by, characterized_by. Each has `type`, `labels`, `color`, `dashArray`, and `args` (with `role` and `targets` constraining which entity types can participate).

### Styles

- `src/style/` — Component CSS files (`App.css`, `ContextMenu.css`, `ExpandableTip.css`, `HighlightPopup.css`, `PDFUpload.css`, `Sidebar.css`, `Toolbar.css`)
- `src/pdf_highlighter/style/` — Library CSS files (`PdfHighlighter.css`, `TextHighlight.css`, `AreaHighlight.css`, `MouseSelection.css`, `pdf_viewer.css`)
- `src/injectStyles.ts` — Dynamically injects CSS classes for entity types (`.POLYMER { background: #ff4500; }`) and relation types (`.has_property_COLOR { color: purple; }`) at startup

## Backend API Endpoints

Key backend endpoints used by the frontend (all via `VITE_BACKEND_URL`):

**Auth:** `/login`, `/register`, `/refresh-token`, `/forget-password`, `/reset-password`
**Documents:** `/documents`, `/get-document/:id`, `/delete-document/:id`, `/upload-pdf-queue/`, `/upload-pdf-with-json/`, `/download-document/:id`, `/task-status/:id/`
**Entities:** `/create-entity`, `/update-entity`, `/delete-entity`, `/set-visible`, `/change-edit-status`, `/apply-update`
**Relations:** `/update-relations`
**LLM:** `/run-with-LLM`, `/parse-LLM-output`, `/compare-with-model-output`, `/merge_LLM_result`, `/update-LLM-output-entity`, `/update-LLM-output-relation`, `/delete-LLMtext`, `/delete-LLM-output-entity`
**Extraction:** `/re-extract-all/:id`, `/re-extract-relations/:id`, `/summarize-document`
**Tables:** `/generate-table-content-in-pdf-viewer`, `/edit-tables`, `/update-table-entities`, `/update-table-relations`
**Paragraphs:** `/edit-paragraph`, `/reorder-paragraph`
**Export:** `/save/`, `/download-highlighted-document`, `/download-json/`, `/download-entity/`, `/download-infor-para/`
**Graph:** `/get-nodes-and-edges`
**User:** `/get-user-infor`, `/update-user-infor`, `/change-password`, `/contact-support`
**History:** `/get-update-history/:id`

## Key Patterns and Conventions

- **BRAT scripts** are loaded dynamically at runtime via `GlobalState.tsx` (jQuery + brat-client from `settings.bratBaseUrl || '/js/client'`), not bundled.
- **CSS injection** — Entity/relation colors are injected into `<head>` at startup via `injectDynamicCSS()` based on `settings.json`.
- **API pattern** — Most API calls follow: POST/GET via `axiosInstance` → response includes `filename` → PDF URL constructed as `VITE_PDF_BACKEND_URL/statics/${filename}`.
- **`pdf_highlighter`** is designed as an independent library but lives in-tree. Two re-export files exist: `src/context.ts` and `src/react-pdf-highlighter-extended.ts`.
- **Types** — `CommentedHighlight` (extends `Highlight` with `comment` and `relations`) is defined in both `src/types.ts` and `src/pdf_highlighter/types.ts`.
- **Deleted stale files (2026-03-15 audit):** `LLMSidebar copy.tsx`, `DocumentList.legacy.tsx`, `context.ts`, `Editing-function copy.tsx` — confirmed unused, removed.
