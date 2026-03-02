# Plan: Responsiveness & UI/UX Improvements

## Problem Statement

PolyMinder's annotation workspace was built desktop-first with no responsive breakpoints. The
result is a set of layout defects that range from cosmetically broken to completely unusable at
screen widths below ~1400 px.  The documentation page, dialogs, sidebars, and the core two-panel
PDF viewer all need work.

**Scope:** fix all layout and sizing issues discovered during audit without changing business logic.
No new dependencies.  Zero new TypeScript errors.

---

## Breakpoint Reference (MUI defaults)

| Key | Width | Target device |
|-----|-------|---------------|
| `xs` | 0 px | mobile portrait |
| `sm` | 600 px | mobile landscape / small tablet |
| `md` | 900 px | tablet |
| `lg` | 1200 px | laptop |
| `xl` | 1536 px | large desktop |

The annotation workspace is inherently a dual-panel tool (PDF + sidebar) and cannot reasonably be
used below ~900 px; the plan makes it clean at **≥ 900 px** and adds a friendly notice below that.
All other pages (Docs, Document List, Auth, Home) must work at every breakpoint.

---

## Audit Summary

### Critical (layout broken / content overflows viewport)

| # | File | Issue | Exact location |
|---|------|-------|----------------|
| C1 | `ResultComponent.tsx` | PDF viewer hardcoded `width: "75vw"` — leaves only 25 vw for sidebar regardless of screen | line 1068 |
| C2 | `TableSidebar.tsx` | Styled textarea `width: 50rem` (~800 px) — overflows on any screen narrower than ~900 px | line 83 |
| C3 | `ParagraphSidebar.tsx` | Same `width: 50rem` issue as C2 | line 83 |
| C4 | All five sidebars | `maxWidth: "1000px"` on dialog Paper — dialog is wider than most laptop screens | Sidebar 873, EventSidebar 615 |

### High (poor UX at common resolutions)

| # | File | Issue | Exact location |
|---|------|-------|----------------|
| H1 | All five sidebars | `width: "20vw"` hardcoded — on a 1280 px screen that is only 256 px, cramping content; on a 2560 px screen it is 512 px, wasting space | Sidebar 710, EventSidebar 453, TableSidebar 299, ParagraphSidebar 299, LLMSidebar 42 |
| H2 | `DocsPage.tsx` | Uses deprecated MUI `<Hidden mdDown>` — docs sidebar is completely gone on mobile with no alternative navigation | line 313 |
| H3 | `DocsPage.tsx` | `drawerWidth` is a fixed `260` px constant with no responsive adjustment | line 74 |
| H4 | `SettingSidebar.tsx` | `FormControl` elements with hardcoded `minWidth: 200` and `minWidth: 220` — overflow on narrow sidebars | lines 1098, 1161 |
| H5 | `ResultComponent.tsx` | No mobile-width guard — workspace renders a broken layout below 900 px instead of showing a graceful message | — |
| H6 | `Sidebar.tsx` | `<Table sx={{ minWidth: 650 }}>` relation table always 650 px wide — overflows sidebar | line 947 |

### Medium (polish / consistency)

| # | File | Issue | Exact location |
|---|------|-------|----------------|
| M1 | `Toolbar.css` | Icon/button `font-size: 24px` hardcoded three times — too large at small scales | lines 21, 36, 47 |
| M2 | `Sidebar.css` | No `@media` queries anywhere in the file | whole file |
| M3 | All CSS files | Zero `@media` queries across all 8 CSS files — 3 found in codebase all in external libs | all |
| M4 | `TwoSideComparisonDialog.tsx` | No `maxWidth` cap on dialog — uses full viewport width on small screens | inline check needed |
| M5 | `ContextMenu.tsx` | Fixed-position context menu can extend off-screen on small viewports | clamp logic needed |
| M6 | `DocsPage.tsx` | Main content `maxWidth: 860` — reads fine on desktop but could benefit from responsive padding | line 399 |
| M7 | `HighlightPopup.css` | `max-width: 300px` — too wide for mobile but fine for desktop | line 7 |
| M8 | Multiple dialogs | `fullWidth` not set — dialogs render at fixed widths on small screens | scattered |

---

## Implementation Plan

### Phase 1 — Critical Fixes (layout-breaking issues) ✅ COMPLETED / ⬜ TODO

#### 1.1 — Fix textarea overflow in TableSidebar & ParagraphSidebar

**Files:** `src/components/TableSidebar.tsx`, `src/components/ParagraphSidebar.tsx`

Both files define a `styled` textarea with `width: 50rem`.  Replace with a `max-width` that
respects the container:

```tsx
// Before (TableSidebar.tsx:83, ParagraphSidebar.tsx:83)
const StyledTextarea = styled('textarea')(`
  width: 50rem;
  ...
`);

// After
const StyledTextarea = styled('textarea')(`
  width: 100%;
  max-width: 100%;
  ...
`);
```

#### 1.2 — Fix dialog Paper maxWidth in Sidebar & EventSidebar

**Files:** `src/components/Sidebar.tsx` (line 873), `src/components/EventSidebar.tsx` (line 615)

Both pass `sx={{ maxWidth: "1000px" }}` to the Dialog Paper component.  Replace with a sensible
responsive cap:

```tsx
// Before
PaperProps={{ sx: { maxWidth: "1000px", ... } }}

// After — cap at 90vw, never exceed 720px
PaperProps={{ sx: { maxWidth: "min(720px, 90vw)", width: "100%", ... } }}
```

Also add `fullWidth` to both `<Dialog>` elements.

#### 1.3 — Fix PDF viewer / sidebar width split in ResultComponent

**File:** `src/components/ResultComponent.tsx` (line 1068)

The current hardcoded `width: "75vw"` for the PDF viewer and implicit `25vw` for the sidebar
must become responsive.  Define CSS custom properties so the split adjusts at breakpoints:

```tsx
// Add useTheme + useMediaQuery at component top
const theme = useTheme();
const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
const isMdUp  = useMediaQuery(theme.breakpoints.up('md'));

// PDF viewer sx
sx={{
  width: isLgUp ? "75vw" : isMdUp ? "65vw" : "60vw",
  flexShrink: 0,
  ...
}}
```

Or equivalently, replace with responsive MUI sx object syntax:

```tsx
sx={{
  width: { md: "60vw", lg: "68vw", xl: "72vw" },
  flexShrink: 0,
  overflow: "hidden",
}}
```

---

### Phase 2 — High Priority Fixes

#### 2.1 — Sidebar width: replace hardcoded 20vw with responsive clamp

**Files:** all five sidebar container divs (Sidebar 710, EventSidebar 453, TableSidebar 299,
ParagraphSidebar 299, LLMSidebar 42)

All five share the identical pattern:

```tsx
// Before
<div className="sidebar" style={{ width: "20vw", maxWidth: "1000px" }}>

// After — min 220 px, ideal 22vw, max 360 px
<div className="sidebar" style={{ width: "clamp(220px, 22vw, 360px)" }}>
```

This gives a sensible minimum on 1024 px laptops (~225 px) and a sensible maximum on 4K monitors.

#### 2.2 — DocsPage: replace deprecated Hidden with responsive Drawer

**File:** `src/DocsPage/DocsPage.tsx`

Replace `<Hidden mdDown>` wrapping the permanent Drawer with MUI's built-in responsive Drawer
pattern.  Add a hamburger icon button in the AppBar for small screens, and render the drawer as
`temporary` on `mdDown` and `permanent` on `mdUp`:

```tsx
// State for mobile drawer
const [mobileOpen, setMobileOpen] = React.useState(false);

// Drawer — permanent on md+, temporary (modal) on sm-
<Drawer
  variant={isMdUp ? "permanent" : "temporary"}
  open={isMdUp || mobileOpen}
  onClose={() => setMobileOpen(false)}
  ModalProps={{ keepMounted: true }}  // better mobile perf
  sx={{
    width: drawerWidth,
    flexShrink: 0,
    display: { xs: "block" },   // always in DOM
    "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
  }}
>
  {drawerContent}
</Drawer>

// Hamburger button — only shown below md
<IconButton
  onClick={() => setMobileOpen(true)}
  sx={{ display: { md: "none" }, mr: 1 }}
>
  <MenuIcon />
</IconButton>
```

Remove the now-unused `Hidden` import.

#### 2.3 — SettingSidebar FormControl minWidth

**File:** `src/components/SettingSidebar.tsx` (lines 1098, 1161)

```tsx
// Before
<FormControl sx={{ m: 1, minWidth: 200 }}>
<FormControl sx={{ mt: 2, minWidth: 220 }}>

// After — fills parent, min width avoided
<FormControl sx={{ m: 1, width: "100%" }}>
<FormControl sx={{ mt: 2, width: "100%" }}>
```

#### 2.4 — Add small-screen guard to ResultComponent

**File:** `src/components/ResultComponent.tsx`

Below `md` (< 900 px), the dual-panel workspace cannot usefully render.  Add a guard that
replaces the whole workspace with a centered notice:

```tsx
const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

if (!isMdUp) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100vh", p: 3, textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Screen too small
      </Typography>
      <Typography variant="body2" color="text.secondary">
        The annotation workspace requires a screen width of at least 900 px.
        Please use a tablet in landscape mode, a laptop, or a desktop.
      </Typography>
    </Box>
  );
}
```

#### 2.5 — Relation table overflow in Sidebar

**File:** `src/components/Sidebar.tsx` (line 947)

```tsx
// Before
<Table sx={{ minWidth: 650 }}>

// After — scrollable container + remove hard minWidth
<Box sx={{ overflowX: "auto" }}>
  <Table sx={{ minWidth: 400 }}>
    ...
  </Table>
</Box>
```

---

### Phase 3 — Medium Polish

#### 3.1 — Toolbar CSS: responsive font sizes

**File:** `src/style/Toolbar.css`

Replace the three `font-size: 24px` rules with a responsive value and add a media query for
small screens:

```css
/* Before */
.toolbar-icon { font-size: 24px; }

/* After */
.toolbar-icon { font-size: clamp(18px, 2vw, 24px); }
```

#### 3.2 — TwoSideComparisonDialog: add fullWidth + maxWidth cap

**File:** `src/components/TwoSideComparisonDialog.tsx`

Find the root `<Dialog>` element and add:

```tsx
<Dialog
  fullWidth
  maxWidth="lg"   // caps at ~1200px, scales down with fullWidth
  ...
>
```

#### 3.3 — ContextMenu: clamp position to viewport

**File:** `src/components/ContextMenu.tsx`

After calculating `top` and `left`, clamp them so the menu never extends off-screen:

```tsx
const MENU_W = 200; // approximate menu width
const MENU_H = 300; // approximate menu height

const clampedLeft = Math.min(left, window.innerWidth  - MENU_W - 8);
const clampedTop  = Math.min(top,  window.innerHeight - MENU_H - 8);
```

#### 3.4 — DocsPage main content: responsive padding & max-width

**File:** `src/DocsPage/DocsPage.tsx` (line 399)

```tsx
// Before
<Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>

// After
<Box component="main" sx={{
  flexGrow: 1,
  p: { xs: 2, sm: 3, md: 4 },
  maxWidth: { sm: "100%", md: 860 },
  mx: "auto",
  overflowX: "hidden",
}}>
```

#### 3.5 — Add media queries to Sidebar.css

**File:** `src/style/Sidebar.css`

Add a block at the bottom:

```css
@media (max-width: 1200px) {
  .sidebar-entity-name { font-size: 0.8rem; }
  .sidebar-heading      { font-size: 0.95rem; }
}

@media (max-width: 900px) {
  .sidebar-entity-name { font-size: 0.75rem; }
}
```

---

## File Change Summary

| File | Phase | Type of change |
|------|-------|----------------|
| `src/components/TableSidebar.tsx` | 1 | Textarea `width: 50rem` → `width: 100%` |
| `src/components/ParagraphSidebar.tsx` | 1 | Textarea `width: 50rem` → `width: 100%` |
| `src/components/Sidebar.tsx` | 1, 2 | Dialog maxWidth; sidebar width clamp; table overflow scroll |
| `src/components/EventSidebar.tsx` | 1, 2 | Dialog maxWidth; sidebar width clamp |
| `src/components/LLMSidebar.tsx` | 2 | Sidebar width clamp |
| `src/components/ResultComponent.tsx` | 1, 2 | PDF viewer responsive split; small-screen guard |
| `src/components/SettingSidebar.tsx` | 2 | FormControl width → 100% |
| `src/components/TwoSideComparisonDialog.tsx` | 3 | fullWidth + maxWidth="lg" |
| `src/components/ContextMenu.tsx` | 3 | Viewport-clamp position |
| `src/DocsPage/DocsPage.tsx` | 2, 3 | Replace Hidden; responsive Drawer; main content padding |
| `src/style/Toolbar.css` | 3 | clamp() font sizes |
| `src/style/Sidebar.css` | 3 | Add media queries |

---

## Constraints

- No new npm packages.
- Zero new TypeScript errors (baseline is 64 pre-existing).
- No changes to API calls, auth logic, or annotation state.
- Do not modify `LLMSidebar copy.tsx` (stale file) or `DocumentList.legacy.tsx`.
- Run `npx tsc --noEmit` after each phase to confirm no regressions.

---

---

### Phase 4 — Post-Review Issues (from screenshot audit)

Issues discovered after Phases 1-3: pagination overlap, WorkflowStepper collision, missing mobile
layout, no resize handles.

#### 4.1 — Fix pagination fixed positioning in Sidebar & EventSidebar

**Files:** `src/components/Sidebar.tsx` (line 870), `src/components/EventSidebar.tsx` (line 612)

`position: "fixed"` pulls the pagination div out of flow and positions it relative to the viewport
with no `left` value — it lands at the sidebar's natural x-position but can overlap the
SettingSidebar when the viewport is narrow.

```tsx
// Before
style={{ position: "fixed", bottom: 0, width: "clamp(200px, 20vw, 340px)", ... }}

// After — sticky keeps pagination inside the sidebar scroll container
style={{ position: "sticky", bottom: 0, width: "100%", ... }}
```

#### 4.2 — Fix WorkflowStepper toggle/step overlap

**File:** `src/components/GuidanceSystem/WorkflowStepper.tsx`

The header `Box` with `onClick={onToggleVisibility}` spans the full width. When the step count
text is long it squeezes the toggle `IconButton` off-screen; clicking near the toggle can trigger
a step button instead.

Fixes:
- Add `minWidth: 0; overflow: "hidden"` to the left text `Box` so it truncates rather than
  expanding.
- Add `flexShrink: 0` to the toggle `IconButton` so it is never compressed.
- Stop propagation on step button clicks to prevent accidental toggle.

```tsx
// Left text box
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>

// Toggle button
<IconButton size="small" tabIndex={-1} sx={{ flexShrink: 0 }}>

// Step buttons — stop propagation
<StepButton onClick={(e) => { e.stopPropagation(); onStepClick?.(step.id); }}>
```

#### 4.3 — Mobile phone layout (< 900 px) in ResultComponent

**File:** `src/components/ResultComponent.tsx`

Replace the "Screen too small" fallback with a proper mobile view that uses a `BottomNavigation`
tab bar to switch between:
1. **PDF** — full-width PDF viewer + Toolbar (no annotation sidebar)
2. **Annotations** — the sidebar relevant to the current mode
3. **Settings** — SettingSidebar

Each tab renders in a full-viewport `Box`. The PDF tab uses the `pdfloader` built from the
current `selectedMode` logic; the other two tabs render the `sidebar` and `SettingSidebar`
respectively.

```tsx
// xs/sm-only state
const [mobileTab, setMobileTab] = useState(0);  // 0=PDF, 1=Annotations, 2=Settings
const BOTTOM_NAV_H = 56;

if (!isMdUp) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {mobileTab === 0 && pdfPanel}
        {mobileTab === 1 && <Box sx={{ height: '100%', overflow: 'auto' }}>{sidebar}</Box>}
        {mobileTab === 2 && <Box sx={{ height: '100%', overflow: 'auto' }}><SettingSidebar .../></Box>}
      </Box>
      {/* Bottom nav */}
      <BottomNavigation value={mobileTab} onChange={(_, v) => setMobileTab(v)} showLabels sx={{ borderTop: '1px solid #e0e0e0' }}>
        <BottomNavigationAction label="PDF" icon={<ArticleIcon />} />
        <BottomNavigationAction label="Entities" icon={<ListIcon />} />
        <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Box>
  );
}
```

#### 4.4 — Resizable PDF viewer and annotation sidebar panels

**File:** `src/components/ResultComponent.tsx`

Add drag handles between the three desktop panels (PDF viewer | left sidebar | SettingSidebar).
Implement with `useRef`-tracked mouse events — no new packages.

```tsx
const [pdfWidthPct, setPdfWidthPct] = useState(isLgUp ? 72 : 65);
const [sidebarWidthPx, setSidebarWidthPx] = useState(250);
const containerRef = useRef<HTMLDivElement>(null);
const draggingRef = useRef<'pdf' | 'sidebar' | null>(null);
const dragStartXRef = useRef(0);
const dragStartValRef = useRef(0);

// attach window mousemove/mouseup once (useEffect)
// resize handles: thin vertical dividers between panels
// cursor: col-resize on the handle divs
```

---

## File Change Summary (Phase 4)

| File | Phase | Type of change |
|------|-------|----------------|
| `src/components/Sidebar.tsx` | 4 | Pagination `fixed` → `sticky` |
| `src/components/EventSidebar.tsx` | 4 | Pagination `fixed` → `sticky` |
| `src/components/GuidanceSystem/WorkflowStepper.tsx` | 4 | Overflow + stop-propagation fix |
| `src/components/ResultComponent.tsx` | 4 | Mobile tabbed layout + resizable panels |

---

---

### Phase 5 — Post-Resize Audit Fixes

Issues found after Phase 4: desktop whitespace on resize, mobile entity popup layout broken.

#### 5.1 — Fix SettingSidebar whitespace on desktop resize

**File:** `src/components/ResultComponent.tsx`

`SettingSidebar` is a direct flex child but has no `flexGrow`/`flex: 1`. After resizing the left
panels, the settings bar no longer fills remaining width — a gap appears on the right.

```tsx
// Wrap SettingSidebar so it grows to fill all remaining space
<Box sx={{ flex: 1, overflow: 'auto', height: '100vh', minWidth: 0 }}>
  <SettingSidebar ... />
</Box>
```

#### 5.2 — Fix mobile dialog (entity popup) layout in CommentForm

**File:** `src/pdf_highlighter/components/CommentForm.tsx`

`CardActions` uses `justifyContent: 'space-between'` with two `Box` groups side by side.
On phones the two groups overflow horizontally.

```tsx
// Before
<CardActions sx={{ justifyContent: 'space-between' }}>

// After — wrap on small screens
<CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    ...left buttons...
  </Box>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    ...right buttons...
  </Box>
</CardActions>
```

Also: give the dialog tighter margins on mobile via
`PaperProps={{ sx: { m: { xs: 1, sm: 2 } } }}` in `PdfHighlighter.tsx`.

---

## File Change Summary (Phase 5)

| File | Phase | Type of change |
|------|-------|----------------|
| `src/components/ResultComponent.tsx` | 5 | Wrap SettingSidebar with flex: 1 |
| `src/pdf_highlighter/components/CommentForm.tsx` | 5 | CardActions flexWrap on mobile |
| `src/pdf_highlighter/components/PdfHighlighter.tsx` | 5 | Dialog margin on mobile |

---

## Implementation Status

| Phase | Status |
|-------|--------|
| Phase 1 — Critical Fixes | ✅ COMPLETED |
| Phase 2 — High Priority | ✅ COMPLETED |
| Phase 3 — Medium Polish | ✅ COMPLETED |
| Phase 4 — Post-Review Fixes | ✅ COMPLETED |
| Phase 5 — Post-Resize Audit | ✅ COMPLETED |

## ALL PHASES COMPLETE — 0 new TypeScript errors introduced (baseline 64 maintained)

## ALL PHASES COMPLETE — 0 new TypeScript errors introduced (baseline 64 maintained)
