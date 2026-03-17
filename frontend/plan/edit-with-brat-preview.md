# Plan: Live BRAT Preview During Entity Editing

**Goal:** When the `EntityEditPanel` is open, simultaneously show the BRAT annotation visualization for the entity's paragraph — live-updating as the user changes entity type, relations, or span — so the annotator can see exactly how their edits will look before saving.

---

## 1. Current Problem

When a user clicks the edit button on an entity:
- The sidebar switches to `EntityEditPanel` (entity list disappears)
- The BRAT graph in the main PDF area disappears (it's only shown via `BratEmbedding` inside `CommentForm`, which is a tooltip popup on the PDF canvas, not in the sidebar)
- The user edits **blind** — there is no visual feedback showing how the entity type change affects the graph structure, relation arrows, or colour coding
- They must hit **Save**, wait for reload, and then see the BRAT graph again to verify their edit

**Consequence:** Annotators frequently need to save → check → undo → re-edit for type corrections, which is the most common annotation action.

---

## 2. Desired UX

When `EntityEditPanel` is open, the sidebar splits into two vertical sections:

```
┌──────────────────────────────────────┐
│  ▶ Paragraph Context  [show all ▼]  │  ← collapsible, default OPEN
│  ┌──────────────────────────────────┐│
│  │  [BRAT graph of the paragraph]   ││  live: updates when entity type
│  │  current entity is pinned/      ││  chip is clicked, no save needed
│  │  highlighted in the graph       ││
│  └──────────────────────────────────┘│
├──────────────────────────────────────┤
│  [EntityEditPanel: type, relations,  │  ← existing panel, scrollable
│   span, user note, footer buttons]  │
└──────────────────────────────────────┘
```

**Live behaviour:**
- User clicks `POLYMER_FAMILY` chip → BRAT graph instantly re-renders showing the entity with `POLYMER_FAMILY`'s colour
- User deletes a relation → BRAT graph removes that relation arrow immediately
- User adjusts span → BRAT graph re-renders with the new span extent
- **No save required to see the preview**

---

## 3. Key Technical Facts (from codebase research)

| Fact | Detail |
|------|--------|
| `BratEmbedding` | Hardcoded container ID — only one instance safe on page |
| `BratEmbeddingDefault` | Generates unique container ID — safe to mount multiple instances |
| `bratOutput[paraId]` | `{ text, entities: [[id, type, [[start,end]]], ...], relations: [[...]] }` |
| Entity local ID | `highlight.id = "para0_T3"` → local brat ID = `"T3"` (split on `_`)[1] |
| Type change in graph | Replace `entity[1]` with new type string in the entities array |
| Relation change | Rebuild `relations` array in docData |
| Span change | Replace `entity[2]` with new `[[newHead, newTail]]` |
| Re-render trigger | Change the `key` prop on `BratEmbeddingDefault` to force remount |
| BRAT scripts | Loaded by `GlobalState.tsx`; `window.Util` must be available |
| Existing filter pattern | `CommentForm.tsx` already shows filtered single-entity BRAT view |

---

## 4. Implementation Plan

### Phase 1 — `ParagraphBratPreview.tsx` (new component)

A thin wrapper around `BratEmbeddingDefault` that:
1. Takes the raw `bratOutput[paraId]` paragraph data
2. Applies a local override to reflect unsaved edits (entity type, span, relations)
3. Rebuilds `docData` and changes the `key` to trigger remount when overrides change

```typescript
interface ParagraphBratPreviewProps {
  /** Raw paragraph from bratOutput[paraId] */
  paragraphData: { text: string; entities: unknown[]; relations?: unknown[] };
  /** The highlight being edited */
  highlight: CommentedHighlight;
  /** Current (possibly unsaved) entity type */
  currentEntityType: string;
  /** Current (possibly unsaved) relations */
  currentRelations: Relation[];
  /** Current (possibly unsaved) head/tail span positions */
  currentHeadPos: number;
  currentTailPos: number;
}
```

**docData construction (live override):**
```typescript
const localEntityId = highlight.id.split('_')[1]; // e.g. "T3"

const modifiedEntities = paragraphData.entities.map(entity => {
  const e = entity as [string, string, [[number, number]]];
  if (e[0] !== localEntityId) return e;
  return [e[0], currentEntityType, [[currentHeadPos, currentTailPos]]];
});

const modifiedRelations = currentRelations.map((rel, i) => [
  `R${i + 1}`,
  rel.type,
  [['Arg1', localEntityId], ['Arg2', rel.arg_id.split('_')[1]]],
]);

const docData = {
  text: paragraphData.text,
  entities: modifiedEntities,
  relations: modifiedRelations,
};
```

**Remount key:**
```typescript
const previewKey = `${highlight.id}|${currentEntityType}|${currentHeadPos}|${currentTailPos}|${currentRelations.length}`;
```

**"Show all / show related only" toggle:**
- Default: show ALL entities in the paragraph (full context)
- Toggle button: filter to only the edited entity + its relation partners (less noise)

**Collapsible wrapper:**
- Uses MUI `Accordion` (open by default, `defaultExpanded={true}`)
- Collapse hides the BRAT graph to give EntityEditPanel more vertical room

---

### Phase 2 — Modify `EntityEditPanel.tsx`

**New prop:**
```typescript
interface EntityEditPanelProps {
  // ... existing props ...
  paragraphData: { text: string; entities: unknown[]; relations?: unknown[] } | null;
}
```

**New state lifted to pass to preview:**
```typescript
// Already exists in EntityEditPanel — just pass them as props to ParagraphBratPreview
const [entityType, setEntityType] = useState(highlight.comment ?? '');
const [currentHeadPos, setCurrentHeadPos] = useState(headPos);
const [currentTailPos, setCurrentTailPos] = useState(tailPos);
const [relations, setRelations] = useState<Relation[]>(...);
```

**Layout change** — insert preview above the entity type grid:
```
EntityEditPanel body:
  1. ParagraphBratPreview       ← NEW (collapsible accordion, open by default)
  2. SectionHeader "Entity Type"
  3. EntityTypeChipGrid
  4. SectionHeader "Relations"
  5. RelationCard[]
  6. AddRelationRow
  7. SpanAdjustEditor
  8. User Note
```

**No props drilling required** — `ParagraphBratPreview` reads `entityType`, `relations`, `currentHeadPos`, `currentTailPos` directly from EntityEditPanel's local state.

---

### Phase 3 — Modify `Sidebar.tsx`

Pass `paragraphData` to `EntityEditPanel`:

```typescript
// In Sidebar.tsx editPanel computation:
const paraIndex = parseInt(selectedHighlight.id.split("_")[0].match(/\d+/)?.[0] ?? "0", 10);
const paragraphData = bratOutput[paraIndex] ?? null;

// In JSX:
<EntityEditPanel
  highlight={selectedHighlight}
  allHighlights={highlights}
  paragraphText={paragraphData?.text ?? ''}
  headPos={convertedBratOutput[selectedHighlight.id][2][0][0]}
  tailPos={convertedBratOutput[selectedHighlight.id][2][0][1]}
  paragraphData={paragraphData}          // ← NEW
  onSave={handlePanelSave}
  onDelete={handlePanelDelete}
  onClose={handleDialogClose}
/>
```

`paragraphData` is already being partially computed (`bratOutput[paraIndex]?.text`) — this just passes the full object.

---

## 5. Component Architecture

```
Sidebar.tsx
└── EntityEditPanel.tsx  (when dialogOpen)
    ├── ParagraphBratPreview.tsx  ← NEW
    │   ├── Accordion (collapsible, open by default)
    │   │   ├── [show all / related only] toggle button
    │   │   └── BratEmbeddingDefault  (re-keyed on every type/relation/span change)
    └── (existing sections: EntityTypeChipGrid, RelationCard, SpanAdjustEditor, etc.)
```

No changes to `ResultComponent.tsx`, `BratEmbedding.tsx`, or `BratEmbeddingDefault.tsx`.

---

## 6. Live Update Mechanics

| User action | What changes | How BRAT updates |
|-------------|--------------|------------------|
| Click entity type chip | `entityType` state changes | `previewKey` changes → BratEmbeddingDefault remounts with new entity colour |
| Add/delete/edit relation | `relations` state changes | `previewKey` changes (relation count) → remount with updated relation arrows |
| Change span (start/end numbers) | `currentHeadPos`/`currentTailPos` change | `previewKey` changes → remount showing new span extent |
| Type in user note | `userComment` state changes | No BRAT update (user notes don't appear in graph) |

**Remounting cost:** BRAT initialisation via `window.Util.embed()` takes ~50–100 ms per paragraph. For paragraphs with <50 entities this is imperceptible. Span adjustment inputs are the only high-frequency change source; we can debounce `currentHeadPos`/`currentTailPos` by 300 ms before updating `previewKey` to avoid jank while typing numbers.

---

## 7. Files to Create / Modify

### New files
| File | Purpose |
|------|---------|
| `src/components/ParagraphBratPreview.tsx` | Collapsible BRAT preview with live entity override |

### Modified files
| File | Change |
|------|--------|
| `src/components/EntityEditPanel.tsx` | Add `paragraphData` prop; render `ParagraphBratPreview` at top of body |
| `src/components/Sidebar.tsx` | Pass `paragraphData={bratOutput[paraIndex]}` to `EntityEditPanel` |

### Unchanged
- `BratEmbedding.tsx`, `BratEmbeddingDefault.tsx` — used as-is
- `ResultComponent.tsx` — no layout change
- All other components

---

## 8. What We Are NOT Doing

| Idea | Reason |
|------|--------|
| Showing full multi-paragraph BRAT view | Too large for sidebar width; single-paragraph view gives sufficient context |
| Real-time drag-select in BRAT to change span | BRAT JS events are not wired to React state; use SpanAdjustEditor numeric inputs instead |
| Bidirectional sync (click entity in BRAT → select it) | BratEmbedding is read-only; BRAT click callbacks are not hooked into React |
| Debouncing entity type chip clicks | Type clicks are discrete (one click = one type), no debounce needed |
| Debouncing relation changes | Relation changes are discrete add/delete actions, not continuous |
| Debounce on span inputs only | Yes — debounce headPos/tailPos by 300 ms before updating previewKey |

---

## 9. Phase Timeline

| Phase | Work | Effort |
|-------|------|--------|
| P1 — `ParagraphBratPreview.tsx` | New component with live override logic, collapsible accordion, show-all toggle | Small |
| P2 — `EntityEditPanel.tsx` | Add `paragraphData` prop, render preview at top | Small |
| P3 — `Sidebar.tsx` | Pass `paragraphData` to `EntityEditPanel` | Trivial |

Recommended order: P1 → P2 → P3.
