# Prompt: Comprehensive UI/UX Refinement for PolyMinder v3.3

Read CLAUDE.md first for full project context. This app is used by researchers
to annotate scientific PDFs with polymer-related entities and relationships.
The primary users are non-technical domain scientists.

## How to approach this task

For each area below:
1. Read the relevant component(s) and CSS files thoroughly
2. Identify specific UX problems (not just visual polish — think about
   user workflows, cognitive load, discoverability, feedback)
3. Implement the fix
4. Verify the build passes with `npx vite build`

Do NOT over-engineer. Make focused, minimal changes. Prefer CSS/style tweaks
over structural rewrites.

## Area 1: Main Annotation Workspace (`ResultComponent.tsx`)

This is where users spend 90% of their time. Read `ResultComponent.tsx`,
`Sidebar.tsx`, `EntityEditPanel.tsx`, `Sidebar.css`, `ContextMenu.tsx`.

Check and improve:
- **Sidebar tab switching** — Are the tabs (Entities, Events, Tables,
  Paragraphs, LLM, Settings) clearly labeled? Is the active tab visually
  distinct? Consider icons + text labels for clarity.
- **Empty states** — What does the user see when there are no entities? No
  relations? No tables? Add helpful empty state messages with guidance
  (e.g., "Select text in the PDF to create your first entity").
- **Loading feedback** — When API calls are in progress (save, delete,
  re-extract), is there a loading indicator? Check all async operations in
  Sidebar.tsx, SettingSidebar.tsx, Toolbar.tsx for missing loading states.
- **Keyboard shortcuts** — Are there any? Common annotation tools support
  Delete key for selected entity, Escape to close panels, Ctrl+S to save.
  If none exist, add basic ones for the most common actions.
- **Context menu** — Read `ContextMenu.tsx` and `ContextMenuLLM.tsx`. Are menu
  items clearly worded? Is the menu positioned correctly (not clipped by
  viewport edges)? Does it close on outside click?

## Area 2: Entity Edit Panel (`EntityEditPanel.tsx` + sub-components)

This was recently redesigned. Read `EntityEditPanel.tsx`,
`EntityTypeChipGrid.tsx`, `RelationCard.tsx`, `AddRelationRow.tsx`,
`SpanAdjustEditor.tsx`, `ParagraphBratPreview.tsx`.

Check and improve:
- **Visual hierarchy** — Is it clear what the user should focus on first?
  Entity type should be most prominent, then relations, then span adjustment.
- **Confirmation on destructive actions** — Does deleting an entity or
  relation ask for confirmation? If not, add a simple inline confirm
  (not a modal dialog).
- **Unsaved changes warning** — If user has unsaved edits and clicks Cancel
  or clicks another entity, do they get warned? Add if missing.
- **Disabled states** — Save button should be disabled when nothing changed.
  Delete button styling should clearly indicate danger.

## Area 3: Document List Page (`DocumentListPage/`)

Read `DocumentList.tsx`, `DocumentListPage.tsx`.

Check and improve:
- **Upload flow** — Is drag-and-drop discoverable? Is there a clear upload
  button? Progress indication during upload? Error handling for invalid files?
- **Document cards/list** — Can users easily scan document names, dates,
  status? Is there search/filter capability?
- **Bulk actions** — Can users select and delete multiple documents?
- **Empty state** — What does a new user see with no documents?

## Area 4: Authentication Pages

Read `SignInPage.tsx`, `SignUpPage.tsx`, `ForgotPasswordPage.tsx`,
`ResetPasswordPage.tsx`, `ProfilePage.tsx`.

Check and improve:
- **Form validation** — Are errors shown inline next to fields (not just
  alert boxes)? Email format, password strength, confirm password match?
- **Loading states** — Spinner/disabled button during submission?
- **Error messages** — Are server errors (wrong password, user exists)
  displayed clearly?
- **Auto-focus** — Does the first field get auto-focused on page load?

## Area 5: Visual Consistency & Polish

Scan across all pages for:
- **Inconsistent spacing** — Are margins, paddings, gaps consistent between
  pages? Use MUI's `sx` spacing scale consistently (multiples of 8px).
- **Color consistency** — Are entity colors from `settings.json` used
  consistently everywhere entities appear (sidebar, BRAT, highlights,
  chips, context menu)?
- **Typography** — Consistent font sizes for headings, body, captions
  across pages. Avoid hardcoded px values; prefer MUI theme typography.
- **Scrollbar styling** — Check all scrollable containers for consistent
  scrollbar appearance (Sidebar.css has custom scrollbar — is it applied
  everywhere needed?).
- **Hover/focus states** — All interactive elements (buttons, chips, cards)
  should have clear hover feedback. Check tab focus order for accessibility.

## Area 6: Responsive Behavior

The app uses `Sidebar.css` media queries at 1200px and 900px.

Check and improve:
- **Sidebar collapse** — On narrow screens, can the sidebar be fully
  collapsed to give more PDF viewing space? Currently min-width is fixed.
- **PDF viewer + sidebar balance** — Test at 1024px, 1280px, 1440px,
  1920px. Is the split reasonable at each width?
- **Mobile** — This is primarily a desktop app, but check that auth pages
  and home page are usable on tablet (iPad) width (~768px).

## Area 7: Notification & Feedback System

Check how the app communicates success/error/warning to users:
- Is there a consistent snackbar/toast system? Or are some places using
  `alert()`, some using console.log, some using MUI Snackbar?
- Consolidate to a single notification approach (MUI Snackbar with
  auto-hide, positioned bottom-center or bottom-left).
- Ensure every user-initiated action has feedback: save → "Saved
  successfully", delete → "Entity deleted", upload → progress + "Upload
  complete", error → meaningful message.

After completing all areas, create a summary of changes at
`plan/ui-ux-changes.md` listing what was changed and why.
