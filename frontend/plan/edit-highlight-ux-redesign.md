# Edit Highlight UX Redesign Plan

**Goal:** Replace the slow, tab-heavy "Edit Highlight" dialog with a fast, BRAT-inspired inline editing panel that reduces annotation friction to ≤2 clicks for common operations.

---

## 1. Current UX Problems

### Critical bugs
| Problem | Location | Impact |
|---------|----------|--------|
| Relation types are hard-coded strings | `Sidebar.tsx:1031–1038` | Out of sync with `settings.json`, breaks if schema changes |
| No relation constraint validation | `Sidebar.tsx` relation tab | User can create invalid arg1/arg2 type combos |
| Settings relation types not read dynamically | `Sidebar.tsx` | Must manually update code when schema changes |

### Usability friction
| Problem | Clicks required | Ideal |
|---------|:-:|:-:|
| Change entity type | 4 (open dialog → tab 0 → open dropdown → pick → Save) | 1 |
| Add a relation | 7+ (open dialog → tab 1 → Add icon → type dropdown → target dropdown → Add → Save) | 3 |
| Edit a relation type | 5 (open dialog → tab 1 → click text → dropdown → Save) | 2 |
| Delete a relation | 4 (open dialog → tab 1 → trash icon → Save) | 2 |
| Delete an entity | 5 (open dialog → tab 0 → Delete → confirm → auto-close) | 2 |

### Structural problems
- Dialog is full-screen modal (`maxWidth="lg"`) — blocks context while editing
- 3 tabs split what is conceptually one object (entity + its relations)
- No inline paragraph preview showing all neighbour entities
- `EditedEntityComponent` span selection is imprecise (no char position display)
- No real-time feedback — all changes require "Save & Reload" round-trip before visible

---

## 2. Design Philosophy: BRAT-Inspired, Not BRAT-Embedded

BRAT's annotation UX is fast because:
1. **Entities** are selected from a compact coloured-chip menu (no dropdown)
2. **Relations** are created by clicking entity A → clicking entity B → picking type
3. Everything is visible in the text context simultaneously

We cannot reuse `BratEmbedding` for editing — it renders an SVG via the BRAT client JS library which is read-only. But we can **replicate the UX principles** in React:

- Replace the dialog with a **collapsible side panel** inside the Sidebar
- Show the annotated paragraph with all entities as **coloured chips/spans**
- Entity type selection = **coloured button grid** (one button per type, instant click)
- Relation editing = **visual card list** with constraint-aware dropdowns from settings

---

## 3. New UX Flow

### 3.1 Trigger: Click entity in sidebar → panel expands inline

```
Before (current):       After (redesign):
[Entity item] [✏️]  →  Dialog opens (modal, full-page)
                        User switches tabs, fills forms, clicks "Save & Reload"

[Entity item] [✏️]  →  Edit Panel slides open inside sidebar (no modal)
                        Single panel shows everything: context + type + relations
```

The edit panel renders **within** the sidebar column (replaces the entity list area) — no modal, no page navigation.

### 3.2 Entity Type Change — 1 click

```
┌─────────────────────────────────────────────────────┐
│ Edit: "ionic conductivity"                   [×Close]│
│ ─────────────────────────────────────────────────── │
│ Paragraph context (BratEmbedding read-only view):   │
│  "...the [POLYMER] showed [PROP_VALUE] of           │
│   [ionic conductivity] at room [CONDITION]..."      │
│ ─────────────────────────────────────────────────── │
│ Entity Type:                                        │
│ [POLYMER] [POLYMER_FAMILY] [●PROP_NAME] [PROP_VALUE]│
│ [MONOMER] [ORGANIC] [INORGANIC] [MATERIAL_AMOUNT]  │
│ [CONDITION] [REF_EXP] [OTHER_MATERIAL] [COMPOSITE] │
│ [SYN_METHOD] [CHAR_METHOD] [EVENT] [VALUE]          │
│   ↑ coloured chips, selected = filled, click = pick │
│ ─────────────────────────────────────────────────── │
│ User note (optional):  [________________]           │
└─────────────────────────────────────────────────────┘
      [🗑 Delete]                    [Save] [Cancel]
```

- **Coloured chips** match `settings.entity_types[n].bgColor` — instantly recognisable
- Selected type is visually filled/active, others are outlined
- **Click chip → type changes immediately** (optimistic local update)
- Single **Save** button (not "Save & Reload") — background save, no page reload

### 3.3 Relation Editing — compact card list

```
┌─────────────────────────────────────────────────────┐
│ Relations  (for: "ionic conductivity" = PROP_NAME)  │
│ ─────────────────────────────────────────────────── │
│  POLYMER "Nafion"  ──[has_property]──▶  this entity │
│                                         [✏️]  [🗑]  │
│                                                     │
│  ┌── Add Relation ────────────────────────────────┐ │
│  │  Source entity: [POLYMER ▼ "Nafion"         ]  │ │
│  │  Relation type: [has_property               ▼] │ │
│  │  Target entity: [this entity (PROP_NAME)    ]  │ │
│  │  (types auto-filtered per settings constraints)│ │
│  │                              [+ Add Relation]  │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- Relations displayed as readable "Subject → type → Object" cards
- Adding a relation: source + type + target in one row — **3 clicks max**
- Relation type dropdown **dynamically reads from `settings.relation_types`**
- Source/target dropdowns **filtered by constraint** (arg1/arg2 valid types per relation)

### 3.4 Entity Span Adjustment — precision mode

Current `EditedEntityComponent` is imprecise. Replace with:

```
┌─────────────────────────────────────────────────────┐
│ Adjust span (optional)                    [▼ expand]│
│ ─────────────────────────────────────────────────── │
│  "...the Nafion membrane showed [ionic conductivi|  │
│   ty] at 80°C under..."                            │
│  Drag selection handles or:                         │
│  Start: [45] chars    End: [63] chars               │
│  Current: "ionic conductivity"  (18 chars)          │
└─────────────────────────────────────────────────────┘
```

- Collapsed by default (span adjustment is rarely needed)
- Numeric char-position inputs as alternative to drag selection
- Character count shown

---

## 4. Implementation Plan

### Phase 1 — Fix Critical Bugs (no UI change, ~1 day)

**P1.1 — Read relation types dynamically from settings**

In `Sidebar.tsx`, replace hard-coded MenuItems (lines 1031–1038):
```typescript
// BEFORE:
<MenuItem value={"has_property"}>has_property</MenuItem>
// ...

// AFTER (read from GlobalContext):
const { settings } = useContext(GlobalContext);
const relationTypes = settings.relation_types.map(rt => rt.type);
// ...
{relationTypes.map(rt => <MenuItem key={rt} value={rt}>{rt}</MenuItem>)}
```

**P1.2 — Add relation constraint validation**

Filter available relation types and target entities based on settings schema:
```typescript
// When source entity type is POLYMER, filter relation types to those where
// settings.relation_types[n].args has an Arg1 that includes "POLYMER"
const validRelationTypes = settings.relation_types.filter(rt =>
  rt.args.some(arg => arg.role === "Arg1" && arg.targets.includes(sourceEntity.comment))
);

// Filter target entities by valid Arg2 types for chosen relation
const validTargets = highlights.filter(h =>
  chosenRelationType.args.some(arg => arg.role === "Arg2" && arg.targets.includes(h.comment))
);
```

**Deliverables:** `Sidebar.tsx` relation tab bug-fixed; no UI layout change.

---

### Phase 2 — Entity Type Panel (Chip Grid) (~2 days)

Replace the dropdown in the Entity tab with a chip grid:

**New component: `EntityTypeChipGrid.tsx`**
```typescript
interface EntityTypeChipGridProps {
  value: string;                // currently selected type
  onChange: (type: string) => void;
  settings: Settings;
}
```

- Renders one `Chip` per entity type with `bgColor` from settings
- Selected chip: `variant="filled"`, others: `variant="outlined"`
- Single click → `onChange(type)` — no dropdown needed
- No extra styling library needed — uses MUI `Chip` which is already available

**Changes to `Sidebar.tsx`:**
- Replace `FormControl + Select` entity type selector with `<EntityTypeChipGrid />`
- Remove `tabValue` tab switching — merge Entity + Comment into one panel (Relations stays separate or becomes second accordion section)

**Deliverables:** `src/components/EntityTypeChipGrid.tsx` (new), Sidebar entity tab updated.

---

### Phase 3 — Inline Edit Panel (replace modal dialog) (~3 days)

Replace the `Dialog` with an **inline slide-in panel** rendered inside the Sidebar:

**Approach:**
- When `dialogOpen = true`, the sidebar's entity list slides out (or collapses) and the edit panel slides in using CSS transition — no MUI `Dialog` needed
- This keeps the sidebar at its current width; no new layout columns
- Panel has: BratEmbedding context view (read-only, top) + EntityTypeChipGrid + Relations section

**New component: `EntityEditPanel.tsx`**

```typescript
interface EntityEditPanelProps {
  highlight: CommentedHighlight;
  allHighlights: CommentedHighlight[];
  bratParagraph: BratParagraph;         // paragraph context
  onSave: (updated: Partial<CommentedHighlight>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}
```

**Sections (all in one scroll, no tabs):**
1. Header: entity text + Close button
2. BratEmbedding paragraph context (read-only, shows neighbours)
3. EntityTypeChipGrid (instant type select)
4. Relation cards + Add Relation form
5. User note text field (collapsed by default)
6. Footer: Delete | Cancel | Save

**Saving strategy — optimistic update:**
- On Save: immediately update local `highlights` state, then fire API call in background
- On API failure: revert local state + show error snackbar
- **No page navigation/reload** — sidebar re-renders with updated data

**Changes to `Sidebar.tsx`:**
- Replace `<Dialog>` block with conditional `{dialogOpen ? <EntityEditPanel .../> : <EntityList .../>}`
- Remove `navigate('/result', ...)` calls from save handlers — replace with local state update

**Deliverables:** `src/components/EntityEditPanel.tsx` (new), Sidebar.tsx refactored save handlers.

---

### Phase 4 — Relation Visual Cards (~1 day)

**New component: `RelationCard.tsx`**

```typescript
interface RelationCardProps {
  relation: Relation;
  thisEntity: CommentedHighlight;
  allHighlights: CommentedHighlight[];
  settings: Settings;
  onChange: (updated: Relation) => void;
  onDelete: () => void;
}
```

- Displays: `[SOURCE_CHIP] ──[relation_type]──▶ [TARGET_CHIP]`
- Chips are coloured by entity type (reuse entity type colours)
- Click relation type text → inline select (not edit-on-hover)
- Trash icon visible immediately (not hidden behind hover)

**Add Relation Row:**
- Source entity: auto-filled to `thisEntity`, or let user pick any entity in paragraph
- Relation type: MUI Select reading from settings, filtered by source type constraints
- Target entity: MUI Select filtered by chosen relation's Arg2 valid types
- One "Add" button — no multi-step toggle

**Deliverables:** `src/components/RelationCard.tsx` (new), `src/components/AddRelationRow.tsx` (new).

---

### Phase 5 — Span Adjustment UX (~1 day)

**New component: `SpanAdjustEditor.tsx`** (replaces `EditedEntityComponent`)

- Collapsed by default — most edits only change type
- Expand shows:
  - Full paragraph text with selection handles on the entity span
  - Two number inputs for `headPos` / `tailPos`
  - Real-time character count and preview of selected text
- Uses `contentEditable` with `window.getSelection()` (keep existing logic) + adds numeric inputs as a secondary interface

**Deliverables:** `src/components/SpanAdjustEditor.tsx` (new).

---

## 5. Component Architecture

```
Sidebar.tsx
├── EntityList (existing, when !dialogOpen)
│   └── EntityItem
│       └── [✏️ Edit] → sets selectedHighlight, dialogOpen=true
│
└── EntityEditPanel (new, when dialogOpen)
    ├── ParagraphContext (BratEmbedding, read-only)
    ├── EntityTypeChipGrid (new)
    ├── RelationSection
    │   ├── RelationCard[] (new)
    │   └── AddRelationRow (new)
    ├── SpanAdjustEditor (new, collapsed)
    └── UserNoteField
```

---

## 6. Save Strategy: No More "Save & Reload"

Current pattern:
```
Edit → Save & Reload → navigate('/result') → page remounts → data refetches
```

New pattern:
```
Edit → Save → optimistic local state update → background API call
            → success: nothing (already updated)
            → failure: revert + snackbar error
```

Implementation in `Sidebar.tsx` save handlers:
```typescript
const handleSave = async (updated: Partial<CommentedHighlight>) => {
  // 1. Optimistic update
  setHighlights(prev => prev.map(h => h.id === selectedHighlight.id ? {...h, ...updated} : h));
  setDialogOpen(false);

  try {
    // 2. Background API
    const res = await axiosInstance.post(`${BACKEND_URL}/update-entity`, payload);
    // 3. Sync with server response (may include matched entities)
    setBratOutput(res.data.brat_format_output);
    setHighlights(res.data.pdf_format_output);
    setUpdateId(res.data.update_id);
  } catch (err) {
    // 4. Revert on failure
    setHighlights(originalHighlights);
    showErrorSnackbar("Failed to save. Changes reverted.");
  }
};
```

The **matched entities dialog** (when backend returns entities with same text) is kept but triggered as a snackbar/toast prompt after save instead of blocking the flow.

---

## 7. Settings Integration

All relation types and entity types must be read from `GlobalContext.settings`, never hard-coded:

```typescript
// Helper functions (new file: src/lib/settingsHelpers.ts)

export const getRelationTypesForSource = (settings: Settings, sourceType: string): RelationType[] =>
  settings.relation_types.filter(rt =>
    rt.args.some(a => a.role === "Arg1" && a.targets.includes(sourceType))
  );

export const getValidTargetsForRelation = (
  settings: Settings,
  relationType: string,
  highlights: CommentedHighlight[]
): CommentedHighlight[] => {
  const rt = settings.relation_types.find(r => r.type === relationType);
  if (!rt) return [];
  const validTypes = rt.args.find(a => a.role === "Arg2")?.targets ?? [];
  return highlights.filter(h => validTypes.includes(h.comment ?? ''));
};
```

---

## 8. Files to Create / Modify

### New files
| File | Purpose |
|------|---------|
| `src/components/EntityEditPanel.tsx` | Main inline edit panel (replaces Dialog) |
| `src/components/EntityTypeChipGrid.tsx` | Coloured chip grid for type selection |
| `src/components/RelationCard.tsx` | Single relation display + inline edit |
| `src/components/AddRelationRow.tsx` | Add-relation form row |
| `src/components/SpanAdjustEditor.tsx` | Improved span boundary editor |
| `src/lib/settingsHelpers.ts` | Type-constraint helper functions |

### Modified files
| File | Changes |
|------|---------|
| `src/components/Sidebar.tsx` | Replace Dialog with EntityEditPanel; remove hard-coded relation types; optimistic save handlers |
| `src/components/EventSidebar.tsx` | Apply same pattern to event edit dialog |

### Unchanged
- `src/pdf_highlighter/components/BratEmbedding.tsx` — reused as-is for paragraph context (read-only)
- `src/components/ResultComponent.tsx` — minimal changes; remove navigate-after-save calls
- `src/axiosSetup.ts`, `src/authenticate.ts` — no changes

---

## 9. Phase Timeline

| Phase | Work | Estimated effort |
|-------|------|:-:|
| P1 — Fix critical bugs (dynamic relation types + constraint validation) | Sidebar.tsx | Small |
| P2 — EntityTypeChipGrid | New component + Sidebar integration | Small |
| P3 — EntityEditPanel (inline, no modal) | New component + Sidebar refactor | Large |
| P4 — RelationCard + AddRelationRow | Two new components | Medium |
| P5 — SpanAdjustEditor | New component | Small |

Recommended order: P1 → P2 → P4 → P3 → P5 (P3 requires P2 and P4 to be done first).

---

## 10. What We Are NOT Doing

| Idea | Reason not pursued |
|------|--------------------|
| Editing directly on the PDF canvas | PDF.js canvas is raster — overlaying editable elements is unreliable and fragile |
| Using BRAT's `<a>` click callbacks for editing | BratEmbedding uses `window.Util.embed()` which emits DOM events not hooked into React state |
| Relation drag-and-drop on PDF | Complex to implement with PDF.js paging; arrows between spans on different pages are ambiguous |
| Full BRAT editor (brat.js edit mode) | BRAT's edit mode requires its own backend protocol; not compatible with the FastAPI backend |
| Real-time collaborative editing | Out of scope |
