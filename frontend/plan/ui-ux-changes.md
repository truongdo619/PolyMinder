# UI/UX Changes — March 2026

## Area 1: Context Menus (ContextMenu.tsx, ContextMenuLLM.tsx, ContextMenu.css)

### Close on outside click + Escape key
- Added `useRef` + `useEffect` with `mousedown` and `keydown` listeners
- Both ContextMenu and ContextMenuLLM now accept `onClose` prop
- ResultComponent passes `onClose={() => setContextMenu(null)}` at both render sites

### Better styling
- Raised `z-index` from 1000 to 1400 (above MUI Dialogs at 1300)
- Added `border-radius: 8px`, subtle border, tighter padding
- Delete button uses explicit `.context-menu-delete` class instead of `:last-child`
- Added `:focus-visible` outline for keyboard accessibility
- Renamed "Edit Comment" to "Edit Entity" for clarity

## Area 2: Sign In Page (SignInPage.tsx)

### Loading state
- Added `loading` state; button shows "Signing in…" and is disabled during auth
- Prevents double-click / spam submissions

### Client-side validation
- Empty username or password now shows error before making API call
- Added try/catch for network errors with user-friendly message

## Area 3: Sign Up Page (SignUpPage.tsx)

### Loading state
- Added `loading` state; button shows "Signing up…" and is disabled during register
- Try/catch for network errors

### Confirm password error separation
- Previously both Password and Confirm Password fields showed `errorMessage.password`
- Now Confirm Password has its own `confirmPassword` error field
- Added minimum password length validation (4 chars)
- Increased redirect delay from 1000ms to 1500ms so user can read success message

## Area 4: Toolbar (Toolbar.tsx)

### Complete rewrite of re-extract dialog
- Replaced confusing dual-checkbox with clear RadioGroup ("NER + RE" vs "RE only")
- Added explanatory text: "Choose which models to run. This will overwrite current annotations."
- Submit button shows CircularProgress spinner and "Processing…" during request
- Button disabled during processing; dialog can't be closed while processing

### Error handling
- Added Snackbar for error display (was only console.error before)
- `setIsActive(false)` now always runs in `finally` block (was missing on error path)
- Deduplicated code: single try/catch block for both NER and RE endpoints

### Better labels
- Tooltip: "Click to re run the NER & RE models" → "Re-extract entities and relations"
- Home button tooltip: "Click to back to the home page" → "Back to document list"
- Submit button: "Submit" → "Run"
- Removed unused `set` import from date-fns

## Area 5: Entity Edit Panel (EntityEditPanel.tsx)

### Save button disabled when nothing changed
- Added `hasChanges` computed value comparing current state vs original props
- Compares entityType, userComment, headPos, tailPos, and relations (JSON stringify)
- Save button disabled when `!hasChanges || saving`

## Area 6: Sidebar Empty States (Sidebar.tsx)

### Persistent empty state messages
- Added fallback Typography messages for when GuidanceBanners have been dismissed
- Entities: "No entities yet. Select text in the PDF..."
- Relations: "No relations found. Add entities first..."
- These always appear when list is empty (guidance banners can be dismissed once)

## Area 7: Document List Delete Confirmation (DocumentList.tsx)

### Replaced window.confirm with MUI Dialog
- Added `deleteConfirm` state holding `{ id, name }` of document to delete
- Proper Dialog with title "Delete Document", warning text, Cancel/Delete buttons
- Delete button styled with `color="error" variant="contained"`
- Success/error feedback via existing Snackbar system

## Area 8: Scrollbar Compatibility (Sidebar.css)

### Firefox scrollbar support
- Added `scrollbar-width: thin` and `scrollbar-color: #ccc #f4f4f4` to `.sidebar`
- Previously only `-webkit-scrollbar` rules existed (Chrome/Edge only)
