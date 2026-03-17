# PolyMinder v3.3 — Comprehensive Codebase Research Report

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Configuration System](#5-configuration-system)
6. [Authentication System](#6-authentication-system)
7. [PDF Highlighter Library](#7-pdf-highlighter-library)
8. [Component Analysis](#8-component-analysis)
9. [Page Components](#9-page-components)
10. [API Surface](#10-api-surface)
11. [Annotation Schema](#11-annotation-schema)
12. [Styling Architecture](#12-styling-architecture)
13. [Key Patterns & Conventions](#13-key-patterns--conventions)
14. [Known Issues & Quirks](#14-known-issues--quirks)
15. [File Index](#15-file-index)

---

## 1. Project Overview

PolyMinder is a React/TypeScript Single Page Application for visualizing and annotating scientific PDFs. It focuses on extracting polymer-related entities and relationships from scientific literature, connecting to a Python FastAPI backend for NLP processing and LLM-assisted extraction.

- **Version:** 3.1.0 (npm), displayed as "PolyMinder Version 3.3" in UI
- **Build variable:** `APP_VERSION` exposed at build time via `vite.config.ts`
- **Repository:** https://github.com/truongdo619/PolyMinder
- **Backend:** FastAPI (Python) hosted at JAIST

---

## 2. Technology Stack

### Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 4 | Build tool & dev server |
| MUI (Material-UI) | 5 | Component library |
| react-router-dom | 6 | Client-side routing (HashRouter) |

### PDF & Visualization

| Library | Version | Purpose |
|---------|---------|---------|
| pdfjs-dist | 2.16.105 | PDF rendering engine |
| cytoscape | 3.33.1 | Graph visualization (SummerizeGraph) |
| reactflow | 11.11.4 | Tree/node visualization |
| vis-network | - | Network graph (TreeVisualizationExample) |
| react-rnd | - | Draggable/resizable highlights |
| react-beautiful-dnd | 13.1.1 | Drag-drop reordering |

### Utilities

| Library | Purpose |
|---------|---------|
| axios | 1.7.2 — HTTP client with interceptor |
| lodash.debounce | Debounced callbacks |
| date-fns, date-fns-tz | Date formatting |
| mui-datatables | 4.3.0 — Document list table |
| react-loading-overlay-ts | Loading spinners |
| mui-markdown | Markdown rendering for docs |

### Runtime Dependencies (Not Bundled)

| Dependency | Purpose |
|-----------|---------|
| jQuery | Required by BRAT visualization |
| BRAT client scripts | Annotation visualization engine |
| window.Util | BRAT embedding API |
| window.head | head.js script loader |

---

## 3. Project Structure

```
PolyMinder_v3.3/
├── index.html                          # Entry HTML (title: "PolyMinder Version 3.3")
├── package.json                        # v3.1.0, scripts, dependencies
├── vite.config.ts                      # Dev server 0.0.0.0:3002, APP_VERSION
├── tsconfig.json                       # ESNext, strict mode, TypeDoc config
├── settings.json                       # Annotation schema (16 entity types, 9 relation types)
├── .env                                # Backend URLs (JAIST server)
├── CLAUDE.md                           # Claude Code instructions
│
├── src/
│   ├── main.tsx                        # React entry point
│   ├── App.tsx                         # Router, providers, route definitions
│   ├── types.ts                        # CommentedHighlight type
│   ├── GlobalState.tsx                 # GlobalContext provider (BRAT, tables, LLM, settings)
│   ├── AuthContext.tsx                 # AuthProvider (isAuthenticated)
│   ├── authenticate.ts                 # Login/register/refresh/logout functions
│   ├── axiosSetup.ts                   # Axios instance with 401 interceptor
│   ├── injectStyles.ts                 # Dynamic CSS injection for entity/relation colors
│   ├── context.ts                      # Re-export from pdf_highlighter
│   ├── react-pdf-highlighter-extended.ts # Re-export from pdf_highlighter
│   │
│   ├── pdf_highlighter/                # Self-contained PDF highlighting library
│   │   ├── index.ts                    # Module exports
│   │   ├── types.ts                    # Core types (Highlight, Scaled, LTWH, etc.)
│   │   ├── components/                 # 15 React components
│   │   ├── contexts/                   # 2 Context providers
│   │   ├── lib/                        # 8 utility modules
│   │   └── style/                      # 5 CSS files
│   │
│   ├── components/                     # Annotation workspace components (22 files)
│   │   ├── ResultComponent.tsx         # Main workspace orchestrator (1382 lines)
│   │   ├── Sidebar.tsx                 # Entity list & editor (1378 lines)
│   │   ├── SettingSidebar.tsx          # Config, filter, export (1390 lines)
│   │   ├── EventSidebar.tsx           # Event viewer & editor (938 lines)
│   │   ├── SummerizeGraph.tsx         # Graph visualization (689 lines)
│   │   ├── TwoSideComparisonDialog.tsx # LLM vs model comparison (1578 lines)
│   │   ├── MergePreviewDialog.tsx     # Merge preview (541 lines)
│   │   ├── TableSidebar.tsx           # Table editor (491 lines)
│   │   ├── ParagraphSidebar.tsx       # Paragraph editor (478 lines)
│   │   ├── Toolbar.tsx                # Zoom & re-extraction (206 lines)
│   │   ├── LLMSidebar.tsx            # LLM mode sidebar (175 lines)
│   │   ├── ResponsiveAppBar.tsx       # App bar template (162 lines)
│   │   ├── ExpandableTipLLM.tsx       # LLM selection tip (142 lines)
│   │   ├── EditedEntityComponent.tsx  # Span adjustment (118 lines)
│   │   ├── HighlightContainer.tsx     # Highlight wrapper (100 lines)
│   │   ├── CommentForm.tsx            # Entity type selector (77 lines)
│   │   ├── SplitButton.tsx            # Entity type display (74 lines)
│   │   ├── ExpandableTip.tsx          # Standard selection tip (65 lines)
│   │   ├── StrictModeDroppable.tsx    # DnD React 18 workaround (26 lines)
│   │   ├── ContextMenuLLM.tsx         # LLM right-click menu (26 lines)
│   │   ├── ContextMenu.tsx            # Standard right-click menu (25 lines)
│   │   ├── HighlightPopup.tsx         # Hover tooltip (21 lines)
│   │   └── LLMSidebar copy.tsx        # STALE COPY (do not modify)
│   │
│   ├── HomePage/                       # Landing page
│   │   ├── HomePage.tsx
│   │   ├── getLPTheme.tsx             # Theme configuration
│   │   └── components/                # Hero, AppAppBar, Features, Footer
│   │
│   ├── DocumentListPage/              # Document management
│   │   ├── DocumentListPage.tsx
│   │   ├── DocumentList.tsx           # Upload, list, delete (1000+ lines)
│   │   └── DocumentList.legacy.tsx    # Legacy backup (do not modify)
│   │
│   ├── SignInPage/                    # Authentication pages
│   │   ├── SignInPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   │
│   ├── SignUpPage/SignUpPage.tsx       # Registration
│   ├── ProfilePage/ProfilePage.tsx    # User profile
│   ├── ContactSupportPage/            # Support form
│   │   ├── ContactSupportPage.tsx
│   │   └── getLPTheme.tsx             # Duplicate of HomePage's getLPTheme
│   │
│   ├── DocsPage/DocsPage.tsx          # Versioned documentation viewer
│   │
│   └── style/                         # Component CSS files
│       ├── App.css
│       ├── ContextMenu.css
│       ├── ExpandableTip.css
│       ├── HighlightPopup.css
│       ├── PDFUpload.css
│       ├── Sidebar.css
│       └── Toolbar.css
```

---

## 4. Architecture & Data Flow

### Provider Hierarchy

```
<GlobalProvider>          ← bratOutput, tableOutput, LLLOutput, documentId, settings
  <AuthProvider>          ← isAuthenticated, setAuthenticated
    <HashRouter>          ← Client-side routing with # paths
      <Routes>            ← Route definitions
        <ProtectedRoute>  ← Auth guard for /documents, /result
```

### Core Data Flow

```
User uploads PDF → DocumentList → POST /upload-pdf-queue/ → Task polling
                                                               ↓
Document ready → Navigate to /result → ResultComponent loads document
                                              ↓
GET /get-document/:id → Parse BRAT output → Convert to Highlight[] → Render PDF
                              ↓
              GlobalContext stores: bratOutput, tableOutput, LLLOutput
                              ↓
    ┌─────────────────────────┼─────────────────────────┐
    ↓                         ↓                         ↓
Sidebar (Entities)    TableSidebar (Tables)    LLMSidebar (LLM)
  Edit/Delete/Create    Edit/Reorder            Run LLM/Compare/Merge
    ↓                         ↓                         ↓
POST /update-entity   POST /edit-tables         POST /run-with-LLM
POST /delete-entity   POST /edit-paragraph      POST /compare-with-model-output
POST /create-entity   POST /reorder-paragraph   POST /merge_LLM_result
```

### Highlight Lifecycle

```
1. Text Selection → PdfSelection (with makeGhostHighlight())
2. PdfSelection → GhostHighlight (temporary, no id)
3. GhostHighlight → User selects entity type via CommentForm
4. POST /create-entity → Server returns Highlight (with id)
5. Highlight rendered via TextHighlight or AreaHighlight components
6. Edit/Delete via Sidebar or ContextMenu → API calls → State refresh
```

### Coordinate System

```
Scaled coordinates (0-1 normalized) ←→ Viewport coordinates (pixel-based)
         ↑                                        ↑
    Storage format                          Rendering format
    (position-agnostic)                    (device-specific)

Conversion functions:
  viewportToScaled()      — viewport → normalized
  scaledToViewport()      — normalized → viewport
  viewportPositionToScaled() — full position conversion
  scaledPositionToViewport() — full position conversion
```

### Mode System

ResultComponent supports 6 viewing modes, each showing different data and sidebars:

| Mode | Sidebar Component | Data Source |
|------|------------------|-------------|
| Entities | Sidebar | bratOutput entities |
| Relations | Sidebar (filtered) | bratOutput relations |
| Events | EventSidebar | bratOutput events |
| Tables | TableSidebar | tableOutput |
| Paragraphs | ParagraphSidebar | bratOutput paragraphs |
| LLM | LLMSidebar | LLLOutput |

---

## 5. Configuration System

### Environment Variables (`.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_BACKEND_URL` | `https://www.jaist.ac.jp/.../engine_v3` | Backend API base URL |
| `VITE_PDF_BACKEND_URL` | `https://www.jaist.ac.jp/.../engine_v3` | PDF static file serving |

Accessed via `import.meta.env.VITE_BACKEND_URL` across ~80+ API call sites.

### Settings (`settings.json`)

Loaded in two stages:
1. **Bundled defaults** — imported directly in `GlobalState.tsx`
2. **Runtime override** — `fetch('/settings.json')` attempted at startup

Defines the complete annotation schema: 16 entity types and 9 relation types with colors, labels, and argument constraints.

### Build Configuration (`vite.config.ts`)

- Dev server: `0.0.0.0:3002`
- Build target: `esnext`
- Output: `dist/`
- Plugin: `@vitejs/plugin-react` (Fast Refresh)
- Define: `APP_VERSION` from `npm_package_version`

### TypeScript (`tsconfig.json`)

- Target/Module: ESNext
- Strict mode enabled
- `noUnusedLocals: true`, `noUnusedParameters: false`
- `include` only covers `src/pdf_highlighter` (for TypeDoc generation)
- TypeDoc outputs to `public/docs`

---

## 6. Authentication System

### Flow

```
Login:
  POST /login (FormData: username, password)
    → Response: { access_token, refresh_token }
    → Store in localStorage: accessToken, refreshToken, username

Token Refresh:
  POST /refresh-token?refresh_token=... (null body)
    → Update accessToken in localStorage

Registration:
  POST /register (JSON: { username, email, password })
    → Returns { success, message? }

Logout:
  Remove accessToken, refreshToken, username from localStorage
```

### Axios Interceptor (`axiosSetup.ts`)

```
Response 401 → refreshAccessToken()
  → Success: Set Authorization header, retry original request
  → Failure: Clear localStorage, reject promise
```

### Route Protection

```tsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/signin" />;
};
```

Protected routes: `/documents`, `/result`

### AuthContext

- Checks localStorage for `accessToken`, `refreshToken`, `username` on mount
- Sets `isAuthenticated = true` only if all three exist
- Simple boolean state, no role-based access control

---

## 7. PDF Highlighter Library

### Overview

Self-contained, reusable library at `src/pdf_highlighter/`. Built on `pdfjs-dist` v2.16.105, designed as an independent package (ESM + CJS exports) but lives in-tree. Two re-export files exist: `src/context.ts` and `src/react-pdf-highlighter-extended.ts`.

### Type System (`types.ts`)

#### Geometric Types

| Type | Fields | Purpose |
|------|--------|---------|
| `LTWH` | left, top, width, height | Viewport rectangle |
| `LTWHP` | left, top, width, height, pageNumber | Viewport rect with page |
| `Scaled` | x1, y1, x2, y2, width, height, pageNumber | Normalized (0-1) coordinates |
| `ScaledPosition` | boundingRect: Scaled, rects: Scaled[] | Storage format |
| `ViewportPosition` | boundingRect: LTWHP, rects: LTWHP[] | Rendering format |

#### Highlight Types

| Type | Description |
|------|-------------|
| `Highlight` | Core: id, content, position, para_id, comment, visible, user_comment |
| `GhostHighlight` | Temporary highlight (Highlight without id) |
| `ViewportHighlight<T>` | Rendered highlight with ViewportPosition |
| `CommentedHighlight` | Extends Highlight with comment and relations arrays |
| `PdfSelection` | Intermediate selection with `makeGhostHighlight()` method |
| `Content` | `{ text?: string, image?: string }` payload |

### Core Components

#### PdfHighlighter (899 lines)
Main rendering engine. Manages PDF viewer initialization, highlight layers, text/area selection, ghost highlights, and three dialog types (CommentForm, TableCommentForm, LLMCommentForm).

**Key props:** `highlights`, `pdfDocument`, `onSelection`, `enableAreaSelection`, `pdfScaleValue`, `utilsRef`

**Features:**
- PDF.js viewer initialization with `enhanceTextSelection=true`
- Debounced selection handling (250ms)
- Event listeners: `textlayerrendered`, `pagesinit`, `pagechanging`, `selectionchange`, `keydown`, `mousedown`
- Three dialog types routed via `custom_scrollToHighlight()` based on `selectedMode`
- Context provision via `PdfHighlighterContext.Provider`

#### PdfLoader (139 lines)
Async PDF.js document loading with progress reporting and error handling.

#### TextHighlight (113 lines)
Renders text selection overlays with dynamic CSS classes (`TextHighlight__part ${type.toUpperCase()}`). Supports BLOCK_* classes for paragraph type visualization. Shows Badge with para_id+1 for BLOCK_* classes.

#### AreaHighlight (130 lines)
Draggable/resizable rectangle highlight using `react-rnd`. Generates position-based key to force remount on updates.

#### HighlightLayer (116 lines)
Container for all highlights on a single page. Converts ScaledPosition to ViewportPosition per highlight. Provides `HighlightContext` for each highlight.

#### MouseSelection (244 lines)
Drag-to-select rectangular areas with `enableAreaSelection` guard callback. Captures screenshot of selected area.

#### TipContainer (104 lines)
Positions and displays tooltips relative to page nodes. Clamps horizontally to page bounds.

#### MonitoredHighlightContainer (99 lines)
Auto-shows/hides tip on mouse hover using MouseMonitor (60px/30px padding).

### Form Components (in pdf_highlighter)

#### CommentForm (~600-700 lines)
Standard entity annotation dialog with BRAT visualization, download entity/paragraph buttons, and filter capabilities.

#### LLMCommentForm (1643 lines)
LLM-assisted extraction with 4 prompt presets:
- `default`: Extract polymer property tuples
- `natural-text`: Rewrite text for NER/RE
- `entities-detail`: JSON entity extraction
- `json-schema-reference`: Full schema with relations

Advanced LLM settings: topK, topP, temperature, maxTokens, thinkingMode.

API calls: `/run-with-LLM`, `/parse-LLM-output`, `/compare-with-model-output`, `/merge_LLM_result`

#### TableCommentForm (1975 lines)
Table extraction and natural language conversion. HTML table parsing via DOMParser. Default prompts for converting tables to clean natural sentences.

### Visualization Components

#### BratEmbedding (94 lines)
BRAT visualization with pinned highlight. Waits for `window.head.ready`, calls `window.Util.embed()`.

#### BratEmbeddingDefault (68 lines)
BRAT visualization without highlight pinning.

#### TreeVisualizationExample (76 lines)
vis-network graph visualization. Fetches `/get-nodes-and-edges`, creates network with physics.

### Utility Libraries (`lib/`)

| Module | Key Functions |
|--------|--------------|
| `coordinates.ts` | `viewportToScaled()`, `scaledToViewport()`, `viewportPositionToScaled()`, `scaledPositionToViewport()` |
| `get-bounding-rect.ts` | `getBoundingRect(clientRects)` — computes unified bounding box |
| `get-client-rects.ts` | `getClientRects(range, pages)` — extracts DOMRects from Range |
| `optimize-client-rects.ts` | `optimizeClientRects(rects)` — merges overlapping/adjacent rects (3-pass) |
| `pdfjs-dom.ts` | `getPageFromElement()`, `getPagesFromRange()`, `findOrCreateContainerLayer()` |
| `screenshot.ts` | `screenshot(position, pageNumber, viewer)` — canvas-based PNG capture |
| `disable-text-selection.ts` | `disableTextSelection(viewer, flag)` — toggle CSS user-select |
| `group-highlights-by-page.ts` | `groupHighlightsByPage(highlights)` — multi-page highlight distribution |

### Contexts

#### PdfHighlighterContext
Provides `PdfHighlighterUtils`: `getCurrentSelection()`, `getGhostHighlight()`, `removeGhostHighlight()`, `toggleEditInProgress()`, `custom_scrollToHighlight()`, `scrollToHighlight()`, `getViewer()`, `getTip()`, `setTip()`, `renderHighlightLayers()`, `scrolledToHighlightIdRef`.

#### HighlightContext
Provides `HighlightContainerUtils`: `highlight`, `viewportToScaled()`, `screenshot()`, `isScrolledTo`, `highlightBindings`.

### Exports (`index.ts`)

**Components:** PdfHighlighter, PdfLoader, TextHighlight, MonitoredHighlightContainer, AreaHighlight
**Hooks:** usePdfHighlighterContext, useHighlightContainerContext
**Utilities:** viewportPositionToScaled, scaledPositionToViewport
**Types:** All from types.ts

---

## 8. Component Analysis

### ResultComponent (1382 lines)
**Purpose:** Main annotation workspace orchestrator.

**Responsibilities:**
- PDF viewer with PdfHighlighter and PdfLoader
- All sidebar orchestration (Sidebar, SettingSidebar, EventSidebar, TableSidebar, ParagraphSidebar, LLMSidebar)
- Context menu management
- Mode switching (Entities, Relations, Events, Tables, LLM, Paragraphs)
- Document state management (highlights, tables, LLM output, paragraphs)
- LLM comparison workflow
- Version history management

**Key state:** `selectedMode`, `highlights` (visible only), `filteredHighlights`, `relationHighlights`, `eventHighlights`, `contextMenu`, `pdfScaleValue`, `isCompareSelOpen/ResOpen`, `history`

**API calls:** `/create-entity`, `/update-entity`, `/delete-entity`, `/update-relations`, `/set-visible`, `/change-edit-status`, `/apply-update`, `/compare-with-model-output`, `/merge_LLM_result`, `/get-update-history`, `/get-document`, `/re-extract-all`, `/re-extract-relations`

### Sidebar (1378 lines)
**Purpose:** Entity list viewer and editor.

**Features:**
- Paginated entity list (30 items/page)
- Entity cards: type dot, type name, text excerpt, relations, page number
- 3-tab edit dialog: Entity (type + span selection), Relation (relation editor), Comment (user notes)
- Matched entity detection for batch updates
- Paragraph visibility toggling

### SettingSidebar (1390 lines)
**Purpose:** Configuration, filtering, summarization, export.

**Features:**
- Mode buttons (Entities, Relations, Events, Tables, Paragraphs, LLM)
- Dynamic filter list with occurrence counting
- 2D checkbox matrix for cross-filtering (entity type x relation type)
- Download dialog (PDF/JSON, with filter options: all/confirmed/entity_type/filter)
- Checkpoint save dialog
- Summary dialog with entity/relation statistics, progress bars, and SummerizeGraph

### EventSidebar (938 lines)
**Purpose:** Event (trigger + arguments) viewer and editor.

**Event structure:** Trigger entity + argument array `[role, entity_id, span, extra, text]`.

### TwoSideComparisonDialog (1578 lines)
**Purpose:** Side-by-side LLM vs model-based extraction comparison with merge capability.

**Layout:** Two-column (LLM blue header, Base orange header) with source text, BRAT visualization, entity list, and raw JSON views.

**Sub-components:** EntityEditDialog, AddEntityDialog, EntityListSection.

**API calls:** `/update-LLM-output-entity`, `/update-LLM-output-relation`, `/delete-LLM-output-entity`, `/update-entity`, `/update-relations`, `/delete-entity`, `/merge_LLM_result`

### SummerizeGraph (689 lines)
**Purpose:** Interactive vis.js network graph of entities and relations.

**Features:** Physics-based layout (forceAtlas2Based), click-to-expand, node category filtering, Top-K slider, fullscreen mode, selected node side panel.

### MergePreviewDialog (541 lines)
**Purpose:** Preview merge operation with statistics (entities added, relations added, duplicates skipped, conflicts detected) and BRAT visualization of merged output.

### Smaller Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| TableSidebar | 491 | Table block editor with drag-drop reordering |
| ParagraphSidebar | 478 | Paragraph block editor with drag-drop reordering |
| Toolbar | 206 | Zoom controls, page info, re-extraction buttons |
| LLMSidebar | 175 | LLM mode display (paragraph blocks + entities) |
| ResponsiveAppBar | 162 | MUI app bar template (not actively used) |
| ExpandableTipLLM | 142 | LLM selection tip (Add highlight + Run with LLM) |
| EditedEntityComponent | 118 | Visual text selection for entity span adjustment |
| HighlightContainer | 100 | Text/area highlight wrapper with context menu |
| CommentForm | 77 | Entity type selector dropdown |
| SplitButton | 74 | Entity type display button (filled + outlined) |
| ExpandableTip | 65 | Standard selection tip (Add highlight) |
| StrictModeDroppable | 26 | React 18 workaround for react-beautiful-dnd |
| ContextMenuLLM | 26 | LLM right-click menu (Delete only, Compare commented out) |
| ContextMenu | 25 | Standard right-click menu (Edit Comment, Delete) |
| HighlightPopup | 21 | Hover tooltip showing entity type |

---

## 9. Page Components

### HomePage (`src/HomePage/`)
Landing page with theme toggling (light/dark).

**Components:**
- `AppAppBar` — Navigation: Documents, Manual, Video Demo, Contact Support, FAQ. Auth-aware login/logout buttons.
- `Hero` — "PolyMinder" heading with gradient background and PDFResult.png image.
- `Features` — 3 feature cards (Process PDF, System Docs, Video Demo).
- `Footer` — Copyright, Privacy Policy, Terms of Service, GitHub link.
- `getLPTheme` — Full MUI theme with brand colors (blue palette), typography, and component overrides.

### DocumentListPage (`src/DocumentListPage/`)
Document management with MUIDataTable.

**Features:**
- Table columns: id, filename, upload_time, pages, entities, relations, status
- Upload dialog with two modes: Raw PDF or PDF + JSON pair
- Task status polling every 2 seconds via `setInterval`
- Delete and download actions
- Drag-drop file upload via FileUploader

**API endpoints:** `/documents`, `/upload-pdf-queue/`, `/upload-pdf-with-json/`, `/task-status/:id/`, `/delete-document/:id`, `/download-document/:id`

### SignInPage (`src/SignInPage/`)
- **SignInPage** — Username/password login with remember-me. Two-column layout with background image.
- **ForgotPasswordPage** — Email-based password reset request. POST to `/forget-password/`.
- **ResetPasswordPage** — Token-based password reset from URL query parameter. POST to `/reset-password/`.

### SignUpPage (`src/SignUpPage/`)
User registration with field validation (username, email regex, password match).

### ProfilePage (`src/ProfilePage/`)
Two tabs: Profile (view/edit address, workplace, phone) and Change Password.

**API endpoints:** `/get-user-infor`, `/update-user-infor`, `/change-password`

### ContactSupportPage (`src/ContactSupportPage/`)
Support form (name, email, message). POST to `/contact-support`.

**Note:** Contains duplicate `getLPTheme.tsx` identical to HomePage's version.

### DocsPage (`src/DocsPage/`)
Version-aware documentation viewer supporting v3.1, v3.0, v2.0.

**Features:**
- Sidebar with expandable sections and version dropdown
- Markdown files imported as raw strings via Vite `?raw`
- Rendered with `MuiMarkdown` and `defaultOverrides`
- URL pattern: `/docs/:version/:section/:page`

**v3.1 sections:** getting-started (overview, installation, quickstart, faq, support), features (login, dashboard, result_visualization, filtering, editing, save_checkpoints, confirm_annotations, paragraph_selection, download, personalization)

---

## 10. API Surface

### Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/login` | Login (FormData: username, password) |
| POST | `/register` | Register (JSON: username, email, password) |
| POST | `/refresh-token` | Refresh access token |
| POST | `/forget-password/` | Request password reset email |
| POST | `/reset-password/` | Reset password with token |

### Documents

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/documents` | List all documents |
| GET | `/get-document/:id` | Get document by ID |
| GET | `/get-document/:id/:updateId` | Get document at specific version |
| POST | `/delete-document/:id` | Delete document |
| POST | `/upload-pdf-queue/` | Upload raw PDF (async task) |
| POST | `/upload-pdf-with-json/` | Upload PDF + JSON pair |
| POST | `/download-document/:id` | Download document |
| GET | `/task-status/:id/` | Poll upload task status |

### Entities

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/create-entity` | Create new entity annotation |
| POST | `/update-entity` | Update entity type/position/comment |
| POST | `/delete-entity` | Delete entity |
| POST | `/set-visible` | Toggle paragraph visibility |
| POST | `/change-edit-status` | Mark entity as confirmed |
| POST | `/apply-update` | Apply matched entity batch updates |

### Relations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/update-relations` | Update entity relations |

### Events

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/edit-event` | Save event trigger + arguments |
| POST | `/delete-event` | Delete event |

### LLM

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/run-with-LLM` | Run LLM extraction with preset |
| POST | `/parse-LLM-output` | Parse LLM extraction results |
| POST | `/compare-with-model-output` | Compare LLM vs model extraction |
| POST | `/merge_LLM_result` | Merge LLM extraction into base |
| POST | `/update-LLM-output-entity` | Update LLM entity |
| POST | `/update-LLM-output-relation` | Update LLM relation |
| POST | `/delete-LLMtext` | Delete LLM text |
| POST | `/delete-LLM-output-entity` | Delete LLM entity |

### Extraction

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/re-extract-all/:id` | Re-run NER + RE models |
| GET | `/re-extract-relations/:id` | Re-run RE model only |
| POST | `/summarize-document` | Generate entity/relation summary with graph |

### Tables & Paragraphs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/generate-table-content-in-pdf-viewer` | Generate table content |
| POST | `/edit-tables` | Edit table content |
| POST | `/update-table-entities` | Update table entities |
| POST | `/update-table-relations` | Update table relations |
| POST | `/edit-paragraph` | Update paragraph content |
| POST | `/reorder-paragraph` | Reorder paragraphs |

### Export

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/save/` | Save checkpoint with name |
| POST | `/download-highlighted-document` | Download filtered PDF |
| POST | `/download-json/` | Download filtered JSON annotations |
| POST | `/download-entity/` | Download entity data |
| POST | `/download-infor-para/` | Download paragraph info |

### Graph

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/get-nodes-and-edges` | Get graph visualization data |

### User

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/get-user-infor` | Get user profile |
| POST | `/update-user-infor` | Update user profile |
| POST | `/change-password` | Change password |
| POST | `/contact-support` | Submit support request |

### History

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/get-update-history/:id` | Get document version history |

---

## 11. Annotation Schema

### Entity Types (16)

| Type | Color | Description |
|------|-------|-------------|
| VALUE | `#6f00ff` (violet) | Numeric/text values |
| POLYMER | `#ff4500` (orange-red) | Polymer names |
| POLYMER_FAMILY | `#00ff00` (green) | Polymer family names |
| PROP_VALUE | `#ce6f03` (dark orange) | Property values |
| PROP_NAME | `#1e90ff` (dodger blue) | Property names |
| MONOMER | `#B8BDD3` (light gray-blue) | Monomer names |
| ORGANIC | `#ff00ff` (magenta) | Organic materials |
| INORGANIC | `#00ffff` (cyan) | Inorganic materials |
| MATERIAL_AMOUNT | `#a0522d` (sienna) | Material quantities |
| CONDITION | `#ffe000` (yellow) | Experimental conditions |
| REF_EXP | `#bd0ea5` (purple-pink) | Reference expressions |
| OTHER_MATERIAL | `#1976d2` (blue) | Other materials |
| COMPOSITE | `#00ff88` (spring green) | Composite materials |
| SYN_METHOD | `#f09bc5` (pink) | Synthesis methods |
| CHAR_METHOD | `#a0778a` (mauve) | Characterization methods |
| EVENT | `#32CD32` (lime green) | Events |

### Relation Types (9)

| Type | Color | Arg1 Targets | Arg2 Targets |
|------|-------|-------------|-------------|
| `<OVERLAP>` | black | `<ENTITY>` | `<ENTITY>` |
| has_property | purple | POLYMER, POLYMER_FAMILY, MONOMER, ORGANIC, INORGANIC, COMPOSITE, OTHER_MATERIAL, REF_EXP | PROP_NAME, REF_EXP |
| has_value | green | (materials + PROP_NAME + REF_EXP) | PROP_VALUE |
| has_amount | red | (materials + REF_EXP) | MATERIAL_AMOUNT |
| has_condition | gray | PROP_NAME, PROP_VALUE, REF_EXP | CONDITION |
| abbreviation_of | blue | (materials + methods) | (materials + methods) |
| refers_to | purple | REF_EXP | (materials + methods + REF_EXP) |
| synthesised_by | red | (materials + REF_EXP) | SYN_METHOD |
| characterized_by | black | (materials + REF_EXP + PROP_NAME) | CHAR_METHOD |

### BRAT Data Format

```
entities: [id, type, [[start, end], ...]]
relations: [id, type, [[role, entity_id], ...]]
```

---

## 12. Styling Architecture

### Dynamic CSS Injection (`injectStyles.ts`)

At startup, `injectDynamicCSS(settings)` creates `<style>` elements in `<head>`:

```css
/* Per entity type */
.POLYMER { background: #ff4500; }
.POLYMER_COLOR { color: #ff4500 !important; }

/* Per relation type */
.has_property_COLOR { color: purple !important; border: 2px solid gray; }
```

### CSS Files

#### Application Styles (`src/style/`)

| File | Key Rules |
|------|-----------|
| `App.css` | Global font, MuiTableCell header bold, document-list customizations |
| `ContextMenu.css` | Absolute positioned popup, z-index 1000, red delete button |
| `ExpandableTip.css` | Dark compact tip (#2c3e50), white card tip |
| `HighlightPopup.css` | Dark popup (#2c3e50), custom scrollbar |
| `PDFUpload.css` | Dashed border uploader, 14vh height |
| `Sidebar.css` | White background, gray scrollbar, entity cards with hover effects |
| `Toolbar.css` | Dark toolbar (#2b2e33), purple hover effects (#b958ff) |

#### PDF Highlighter Styles (`src/pdf_highlighter/style/`)

| File | Key Rules |
|------|-----------|
| `PdfHighlighter.css` | Dark background (#333), highlight-layer z-index 3, tip-container z-index 6, webkit scrollbar |
| `TextHighlight.css` | Cursor pointer, scrolledTo filter (brightness 60%, saturate 180%, contrast 120%), 14 BLOCK_* color classes |
| `AreaHighlight.css` | Yellow background (rgba(255,226,143,1)), red scrolledTo (#ff4141) |
| `MouseSelection.css` | Dashed border, light blue background, mix-blend-mode multiply |
| `pdf_viewer.css` | textLayer z-index 2, mix-blend-mode multiply, annotationLayer z-index 3 |

### Block Type Colors

```
BLOCK_INDEX      → #28A9E1
BLOCK_LLM        → #cdd9de
BLOCK_PARAGRAPH  → #f78888
BLOCK_TEXT        → various
BLOCK_TITLE      → various
BLOCK_LIST       → various
BLOCK_DISCARDED  → various
BLOCK_IMAGE_*    → various
BLOCK_TABLE_*    → various
BLOCK_INTEREQUATION → various
```

### Theme System

`getLPTheme.tsx` provides full MUI theme configuration:
- **Brand palette:** Blue (#F0F7FF to #021F3B)
- **Secondary palette:** Purple
- **Gray palette:** Gray scale
- **Green palette:** Green scale
- Light/dark mode toggle via `PaletteMode`
- Extensive MUI component overrides (Accordion, Button, Card, Chip, TextField, Switch, Link, etc.)

**Note:** `getLPTheme.tsx` is duplicated identically in `HomePage/` and `ContactSupportPage/`.

---

## 13. Key Patterns & Conventions

### State Management
- **Global state** via React Context (GlobalContext, AuthContext)
- **Component-level state** via `useState`
- **No Redux/Zustand** — pure context-based approach
- **GlobalContext fields:** `bratOutput`, `tableOutput`, `LLLOutput` (note: `LLLOutput`, not `LLMOutput`), `documentId`, `updateId`, `fileName`, `supportedModels`, `settings`

### API Integration
- Centralized `axiosInstance` with auth interceptor for authenticated requests
- Manual `axios` for unauthenticated requests (login, registration)
- Authorization: `Bearer ${token}` header
- PDF URL construction: `VITE_PDF_BACKEND_URL/statics/${filename}`
- Error handling: try-catch with `setIsActive(false)` in finally block

### BRAT Script Loading
10 scripts loaded sequentially via promise chain from `settings.bratBaseUrl || '/js/client'`:
1. `jquery.min.js`
2. `jquery.svg.min.js`
3. `jquery.svgdom.min.js`
4. `configuration.js`
5. `util.js`
6. `annotation_log.js`
7. `webfont.js`
8. `dispatcher.js`
9. `url_monitor.js`
10. `visualizer.js`

### Hash-Based Navigation
- Document hash includes highlight IDs for PDF auto-scrolling (`#highlight-para0_T1`)
- Hash manipulation used for dialog state tracking
- `useLocation().hash` drives scroll-to-highlight behavior

### Pagination
- Sidebar uses 30 items/page pagination for entity lists
- Filter list items sorted by occurrence frequency

### Matched Entity Detection
When updating an entity, the system detects other entities with same span text and original type, offering batch update capability.

### Loading State
Global `setIsActive()` shows loading overlay spinner across entire app during async operations.

### Default LLM Models
`supportedModels` defaults to `['qwen2.5:7b', 'qwen3:14b']`

---

## 14. Known Issues & Quirks

### Type System Issues
1. **CommentedHighlight duplication** — Defined in both `src/types.ts` and `src/pdf_highlighter/types.ts`
2. **`any` types** — `brat_item`, `pdfHighlighterUtils` in form components use `any`
3. **`as any` casting** — LLMCommentForm uses `as any` for dialog state
4. **`LLLOutput` naming** — Variable named `LLLOutput`, not `LLMOutput`

### Window Globals
5. **BRAT requires global scripts** — `window.Util`, `window.head`, jQuery must exist at runtime
6. **No error handling** if BRAT scripts fail to load
7. **BratEmbedding pins highlight** by re-dispatching mouseover events and using jQuery `.on('mouseout.pin')`

### Component Issues
8. **MouseSelection re-registers all listeners** on every state change (start, end coordinates)
9. **MouseMonitor doesn't clean up** event listener on rapid unmount
10. **TreeVisualizationExample `network.destroy()`** may not fire on rapid unmount
11. **AreaHighlight `onEditStart`** not called on initial render, only on drag/resize
12. **Ghost highlight state** can exist independently of selection with unclear cleanup order

### Architecture Issues
13. **Hash manipulation** — Modifying `document.location.hash` directly is fragile; could use router
14. **Duplicate `getLPTheme.tsx`** in HomePage and ContactSupportPage
15. **`LLMSidebar copy.tsx`** is a stale copy of ParagraphSidebar logic
16. **`DocumentList.legacy.tsx`** is a legacy backup
17. **ResponsiveAppBar** appears to be template/demo code, not actively integrated

### Performance
18. **No memoization** on highlight components despite frequent re-renders
19. **TipContainer `updatePosition` callback** continuously updated but may become stale
20. **Three dialogs** with same maxWidth/fullWidth may overlap on scroll

### Security
21. **No runtime prop validation** despite complex prop shapes
22. **ContextMenuLLM** has "Compare with model-based output" button commented out

### Accessibility
23. **No keyboard navigation** for highlights
24. **No ARIA labels** on interactive highlight elements

---

## 15. File Index

### Configuration Files
| File | Size | Purpose |
|------|------|---------|
| `package.json` | - | Dependencies, scripts, version |
| `vite.config.ts` | 24 lines | Build & dev server config |
| `tsconfig.json` | 28 lines | TypeScript + TypeDoc config |
| `settings.json` | 409 lines | Annotation schema |
| `.env` | 4 lines | Backend URLs |
| `index.html` | - | Entry HTML |

### Source — Top Level
| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point |
| `src/App.tsx` (76 lines) | Router, providers, routes |
| `src/types.ts` | CommentedHighlight |
| `src/GlobalState.tsx` | Global context provider |
| `src/AuthContext.tsx` | Auth context provider |
| `src/authenticate.ts` | Auth API functions |
| `src/axiosSetup.ts` | Axios with 401 interceptor |
| `src/injectStyles.ts` | Dynamic CSS injection |
| `src/context.ts` | Re-export pdf_highlighter |
| `src/react-pdf-highlighter-extended.ts` | Re-export pdf_highlighter |

### Source — pdf_highlighter
| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | - | Module exports |
| `types.ts` | - | Core type definitions |
| `components/PdfHighlighter.tsx` | 899 | Core rendering engine |
| `components/PdfLoader.tsx` | 139 | PDF document loading |
| `components/TextHighlight.tsx` | 113 | Text selection overlays |
| `components/AreaHighlight.tsx` | 130 | Resizable rectangle highlights |
| `components/HighlightLayer.tsx` | 116 | Per-page highlight container |
| `components/MouseSelection.tsx` | 244 | Drag-to-select |
| `components/TipContainer.tsx` | 104 | Tooltip positioning |
| `components/MonitoredHighlightContainer.tsx` | 99 | Hover tip management |
| `components/MouseMonitor.tsx` | 74 | Mouse boundary detection |
| `components/CommentForm.tsx` | ~700 | Entity annotation dialog |
| `components/LLMCommentForm.tsx` | 1643 | LLM extraction dialog |
| `components/TableCommentForm.tsx` | 1975 | Table extraction dialog |
| `components/BratEmbedding.tsx` | 94 | BRAT with pinned highlight |
| `components/BratEmbeddingDefault.tsx` | 68 | BRAT without pinning |
| `components/TreeVisualizationExample.tsx` | 76 | vis-network graph |
| `components/MyCustomNode.tsx` | 79 | ReactFlow node type |
| `contexts/PdfHighlighterContext.ts` | - | PDF highlighter context |
| `contexts/HighlightContext.ts` | - | Highlight container context |
| `lib/coordinates.ts` | - | Coordinate conversions |
| `lib/get-bounding-rect.ts` | - | Bounding rect calculation |
| `lib/get-client-rects.ts` | - | DOM rect extraction |
| `lib/optimize-client-rects.ts` | - | Rect merging/optimization |
| `lib/pdfjs-dom.ts` | - | PDF.js DOM utilities |
| `lib/screenshot.ts` | - | Canvas screenshot capture |
| `lib/disable-text-selection.ts` | - | Selection toggle |
| `lib/group-highlights-by-page.ts` | - | Page-based grouping |

### Source — Components
| File | Lines | Purpose |
|------|-------|---------|
| `ResultComponent.tsx` | 1382 | Main workspace |
| `Sidebar.tsx` | 1378 | Entity list & editor |
| `SettingSidebar.tsx` | 1390 | Config, filter, export |
| `EventSidebar.tsx` | 938 | Event viewer & editor |
| `SummerizeGraph.tsx` | 689 | Graph visualization |
| `TwoSideComparisonDialog.tsx` | 1578 | LLM vs model comparison |
| `MergePreviewDialog.tsx` | 541 | Merge preview |
| `TableSidebar.tsx` | 491 | Table editor |
| `ParagraphSidebar.tsx` | 478 | Paragraph editor |
| `Toolbar.tsx` | 206 | Zoom & re-extraction |
| `LLMSidebar.tsx` | 175 | LLM mode display |
| `ExpandableTipLLM.tsx` | 142 | LLM selection tip |
| `EditedEntityComponent.tsx` | 118 | Span adjustment |
| `HighlightContainer.tsx` | 100 | Highlight wrapper |
| `CommentForm.tsx` | 77 | Entity type selector |
| `SplitButton.tsx` | 74 | Entity type display |
| `ExpandableTip.tsx` | 65 | Standard selection tip |
| `StrictModeDroppable.tsx` | 26 | DnD workaround |
| `ContextMenuLLM.tsx` | 26 | LLM context menu |
| `ContextMenu.tsx` | 25 | Standard context menu |
| `HighlightPopup.tsx` | 21 | Hover tooltip |

### Source — Pages
| Directory | Key Files |
|-----------|-----------|
| `HomePage/` | HomePage.tsx, getLPTheme.tsx, Hero.tsx, AppAppBar.tsx, Features.tsx, Footer.tsx |
| `DocumentListPage/` | DocumentListPage.tsx, DocumentList.tsx, DocumentList.legacy.tsx |
| `SignInPage/` | SignInPage.tsx, ForgotPasswordPage.tsx, ResetPasswordPage.tsx |
| `SignUpPage/` | SignUpPage.tsx |
| `ProfilePage/` | ProfilePage.tsx |
| `ContactSupportPage/` | ContactSupportPage.tsx, getLPTheme.tsx |
| `DocsPage/` | DocsPage.tsx |

### Source — Styles
| File | Scope |
|------|-------|
| `src/style/App.css` | Global |
| `src/style/ContextMenu.css` | Context menus |
| `src/style/ExpandableTip.css` | Selection tips |
| `src/style/HighlightPopup.css` | Hover popups |
| `src/style/PDFUpload.css` | File upload |
| `src/style/Sidebar.css` | Sidebar components |
| `src/style/Toolbar.css` | Toolbar |
| `src/pdf_highlighter/style/PdfHighlighter.css` | PDF viewer |
| `src/pdf_highlighter/style/TextHighlight.css` | Text highlights |
| `src/pdf_highlighter/style/AreaHighlight.css` | Area highlights |
| `src/pdf_highlighter/style/MouseSelection.css` | Mouse selection |
| `src/pdf_highlighter/style/pdf_viewer.css` | PDF.js overrides |

---

*Generated: 2026-02-13 | PolyMinder v3.3 Codebase Research Report*
