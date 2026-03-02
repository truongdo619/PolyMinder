# Entity & Relation CRUD — PolyMinder v3.3

> Researched from source on 2026-03-02. Covers all create/read/update/delete operations for entities, relations, events, and LLM comparison output.

---

## Quick Reference

| Operation | Component | API Endpoint | Triggers Reload |
|-----------|-----------|--------------|:-:|
| Create Entity | `ExpandableTip` → `ResultComponent` | `POST /create-entity` | ✅ |
| Read Entity | `Sidebar` / `ResultComponent` | (local state) | — |
| Update Entity | `Sidebar` dialog | `POST /update-entity` | ✅ |
| Delete Entity | `Sidebar` dialog | `POST /delete-entity` | ✅ |
| Toggle Confirm Status | `Sidebar` star icon | `POST /change-edit-status` | local only |
| Apply Matched Entities | `Sidebar` match dialog | `POST /apply-update` | ✅ |
| Create Relation | `Sidebar` relation tab | `POST /update-relations` | ✅ |
| Update Relation | `Sidebar` relation tab | `POST /update-relations` | ✅ |
| Delete Relation | `Sidebar` relation tab | `POST /update-relations` | ✅ |
| Edit Event | `EventSidebar` | `POST /edit-event` | ✅ |
| Delete Event | `EventSidebar` | `POST /delete-event` | ✅ |
| Update LLM Entity | `TwoSideComparisonDialog` | `POST /update-LLM-output-entity` | ✅ |
| Delete LLM Entity | `TwoSideComparisonDialog` | `POST /delete-LLM-output-entity` | ✅ |
| Update LLM Relation | `TwoSideComparisonDialog` | `POST /update-LLM-output-relation` | ✅ |
| Merge LLM → Base | `TwoSideComparisonDialog` | `POST /merge_LLM_result` | ✅ |
| Set Visible Paragraphs | `Sidebar` / `EventSidebar` | `POST /set-visible` | ✅ |

---

## Authentication & API Pattern

All API calls use a shared Axios instance (`src/axiosSetup.ts`) with:
- `Authorization: Bearer {localStorage.accessToken}` header
- Response interceptor: on 401 → auto-refresh token → retry; on refresh failure → clear tokens

```typescript
const response = await axiosInstance.post(
  `${import.meta.env.VITE_BACKEND_URL}/endpoint`,
  data,
  { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
);
```

---

## Core Data Types

```typescript
// Main entity type
interface CommentedHighlight extends Highlight {
  id: string;           // "para{paraId}_T{entityId}" e.g. "para0_T1"
  comment?: string;     // Entity type: POLYMER, PROP_VALUE, MONOMER, etc.
  content: { text: string };
  position: { boundingRect: { pageNumber, x1, y1, x2, y2, width, height } };
  relations?: Relation[];
  edit_status?: "confirmed" | "none";
  user_comment?: string;
}

// Relation type
interface Relation {
  type: string;       // e.g. "has_property", "has_value", "abbreviation_of"
  arg_id: string;     // target entity ID "para{paraId}_T{entityId}"
  arg_type: string;   // target entity type
  arg_text: string;   // target entity text
}
```

### Standard API Response (most entity endpoints)
```json
{
  "brat_format_output": [],
  "pdf_format_output": [],
  "document_id": "string",
  "update_id": number,
  "filename": "string"
}
```

---

## 1. Entity CRUD

### 1.1 Create Entity

**UI Flow:** User selects text in PDF → tip popup appears (`ExpandableTip`) → clicks entity type button → `CommentForm` expands → submits.

**Handler:** `addHighlight()` in `src/components/ResultComponent.tsx`

**API:**
```
POST /create-entity
```
```json
{
  "document_id": "string",
  "update_id": number,
  "para_id": number,
  "position": { /* bounding box from PDF.js */ },
  "comment": "ENTITY_TYPE",
  "scale_value": number
}
```

**State updates after success:**
```typescript
setBratOutput(response.data.brat_format_output);
setDocumentId(response.data.document_id);
setUpdateId(response.data.update_id);
setVisibleHighlights(response.data.pdf_format_output);
navigate('/result', { state: { highlights, url } });
```

**Key file:** `src/components/ResultComponent.tsx` (lines ~492–538)

---

### 1.2 Read Entity

Entities are loaded when a document is opened via `/get-document/:id`, stored in:
- `GlobalContext.bratOutput` — BRAT format (used for BRAT visualization)
- Local state `highlights: CommentedHighlight[]` in `ResultComponent`
- Filtered views: `filteredHighlights`, `relationHighlights`, `eventHighlights` etc.

**Display locations:**
- `Sidebar.tsx` — entity list grouped by type
- `EventSidebar.tsx` — event entities only
- `TwoSideComparisonDialog.tsx` — side-by-side comparison

---

### 1.3 Update Entity

**UI Flow:** Entity item in Sidebar → click edit icon → dialog opens → Tab 0 (Entity) → edit type / select new text span → "Save & Reload".

**Handler:** `handleEntitySaveAndReload()` in `src/components/Sidebar.tsx`

**API:**
```
POST /update-entity
```
```json
{
  "document_id": "string",
  "update_id": number,
  "id": "para0_T1",
  "head_pos": number,
  "tail_pos": number,
  "type": "NEW_ENTITY_TYPE",
  "user_comment": "string"
}
```

**Special — Matched Entities:** Backend may return `matched_entities` listing other entities with the same text. A dialog lets the user select which ones to bulk-update via `POST /apply-update`.

**Key file:** `src/components/Sidebar.tsx` (lines ~295–423)

---

### 1.4 Delete Entity

**UI Flow:** Edit dialog → Delete button → confirmation → submit.

**Handler:** `handleDelete()` in `src/components/Sidebar.tsx`

**API:**
```
POST /delete-entity
```
```json
{
  "document_id": "string",
  "update_id": number,
  "ids": ["para0_T1"]
}
```

**Key file:** `src/components/Sidebar.tsx` (lines ~428–472)

---

### 1.5 Toggle Confirmed Status

**UI Flow:** Star icon (⭐/☆) next to entity → confirmation dialog → toggle.

**Handler:** `handleConfirmStar()` in `src/components/Sidebar.tsx`

**API:**
```
POST /change-edit-status
```
```json
{
  "document_id": "string",
  "update_id": number,
  "id": "para0_T1"
}
```

**Note:** Status is toggled locally (`"confirmed"` ↔ `"none"`) without a full page reload.

**Key file:** `src/components/Sidebar.tsx` (lines ~644–691)

---

### 1.6 Apply Update to Matched Entities

After an entity text change, backend detects other entities with matching text.

**API:**
```
POST /apply-update
```
```json
{
  "list_update": [{ "para_id": number, "page_number": [number], "entity_id": "string" }],
  "old_entity": { /* entity before update */ },
  "new_entity": { /* entity after update */ },
  "document_id": "string",
  "update_id": number
}
```

**Key file:** `src/components/Sidebar.tsx` (lines ~357–423)

---

## 2. Relation CRUD

Relations belong to an entity (`highlight.relations[]`). All changes are persisted by sending the **full updated relations array** for that entity — there is no separate create/delete endpoint, only `update-relations`.

### 2.1 Add Relation

**UI Flow:** Edit dialog → Tab 1 (Relations) → click "+" → select relation type + target entity → "Add" button → relation added to local array.

**Function:** `handleAddRelation()` in `src/components/Sidebar.tsx`

```typescript
const newRelation = {
  type: newRelationType,          // e.g. "has_property"
  arg_id: newRelationTarget,      // target entity ID
  arg_type: targetEntity.comment,
  arg_text: targetEntity.content.text,
};
selectedHighlight.relations.push(newRelation);
```

Persisted on "Save & Reload" → `handleRelationSaveAndReload()`.

---

### 2.2 Update Relation

**UI Flow:** Click relation type label inline → dropdown to choose new type → click "Save & Reload".

**Function:** `handleSaveRelationType()` in `src/components/Sidebar.tsx`

```typescript
selectedHighlight.relations[editingRelationIndex].type = editedRelationType;
```

Persisted on "Save & Reload" → same endpoint below.

---

### 2.3 Delete Relation

**UI Flow:** Trash icon on relation row → removed from local array immediately.

```typescript
selectedHighlight.relations.splice(index, 1);
setHighlights([...highlights]);
```

Deletion is implicit — when "Save & Reload" fires, the removed relation is absent from the array sent to backend.

---

### 2.4 Persist All Relation Changes

**Handler:** `handleRelationSaveAndReload()` in `src/components/Sidebar.tsx` (lines ~570–616)

**API:**
```
POST /update-relations
```
```json
{
  "document_id": "string",
  "update_id": number,
  "entity_id": "para0_T1",
  "relations": [
    {
      "type": "has_property",
      "arg_id": "para0_T3",
      "arg_type": "PROP_NAME",
      "arg_text": "ionic conductivity"
    }
  ]
}
```

**Important:** Sends the full relations array — backend replaces all relations for this entity. Add, update, and delete all go through this single endpoint.

**Key file:** `src/components/Sidebar.tsx` (lines ~507–624)

---

## 3. Event Entity CRUD

Events are a specialised entity type with a trigger span + argument roles. Managed in `EventSidebar.tsx`.

### 3.1 Edit Event

**UI Flow:** Event item → click edit icon → "Edit Event" dialog → edit trigger span and/or argument roles → "Save".

**Handler:** `saveEditedEvent()` in `src/components/EventSidebar.tsx` (lines ~272–319)

**API:**
```
POST /edit-event
```
```json
{
  "document_id": "string",
  "update_id": number,
  "para_id": number,
  "trigger_new_head": number,
  "trigger_new_tail": number,
  "event": {
    "event_id": "string",
    "trigger_id": "string",
    "arguments": [["THEME", "para0_T2"], ["CAUSE", "para0_T5"]]
  }
}
```

---

### 3.2 Delete Event

**UI Flow:** Edit Event dialog → Delete button → confirmation dialog → confirm.

**Handler:** `handleDelete()` in `src/components/EventSidebar.tsx` (lines ~386–445)

**API:**
```
POST /delete-event
```
```json
{
  "document_id": "string",
  "update_id": number,
  "para_id": number,
  "event_id": "string"
}
```

---

## 4. LLM Output CRUD (Comparison Dialog)

When comparing LLM extraction with base model output in `TwoSideComparisonDialog`, entities and relations can be edited independently in the LLM output before merging.

### 4.1 Update LLM Entity

**API:**
```
POST /update-LLM-output-entity
```
```json
{
  "document_id": "string",
  "update_id": number,
  "id": "entity_id",
  "head_pos": number,
  "tail_pos": number,
  "type": "ENTITY_TYPE",
  "user_comment": "string",
  "llm_text_id": "string",
  "paragraph_id": number
}
```

**Key file:** `src/components/TwoSideComparisonDialog.tsx` (lines ~1227–1239)

---

### 4.2 Delete LLM Entity

**API:**
```
POST /delete-LLM-output-entity
```
```json
{
  "document_id": "string",
  "update_id": number,
  "ids": ["entity_id"],
  "llm_text_id": "string",
  "paragraph_id": number
}
```

**Key file:** `src/components/TwoSideComparisonDialog.tsx` (lines ~1348–1357)

---

### 4.3 Update LLM Relation

**API:**
```
POST /update-LLM-output-relation
```
```json
{
  "document_id": "string",
  "update_id": number,
  "entity_id": "{llmTextId}_{entityId}",
  "llm_text_id": "string",
  "paragraph_id": number,
  "relations": [
    {
      "type": "relation_type",
      "arg_type": "TARGET_TYPE",
      "arg_id": "{llmTextId}_{targetId}",
      "arg_text": "target text"
    }
  ]
}
```

**Key file:** `src/components/TwoSideComparisonDialog.tsx` (lines ~1200–1209)

---

### 4.4 Merge LLM Results into Base

**UI Flow:** "Merge LLM into Base" button → `MergePreviewDialog` shows diff → "Confirm Merge".

**Handler:** `handleConfirmMergeFromPreview()` in `TwoSideComparisonDialog.tsx` (lines ~1078–1133)

**API:**
```
POST /merge_LLM_result
```
```json
{
  "document_id": "string",
  "update_id": number,
  "llm_text_id": "string",
  "paragraph_id": number
}
```

**Response:** Full document response — all highlights, brat output, filename updated.

---

## 5. Paragraph Visibility

Controls which paragraphs are visible/active for annotation.

**UI Flow:** "adjust your selection" link in Sidebar/EventSidebar → checkbox dialog per paragraph → "Save & Reload".

**API:**
```
POST /set-visible
```
```json
{
  "document_id": "string",
  "update_id": number,
  "visible_list": [true, false, true, true]
}
```

**Key files:**
- `src/components/Sidebar.tsx` (lines ~251–292)
- `src/components/EventSidebar.tsx` (lines ~203–244)

---

## 6. Global State Structure

```typescript
// GlobalContext (src/GlobalState.tsx)
{
  bratOutput,       // BRAT format paragraphs with entities/relations
  tableOutput,      // Table extraction results
  LLLOutput,        // LLM output — NOTE: named LLLOutput not LLMOutput
  documentId,       // Current document UUID
  updateId,         // Current version stamp (increments on each save)
  fileName,         // Current PDF filename for URL construction
  supportedModels,  // Available NLP/LLM models
  settings          // Annotation schema: entity types, relation types
}

// ResultComponent local state (key ones)
{
  highlights,            // CommentedHighlight[] — all entities
  filteredHighlights,    // Subset after sidebar filter
  relationHighlights,    // Entities that have at least one relation
  eventHighlights,       // Event-type entities
  paraHighlights,        // Paragraph highlights
  tableHighlights,       // Table highlights
  selectedMode,          // "Entities" | "Relations" | "Events" | "Tables" | "Paragraphs" | "LLM"
  pdfScaleValue,         // Current PDF zoom level
  currentPDFPage         // Current visible page number
}
```

---

## 7. Key Files

| File | Responsibility |
|------|---------------|
| `src/components/ResultComponent.tsx` | Orchestration: `addHighlight`, `editHighlight`, state wiring |
| `src/components/Sidebar.tsx` | Entity list, edit/delete/create dialog, relation tab |
| `src/components/EventSidebar.tsx` | Event entity list, edit/delete |
| `src/components/TwoSideComparisonDialog.tsx` | LLM vs base comparison, merge |
| `src/components/MergePreviewDialog.tsx` | Merge preview/confirm |
| `src/pdf_highlighter/components/CommentForm.tsx` | Entity annotation form (in PDF tip) |
| `src/pdf_highlighter/components/LLMCommentForm.tsx` | LLM-assisted annotation form |
| `src/axiosSetup.ts` | Shared Axios instance with 401 interceptor |
| `src/authenticate.ts` | `refreshAccessToken`, `logout`, `register` |
| `src/GlobalState.tsx` | Global context provider |
