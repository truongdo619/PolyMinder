import React, { useMemo, useContext, useState, useEffect } from "react";
import LoadingOverlay from "react-loading-overlay-ts";
import { CommentedHighlight } from "../types";

import {
  Box, Card, CardContent, CardActions, Typography,
  Divider, Button, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Slider, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Tooltip,
// ⬇️ Add these imports
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Switch,
  FormControlLabel
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Ensure this is imported

import { GlobalContext } from '../../../src/GlobalState';
import axiosInstance from '../../../src/axiosSetup';
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import BratEmbeddingDefault from "./BratEmbeddingDefault";
import PolylineIcon from "@mui/icons-material/Polyline";
import EditedEntityComponent from "../../../src/components/EditedEntityComponent";
import SplitButton from "../../../src/components/SplitButton";


type DocData = {
  text: string;
  entities: any[];
  relations: any[];
};


const svgStyle = {
  textTransform: "none",
  borderRadius: 1.5,
  boxShadow: "none",
};


/** ---------- Default prompts (keep these editable) ---------- */
const DEFAULT_SYSTEM_PROMPT = `You convert tables to clean natural sentences with one fact per sentence. Be faithful to the table. No added commentary.`;

const DEFAULT_INPUT_PROMPT = `You will receive an HTML table plus nearby text (caption/footnote/context).
Rewrite the table as clear, natural sentences that are easy for downstream NER/RE.

Requirements:
- Output only sentences, one fact per sentence, one sentence per line.
- Structure each sentence like:
  "<Polymer> has <Property> of <Value><Unit> [under <Condition>] [measured by <Method>]."
  The bracketed parts are OPTIONAL. Include <Condition> and/or <Method> ONLY if they are present in the row
  or can be reliably inferred from caption/footnote/context as GLOBAL defaults. Otherwise, omit them entirely.
- Do NOT output placeholder fragments (e.g., do NOT write "under" or "measured by" with nothing after it).
- If caption/footnote/context provide GLOBAL defaults for Condition/Method, apply them to each row UNLESS that row
  specifies its own Condition/Method; row-specific values override GLOBAL defaults.
- Expand header hierarchies or abbreviations so the property name is unambiguous
  (e.g., turn 'Thermal → Tg (°C)' into 'glass transition temperature').
- Preserve numbers, units, symbols (°C, ±), and polymer aliases (PMMA, PEO, etc.) exactly as shown.
- If a cell lists multiple values (e.g., mean ± sd, ranges), write multiple sentences (one per value).
- Do not invent values. Do not summarize or explain. No bullets, numbering, labels, or extra commentary.
- Output only the sentences—nothing before or after.

Example output (format only; do not copy these values):
PMMA has glass transition temperature of 125 °C measured by DSC.
PMMA has weight-average molecular weight of 120 kDa.
PEO has melting temperature of 66 °C under nitrogen at 10 K/min.`;

/** ---------- Component ---------- */
interface TableCommentFormProps {
  onSubmit: (input: string) => void;
  highlight: CommentedHighlight;
  brat_item: {
    text: string;
    entities: Array<any>;
    relations: Array<any>;
    selectedMode: string;
  };
  setTableDialogData: (data: any) => void;
  toggleEditInProgress: (isEditing: boolean) => void;
  onOpenTreeDialog: (id: string | number) => void; // + ADD
  pdfHighlighterUtils: any;
}

/** ---------- Utility: Parse HTML table string ---------- */
const parseHTMLTable = (html: string) => {
  if (!html) return { headers: [], rows: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) return { headers: [], rows: [] };

  const headers: string[] = [];
  const headerRow = table.querySelector("thead tr");
  if (headerRow) {
    headerRow.querySelectorAll("th, td").forEach((cell) =>
      headers.push(cell.textContent?.trim() || "")
    );
  }

  const rows: string[][] = [];
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const row: string[] = [];
    tr.querySelectorAll("td, th").forEach((td) =>
      row.push(td.textContent?.trim() || "")
    );
    rows.push(row);
  });

  return { headers, rows };
};


const TableCommentForm = ({
  onSubmit,
  highlight,
  setTableDialogData,
  toggleEditInProgress,
  onOpenTreeDialog,
  pdfHighlighterUtils,
}: TableCommentFormProps) => {
  const [openRunDialog, setOpenRunDialog] = React.useState(false);
  const [systemPrompt, setSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT);
  const [inputPrompt, setInputPrompt] = React.useState(DEFAULT_INPUT_PROMPT);
  const [isActive, setIsActive] = useState(false);
  const [bratViewVersion, setBratViewVersion] = useState(0);


  const global = useContext(GlobalContext);
  if (!global) throw new Error("GlobalContext must be used within a GlobalProvider");
  const {
    documentId,
    tableOutput,
    updateId,
    setBratOutput,
    setTableOutput,
    setDocumentId,
    setUpdateId,
    setFileName,
    settings,
    supportedModels
  } = global;

  // NEW: Local state for the selected model in the dialog
  const [selectedModel, setSelectedModel] = useState<string>("");

  // ⬇️ NEW: Advanced LLM Settings State
  const [topK, setTopK] = useState<number>(50);
  const [topP, setTopP] = useState<number>(0.9);
  const [temperature, setTemperature] = useState<number>(0.1);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);

  // Initialize selectedModel when supportedModels loads
  useEffect(() => {
    if (supportedModels && supportedModels.length > 0 && !selectedModel) {
      setSelectedModel(supportedModels[0]);
    }
  }, [supportedModels]);


  const handleClose = () => {
    setTableDialogData(null);
    toggleEditInProgress(false);
    if (pdfHighlighterUtils?.scrolledToHighlightIdRef) {
      pdfHighlighterUtils.scrolledToHighlightIdRef.current = null;
      pdfHighlighterUtils.renderHighlightLayers?.();
    }
    const hash = document.location.hash;
    const parts = hash.split("#");
    document.location.hash = parts[0] + "#" + parts[1];
  };

  /** Extract table data from highlight (real values) */
  const tableCaption = highlight.table_caption || "";
  const tableFootnote = highlight.table_footnote || "";
  const tableContext = highlight.table_context || "";
  const tableHTML = highlight.table_body || "";
  const tableName = highlight.table_name || highlight.comment || "Unknown Table";

  // Parse the HTML table to structured rows/columns
  const { headers, rows } = useMemo(() => parseHTMLTable(tableHTML), [tableHTML]);
  
  // keep this existing
  const bratDocs: DocData[] = useMemo(() => {
    const raw = highlight?.result;
    let arr: any = [];
    if (Array.isArray(raw)) arr = raw;
    else if (typeof raw === "string") {
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
    }
    return (arr as any[]).filter(
      (d) => d && typeof d.text === "string" && Array.isArray(d.entities) && Array.isArray(d.relations)
    ) as DocData[];
  }, [highlight?.result]);

  // ⬇️ Add right after the existing bratDocs useMemo(...)
  const [localBratDocs, setLocalBratDocs] = useState<DocData[]>(bratDocs);
  const [activeDocIdx, setActiveDocIdx] = useState(0);

  useEffect(() => {
    setLocalBratDocs(bratDocs);
  }, [bratDocs]);

  const currentDoc = localBratDocs?.[activeDocIdx];

  // Base text used for span selection in EditedEntityComponent (from REAL doc)
  const baseEntityText = currentDoc?.text ?? (highlight.content?.text ?? "");
  
  // ----- Editable entities & relations derived from the current doc -----
  type EditableEntity = {
    id: string;
    type: string;
    start: number;
    end: number;
    text: string;
    comment?: string;   // ⬅ optional
  };

  type EditableRelation = { id: string; type: string; subjId: string; objId: string };

  const [editableEntities, setEditableEntities] = useState<EditableEntity[]>([]);
  const [editableRelations, setEditableRelations] = useState<EditableRelation[]>([]);



  useEffect(() => {
    if (!currentDoc) return;

    // Map BRAT entities: ["T1","TYPE", [[[start,end]]],"text"]
    const ents: EditableEntity[] = (currentDoc.entities || []).map(
      ([eid, etype, spans, etext]: any) => {
        const [start, end] = (spans?.[0] as number[] | undefined) ?? [0, 0];
        return {
          id: String(eid),
          type: String(etype),
          start: Number(start),
          end: Number(end),
          text: String(baseEntityText.slice(Number(start), Number(end))),
        };
      }
    );

    // Map BRAT relations: ["R1","rel_type",[["Arg1","T2"],["Arg2","T1"]]]
    const rels: EditableRelation[] = (currentDoc.relations || []).map(
      ([rid, rtype, args]: any) => {
        const subj = args?.find((a: any[]) => a?.[0] === "Arg1")?.[1] ?? "";
        const obj  = args?.find((a: any[]) => a?.[0] === "Arg2")?.[1] ?? "";
        return { id: String(rid), type: String(rtype), subjId: String(subj), objId: String(obj) };
      }
    );

    setEditableEntities(ents);
    setEditableRelations(rels);
  }, [currentDoc, baseEntityText]);

  // NEW: whenever tableOutput/updateId changes, refresh the currently-open table dialog’s highlight
  useEffect(() => {
    if (!tableOutput || !Array.isArray(tableOutput)) return;
    const id = (highlight as any).table_id ?? (highlight as any).id;
    const updated = tableOutput.find(
      (t: any) => (t.table_id ?? t.id) === id
    );
    if (!updated) return;

    // Push the fresh fields (including new .result) into the dialog’s highlight
    setTableDialogData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        highlight: { ...prev.highlight, ...updated, result: updated.result ?? prev.highlight.result }
      };
    });
  }, [tableOutput, updateId]); // <— depends on global updates

  const handleGenerate = async () => {
    try {
      // Ensure the dialog closes first so it can't sit above the overlay
      setOpenRunDialog(false);
      await new Promise(requestAnimationFrame);

      setIsActive(true);

      const token = localStorage.getItem("accessToken");
      
      const payload = {
        table_name: tableName,
        table_body: tableHTML,
        table_caption: tableCaption,
        table_footnote: tableFootnote,
        context: tableContext,
        prompt: inputPrompt,
        system_prompt: systemPrompt,
        result: "",
        document_id: documentId,
        update_id: updateId,
        table_id: (highlight as any).table_id || highlight.id,
        // ⬇️ UPDATED: Include advanced settings
        llm_setting: {
          name: selectedModel || supportedModels[0],
          top_k: topK,
          top_p: topP,
          temp: temperature,
          max_tokens: maxTokens,
          thinking_mode: thinkingMode
        }
      };

      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/generate-table-content-in-pdf-viewer`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data;
      setBratOutput(data.brat_output_format ?? data.brat_format_output ?? []);
      setTableOutput(data.tables ?? []);
      setDocumentId(data.document_id);
      setUpdateId(data.update_id);
      setFileName(data.file_name ?? data.filename);

      // 🔁 Directly patch the open dialog with the fresh table result
      const id = (highlight as any).table_id ?? (highlight as any).id;
      const updated = (data.tables ?? []).find((t: any) => (t.table_id ?? t.id) === id);

      console.log("Updated table after generation:", updated);
      console.log("Full response data:", id);


      if (updated) {
        setTableDialogData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            highlight: { ...prev.highlight, ...updated, result: updated.result ?? prev.highlight.result }
          };
        });
      }
      
      setBratViewVersion((v) => v + 1);

    } catch (e) {
      console.error("Error generating table content:", e);
    } finally {
      setIsActive(false);
    }
  };

  /** ---------- Utility: Build HTML table string from rows only (no header) ---------- */
  const buildHTMLTable = (rows: string[][]) => {
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const tbody = `<tbody>${rows
      .map(
        (r) =>
          `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`
      )
      .join("")}</tbody>`;

    return `<table>${tbody}</table>`;
  };



  // + NEW: local edit dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editCaption, setEditCaption] = useState(tableCaption);
  const [editFootnote, setEditFootnote] = useState(tableFootnote);
  const [editContext, setEditContext] = useState(tableContext);
  const [_editTableHTML, setEditTableHTML] = useState(tableHTML);

  // Keep edit fields in sync if highlight changes
  useEffect(() => {
    setEditCaption(tableCaption);
    setEditFootnote(tableFootnote);
    setEditContext(tableContext);
    setEditTableHTML(tableHTML);
  }, [tableCaption, tableFootnote, tableContext, tableHTML]);

  // Open/close edit dialog
  const handleOpenEdit = () => setOpenEditDialog(true);
  const handleCloseEdit = () => setOpenEditDialog(false);

  // Save edits back into the currently-open table dialog and global table list
  // Save edits back into backend + update UI
  const handleSaveEdits = async () => {
    try {


      setOpenEditDialog(false);
      setIsActive(true);

      const token = localStorage.getItem("accessToken");
      const tableId = (highlight as any).table_id || highlight.id;

      // Build HTML from the edited grid
      const newHTML = buildHTMLTable(editRows);
      setEditTableHTML(newHTML); // keep local copy in sync, in case you still use it elsewhere

      const payload = {
        table_name: tableName,
        table_body: newHTML,
        table_caption: editCaption,
        table_footnote: editFootnote,
        context: editContext,
        document_id: documentId,
        update_id: updateId,
        table_id: tableId,
      };


      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/edit-tables`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedTable = res.data;

      // Update global document / update IDs if backend sends new ones
      if (typeof updatedTable.document_id !== "undefined") {
        setDocumentId(updatedTable.document_id);
      }
      if (typeof updatedTable.update_id !== "undefined") {
        setUpdateId(updatedTable.update_id);
      }

      // Patch the open dialog's highlight so the UI reflects the edits immediately
      setTableDialogData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          highlight: {
            ...prev.highlight,
            ...updatedTable,
            table_name: updatedTable.table_name ?? prev.highlight.table_name,
            table_body: updatedTable.table_body ?? prev.highlight.table_body,
            table_caption: updatedTable.table_caption ?? prev.highlight.table_caption,
            table_footnote: updatedTable.table_footnote ?? prev.highlight.table_footnote,
            table_context: updatedTable.context ?? prev.highlight.table_context,
            result: prev.highlight.result,
          },
        };
      });

    } catch (e) {
      console.error("Error saving table edits:", e);
    } finally {
      setIsActive(false);
    }
  };


  // ── Sidebar-style "Edit Highlight" dialog state (hardcoded content for now)
  const [openEntityDialog, setOpenEntityDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [_editableComment, setEditableComment] = useState<string>("POLYMER");
  const [_editableUserComment, setEditableUserComment] = useState<string>("");
  const [_showAddRelationRow, setShowAddRelationRow] = useState(false);
  const [_editedRelationType, setEditedRelationType] = useState<string>("");

  
  // ---- Settings → types -----------------------------------------------------
  type EntityDef = { type: string; labels?: string[]; [k: string]: any };
  type RelationDef = { type: string; labels?: string[]; [k: string]: any };

  const entityTypes = useMemo<string[]>(
    () => ((settings?.entity_types as EntityDef[] | undefined)?.map(e => e.type)) ?? [],
    [settings?.entity_types]
  );

  const relationTypes = useMemo<string[]>(
    () => {
      const base = ((settings?.relation_types as RelationDef[] | undefined)?.map(r => r.type)) ?? [
        "has_property","has_value","has_amount","has_condition",
        "abbreviation_of","refers_to","synthesised_by","characterized_by"
      ];
      return base;
    },
    [settings?.relation_types]
  );

  const [newRelation, setNewRelation] = useState<EditableRelation>({
    id: "",
    type: relationTypes[0] ?? "has_property",
    subjId: "",
    objId: "",
  });
  
  useEffect(() => {
    // keep default type in sync with settings
    setNewRelation(prev => ({
      ...prev,
      type: relationTypes[0] ?? "has_property",
    }));
  }, [relationTypes]);


  useEffect(() => {
    if (!entityTypes.length) return;
    setEditableComment(prev => (prev && entityTypes.includes(prev)) ? prev : entityTypes[0]);
  }, [entityTypes]);

  // Hardcoded demo relations to show in the dialog for now
  const [_demoRelations, _setDemoRelations] = useState<Array<{
    type: string; arg_id: string; arg_type: string; arg_text: string;
  }>>([
    { type: "has_property", arg_id: "T2", arg_type: "PROPERTY", arg_text: "glass transition" },
    { type: "has_value",   arg_id: "T3", arg_type: "VALUE",    arg_text: "125 °C" },
  ]);

  const handleDialogCloseSidebarLike = () => { setOpenEntityDialog(false); setTabValue(0); setShowAddRelationRow(false); setEditedRelationType(""); setEditableUserComment(""); };

  // ⬇️ Replace the previous handlers for entities with these
  const handleEntityTypeChangeAt = (i: number, newType: string) => {
    setEditableEntities(prev => prev.map((e, idx) => (idx === i ? { ...e, type: newType } : e)));
  };

  const handleEntitySelectionChangeAt = (i: number, start: number, end: number) => {
    setEditableEntities(prev =>
      prev.map((e, idx) =>
        idx === i ? { ...e, start, end, text: baseEntityText.slice(start, end) } : e
      )
    );
  };

  const addEditableEntity = () => {
    const newId = `T${(editableEntities.length ? Number(editableEntities[editableEntities.length - 1].id.replace(/\D/g, "")) + 1 : 1)}`;
    setEditableEntities(prev => [
      ...prev,
      { id: newId, type: "POLYMER", start: 0, end: Math.min(8, baseEntityText.length), text: baseEntityText.slice(0, Math.min(8, baseEntityText.length)) },
    ]);
  };

  const removeEditableEntityAt = (i: number) => {
    const idToRemove = editableEntities[i]?.id;
    setEditableEntities(prev => prev.filter((_, idx) => idx !== i));
    // Also remove relations that reference this entity
    setEditableRelations(prev => prev.filter(r => r.subjId !== idToRemove && r.objId !== idToRemove));
  };

  // ⬇️ Relation handlers
  const addEditableRelation = () => {
    // don’t add half-empty relations
    if (!newRelation.subjId || !newRelation.objId) return;

    const nextIdx = editableRelations.length + 1;
    const newId = `R${nextIdx}`;

    setEditableRelations(prev => [
      ...prev,
      {
        id: newId,
        type: newRelation.type,
        subjId: newRelation.subjId,
        objId: newRelation.objId,
      },
    ]);

    // reset just the chosen entities for the next add
    setNewRelation(prev => ({
      ...prev,
      subjId: "",
      objId: "",
    }));
  };

  

  const removeEditableRelationAt = (i: number) => {
    setEditableRelations(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateRelationField = (i: number, field: keyof EditableRelation, value: string) => {
    setEditableRelations(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  // ⬇️ Save button in the sidebar dialog (decide which API to call)
  const handleSaveEntitiesAndRelations = () => {
    if (!currentDoc) return;

    if (tabValue === 0) {
      // Entity tab
      handleEntitySaveAndReload();
    } else if (tabValue === 1) {
      // Relation tab
      handleRelationSaveAndReload();
    }
  };


  const handleEntitySaveAndReload = async () => {
    if (!currentDoc) return;
  
    handleDialogCloseSidebarLike();
    try {
      setIsActive(true);
  
      // 1) Rebuild BRAT-style entities for local display
      const rebuiltEntities = editableEntities.map((e, i) => [
        e.id || `T${i + 1}`,
        e.type,
        [[e.start, e.end]],
        baseEntityText.slice(e.start, e.end),
      ]);
  
      // 2) Merge back into current doc (for BRAT viewer)
      const updatedDoc: any = {
        ...currentDoc,
        text: baseEntityText,
        entities: rebuiltEntities,
      };
  
      // 5) Build API-friendly entities: List[Entity_Object]
      const apiEntities = editableEntities.map((e) => ({
        entity_id: e.id,
        entity_type: e.type,
        head_pos: e.start,
        tail_pos: e.end,
        comment: e.comment ?? "",
        entity_text: baseEntityText.slice(e.start, e.end),
      }));
  
      const token = localStorage.getItem("accessToken");
      const tableId = (highlight as any).table_id || highlight.id;
      const resultId =
        (currentDoc as any).result_id ??
        (updatedDoc as any).result_id ??
        activeDocIdx;
  
      const payload = {
        table_id: tableId,
        // if your backend really expects "enities" instead of "entities", use that key:
        // enities: apiEntities,
        entities: apiEntities,
        result_id: resultId,
        document_id: documentId,
        update_id: updateId,
      };
  
      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/update-table-entities`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Response is *one* Table Object (per your spec)
      const raw = res.data;
      const updatedTable =
        raw?.table ?? raw; // allow either {table: {...}} or plain {...}
  
      // 6) Update doc/update IDs if returned
      if (typeof updatedTable.document_id !== "undefined") {
        setDocumentId(updatedTable.document_id);
      }
      if (typeof updatedTable.update_id !== "undefined") {
        setUpdateId(updatedTable.update_id);
      }
  
      // 7) Patch global tableOutput (so sidebar + other UI see the new table)
      setTableOutput((prev: any[] | null) => {
        if (!prev || !Array.isArray(prev)) return prev;
        const tid = updatedTable.table_id ?? updatedTable.id ?? tableId;
        return prev.map((t: any) =>
          (t.table_id ?? t.id) === tid ? { ...t, ...updatedTable } : t
        );
      });
  
      // 8) If backend also sent a fresh `result`, overwrite highlight.result as well
      if (updatedTable.result) {
        setTableDialogData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            highlight: {
              ...prev.highlight,
              ...updatedTable,
              result: updatedTable.result,
            },
          };
        });
      }

      setBratViewVersion(v => v + 1);


    } catch (err) {
      console.error("Error updating table entities:", err);
    } finally {
      setIsActive(false);
      handleDialogCloseSidebarLike();
    }
  };
  
  



  const handleRelationSaveAndReload = async () => {
    if (!currentDoc) return;
  
    // Close the dialog like in the entity handler
    handleDialogCloseSidebarLike();
  
    try {
      setIsActive(true);
  
      const tableId =
        (highlight as any).table_id || (highlight as any).id;
  
      const resultId =
        (currentDoc as any).result_id ??
        activeDocIdx;
  
      // ---- Build Entity_Object[] (same schema as in handleEntitySaveAndReload) ----
      const apiEntities = editableEntities.map((e) => ({
        entity_id: e.id,
        entity_type: e.type,
        head_pos: e.start,
        tail_pos: e.end,
        comment: e.comment ?? "",
        entity_text: baseEntityText.slice(e.start, e.end),
      }));
  
      // ---- Build Relation_Object[] ----
      const apiRelations = editableRelations
        .filter(r => r.subjId && r.objId) // only keep valid rows
        .map((r, i) => ({
          id: r.id || `R${i + 1}`,
          type: r.type,
          arg1_id: r.subjId,
          arg2_id: r.objId,
        }));
  
      const token = localStorage.getItem("accessToken");
  
      const payload = {
        table_id: tableId,
        entities: apiEntities,
        relations: apiRelations,
        result_id: resultId,
        document_id: documentId,
        update_id: updateId,
      };
  
      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/update-table-relations`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // API returns a single Table Object
      const raw = res.data;
      const updatedTable = raw?.table ?? raw;
  
      // Update document / update IDs if backend sends new ones
      if (typeof updatedTable.document_id !== "undefined") {
        setDocumentId(updatedTable.document_id);
      }
      if (typeof updatedTable.update_id !== "undefined") {
        setUpdateId(updatedTable.update_id);
      }
  
      // Patch global tableOutput so other UI sees latest table
      setTableOutput((prev: any[] | null) => {
        if (!prev || !Array.isArray(prev)) return prev;
        const tid = updatedTable.table_id ?? updatedTable.id ?? tableId;
        return prev.map((t: any) =>
          (t.table_id ?? t.id) === tid ? { ...t, ...updatedTable } : t
        );
      });
  
      // If backend returns fresh result list, push into the open dialog
      if (updatedTable.result) {
        setTableDialogData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            highlight: {
              ...prev.highlight,
              ...updatedTable,
              result: updatedTable.result,
            },
          };
        });
      }
  
      // Force BratEmbeddingDefault to remount with new data
      setBratViewVersion((v) => v + 1);
    } catch (err) {
      console.error("Error updating table relations:", err);
    } finally {
      setIsActive(false);
    }
  };
  


  // Editable grid for table body (no header row)
  const [editRows, setEditRows] = useState<string[][]>(rows);

  // Currently focused cell in the grid
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);

  // Keep grid in sync when the parsed HTML changes (or dialog opens)
  useEffect(() => {
    setEditRows(rows);
    setActiveCell(null);
  }, [rows, openEditDialog]);

  // Number of columns in the editable grid
  const columnCount = React.useMemo(() => {
    const lengths = editRows.map((r) => r.length).filter((n) => n > 0);
    return lengths.length ? Math.max(...lengths) : 0;
  }, [editRows]);

  const handleAddRow = () => {
    setEditRows((prev) => {
      const cols = prev.length
        ? Math.max(...prev.map((r) => r.length), 1)
        : 1;

      // no rows yet → create a 1×cols row
      if (!prev.length) {
        return [new Array(cols).fill("")];
      }

      const insertIndex =
        activeCell && activeCell.row >= 0 && activeCell.row < prev.length
          ? activeCell.row + 1
          : prev.length;

      const newRow = new Array(cols).fill("");
      const next = [...prev];
      next.splice(insertIndex, 0, newRow);
      return next;
    });
  };

  const handleAddColumn = () => {
    setEditRows((prev) => {
      // If no rows, make a 1×1 table
      if (!prev.length) {
        return [[ "" ]];
      }

      const maxCols = Math.max(...prev.map((r) => r.length), 1);
      const insertCol =
        activeCell && activeCell.col >= 0 && activeCell.col < maxCols
          ? activeCell.col + 1
          : maxCols;

      return prev.map((row) => {
        const copy = [...row];
        // pad to maxCols
        while (copy.length < maxCols) copy.push("");
        copy.splice(insertCol, 0, "");
        return copy;
      });
    });
  };

  const handleDeleteRowAtCursor = () => {
    setEditRows((prev) => {
      if (!prev.length) return prev;

      const targetRow =
        activeCell && activeCell.row >= 0 && activeCell.row < prev.length
          ? activeCell.row
          : prev.length - 1;

      const next = prev.filter((_, idx) => idx !== targetRow);
      return next;
    });
    setActiveCell(null);
  };

  const handleDeleteColumnAtCursor = () => {
    setEditRows((prev) => {
      const maxCols = Math.max(...prev.map((r) => r.length), 0);
      if (!maxCols) return prev;

      const targetCol =
        activeCell && activeCell.col >= 0 && activeCell.col < maxCols
          ? activeCell.col
          : maxCols - 1;

      const next = prev.map((row) => {
        if (row.length <= targetCol) return row;
        const copy = [...row];
        copy.splice(targetCol, 1);
        return copy;
      });

      return next;
    });
    setActiveCell(null);
  };

  const handleResetTableGrid = () => {
    // Reset to the table extracted from the original HTML
    setEditRows(rows);
    setActiveCell(null);
  };


  // helper: find entity by ID
  const entById = (id?: string) => editableEntities.find(e => e.id === id);

  // helper: clip entity text for outlinedText
  const clip = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n).trim()}...` : s);

  return (
  <LoadingOverlay
    active={isActive}
    spinner
    text="Generating ..."
    styles={{
      overlay: (base) => ({
        ...base,
        position: "fixed",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        zIndex: 200000,
      }),
    }}
  >
    <Box>
      <Card sx={{ width: "100%", boxShadow: 0 }}>
        <CardContent>
          <Typography variant="h5" component="div">
            {tableName}
          </Typography>

          <Slider
            aria-label="Color slider"
            defaultValue={100}
            step={0}
            className="BLOCK_TABLE_BODY_COLOR"
          />

          <Typography variant="body2" sx={{ mb: 2 }}>
            {'"' + (highlight.content?.text?.slice(0, 120) ?? "") + '..."'}
          </Typography>

          {/* Table Preview - MUI Table reconstructed from parsed HTML */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Extracted Table Preview:
              </Typography>
              <IconButton
                size="small"
                aria-label="Edit table, caption, footnote, and context"
                onClick={handleOpenEdit}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>

            {rows.length > 0 ? (
              <TableContainer component={Paper}  elevation={0}  sx={{ maxHeight: 360, overflow: "auto", boxShadow: 1 }}>
                <Table size="small" stickyHeader>
                  {headers.length > 0 && (
                    <TableHead>
                      <TableRow>
                        {headers.map((h, i) => (
                          <TableCell key={i} sx={{ fontWeight: 700 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                  )}
                  <TableBody>
                    {rows.map((r, rowIdx) => (
                      <TableRow key={rowIdx} hover>
                        {r.map((cell, cellIdx) => (
                          <TableCell key={cellIdx}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No valid table structure detected.</Alert>
            )}

            {/* Caption and Footnote */}
            <Box sx={{ mt: 1.5, pt: 1, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {tableCaption && (
                <Typography component="span" variant="body2" sx={{ m: 0 }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>Caption: </Box>
                  <Box component="span" sx={{ fontStyle: "italic" }}>{tableCaption}</Box>
                </Typography>
              )}
              {tableFootnote && (
                <Typography component="span" variant="body2" sx={{ m: 0 }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>Footnote: </Box>
                  {tableFootnote}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* NER/RE Results section */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              NER & RE Results:
            </Typography>

            {bratDocs.length > 0 && (
              <Button
                sx={svgStyle}
                size="small"
                startIcon={<PolylineIcon />}
                variant="contained"
                onClick={() => onOpenTreeDialog((highlight as any).table_id || highlight.id)}
              >
                Open Graph Visualization
              </Button>
            )}
          </Box>


          {bratDocs.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
              {bratDocs.map((doc, idx) => {
                const docKey = `${(doc as any).result_id ?? idx}-${bratViewVersion}`;

                return (
                  <Paper
                    key={docKey}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: "#f7f7f7",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="subtitle1">BRAT View #{idx + 1}</Typography>
                      <IconButton
                        size="small"
                        aria-label={`Edit BRAT View #${idx + 1}`}
                        onClick={() => {
                          setActiveDocIdx(idx);
                          setOpenEntityDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* IMPORTANT: pass the same key here so React remounts BratEmbeddingDefault */}
                    <BratEmbeddingDefault key={docKey} docData={doc} />
                  </Paper>
                );
              })}

            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              No NER/RE results yet. Click <strong>Run with LLM</strong> to
              generate extraction output.
            </Alert>
          )}

        </CardContent>

        <CardActions sx={{ justifyContent: "space-between" }}>
          <Button variant="contained" onClick={() => setOpenRunDialog(true)}>
            Run with LLM
          </Button>
          <Button size="small" onClick={handleClose}>
            Close
          </Button>
        </CardActions>
      </Card>

      {/* ─────────────── LLM Extraction Dialog ─────────────── */}
      <Dialog
        open={openRunDialog}
        onClose={() => setOpenRunDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>🧠 Prepare LLM Extraction</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
          <Grid container spacing={3}>
            {/* LEFT: Read-only table context */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                🧾 Table Context{" "}
                <Typography variant="caption" color="text.secondary">
                  (Read-only)
                </Typography>
              </Typography>

              <TextField
                label="Caption"
                fullWidth
                multiline
                minRows={2}
                value={tableCaption}
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: "#f7f7f7", cursor: "not-allowed" },
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Footnote"
                fullWidth
                multiline
                minRows={2}
                value={tableFootnote}
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: "#f7f7f7", cursor: "not-allowed" },
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Surrounding Text"
                fullWidth
                multiline
                minRows={3}
                value={
                  tableContext.length > 600
                    ? tableContext.slice(0, 600) + "..."
                    : tableContext
                }
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: "#f7f7f7", cursor: "not-allowed" },
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Table HTML (Raw)"
                fullWidth
                multiline
                minRows={7}
                value={tableHTML}
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: "monospace",
                    fontSize: 13,
                    bgcolor: "#f7f7f7",
                    cursor: "not-allowed",
                  },
                }}
              />
            </Grid>

            {/* RIGHT: Editable prompts */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                ✏️ LLM Prompts{" "}
                <Typography variant="caption" color="text.secondary">
                  (Editable)
                </Typography>
              </Typography>

              {/* ⬇️ NEW: Advanced Settings Accordion */}
              <Accordion
                disableGutters
                defaultExpanded={false}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: "#f9f9f9", // slightly distinct background
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "none",
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                  sx={{
                    px: 2,
                    py: 0,
                    minHeight: 48,
                    "& .MuiAccordionSummary-content": {
                      alignItems: "center",
                      margin: "12px 0",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Advanced settings
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Parameters
                      </Typography>
                    </Box>
                    <Chip
                      label="Optional"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: "1px dashed",
                        borderColor: "divider",
                        bgcolor: "#ffffff",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: "block", fontWeight: 600 }}
                      >
                        Model Parameters
                      </Typography>

                      <Grid container spacing={2} alignItems="center">
                        {/* Row 1: Top-K and Top-P */}
                        <Grid item xs={6}>
                          <Typography variant="caption" gutterBottom>
                            Top-K: {topK}
                          </Typography>
                          <Slider
                            size="small"
                            value={topK}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(_, v) => setTopK(v as number)}
                            valueLabelDisplay="auto"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" gutterBottom>
                            Top-P: {topP}
                          </Typography>
                          <Slider
                            size="small"
                            value={topP}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(_, v) => setTopP(v as number)}
                            valueLabelDisplay="auto"
                          />
                        </Grid>

                        {/* Row 2: Temperature and Max Tokens */}
                        <Grid item xs={6}>
                          <Typography variant="caption" gutterBottom>
                            Temperature: {temperature}
                          </Typography>
                          <Slider
                            size="small"
                            value={temperature}
                            min={0}
                            max={2}
                            step={0.1}
                            onChange={(_, v) => setTemperature(v as number)}
                            valueLabelDisplay="auto"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" gutterBottom>
                            Max Tokens: {maxTokens}
                          </Typography>
                          <Slider
                            size="small"
                            value={maxTokens}
                            min={256}
                            max={8192}
                            step={256}
                            onChange={(_, v) => setMaxTokens(v as number)}
                            valueLabelDisplay="auto"
                          />
                        </Grid>

                        {/* Row 3: Thinking Mode */}
                        <Grid item xs={12}>
                          <FormControlLabel
                            sx={{ ml: 0 }}
                            control={
                              <Switch
                                size="small"
                                checked={thinkingMode}
                                onChange={(e) => setThinkingMode(e.target.checked)}
                              />
                            }
                            label={
                              <Typography variant="caption">
                                Enable Thinking (CoT)
                              </Typography>
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
              {/* ------------------------------------- */}

              {/* --- NEW: Model Selector --- */}
              <FormControl fullWidth sx={{ mb: 2, bgcolor: "#ffffff" }}>
                <InputLabel id="llm-model-select-label">Model</InputLabel>
                <Select
                  labelId="llm-model-select-label"
                  value={selectedModel}
                  label="Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {supportedModels && supportedModels.length > 0 ? (
                    supportedModels.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No models available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {/* --------------------------- */}


              <TextField
                label="System Prompt"
                fullWidth
                multiline
                minRows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                sx={{
                  mb: 2,
                  "& textarea": { fontFamily: "monospace", fontSize: 13 },
                  "& .MuiInputBase-root": { bgcolor: "#ffffff" },
                }}
              />

              <TextField
                label="Input Prompt"
                fullWidth
                multiline
                minRows={10}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                sx={{
                  "& textarea": { fontFamily: "monospace", fontSize: 13 },
                  "& .MuiInputBase-root": { bgcolor: "#ffffff" },
                }}
              />
            </Grid>



          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={isActive}
          >
            Generate
          </Button>
          <Button onClick={() => setOpenRunDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>


      {/* ─────────────── Manual Edit Dialog ─────────────── */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEdit}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>✏️ Edit Table, Caption, Footnote & Context</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
          <Grid container spacing={3}>
            {/* Row 1: table body – full width */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#ffffff",
                }}
              >
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Table Body
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Edit the table cells directly. Rows and columns will be converted back to{" "}
                      <code>&lt;table&gt;</code> HTML when you save.
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Tooltip title="Insert a new row after the current cell row">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddRow}
                      >
                        Row
                      </Button>
                    </Tooltip>
                    <Tooltip title="Insert a new column after the current cell column">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddColumn}
                      >
                        Column
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete the row of the current cell">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleDeleteRowAtCursor}
                        disabled={editRows.length === 0}
                      >
                        Delete Row
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete the column of the current cell">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleDeleteColumnAtCursor}
                        disabled={columnCount === 0}
                      >
                        Delete Column
                      </Button>
                    </Tooltip>
                    <Tooltip title="Reset to the original table extracted from the PDF">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleResetTableGrid}
                      >
                        Reset
                      </Button>
                    </Tooltip>
                  </Box>


                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: 420,
                    overflow: "auto",
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Table size="small" stickyHeader>
                    {columnCount > 0 && (
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              width: 56,
                              fontWeight: 700,
                              bgcolor: "grey.100",
                              textAlign: "center",
                            }}
                          >
                            #
                          </TableCell>
                          {Array.from({ length: columnCount }).map((_, colIdx) => (
                            <TableCell
                              key={`header-${colIdx}`}
                              sx={{ bgcolor: "grey.100" }}
                            />
                          ))}
                        </TableRow>
                      </TableHead>
                    )}

                    <TableBody>
                      {editRows.map((row, rowIdx) => (
                        <TableRow
                          key={`row-${rowIdx}`}
                          sx={{
                            bgcolor: rowIdx % 2 === 1 ? "grey.50" : "inherit",
                          }}
                        >
                          {/* Row index */}
                          <TableCell
                            sx={{
                              fontSize: 12,
                              textAlign: "center",
                              color: "text.secondary",
                              width: 56,
                            }}
                          >
                            {rowIdx + 1}
                          </TableCell>

                          {Array.from({ length: columnCount || 1 }).map((_, colIdx) => (
                            <TableCell key={`cell-${rowIdx}-${colIdx}`}>
                              <TextField
                                fullWidth
                                variant="standard"
                                placeholder={`R${rowIdx + 1}C${colIdx + 1}`}
                                value={row[colIdx] ?? ""}
                                onFocus={() =>
                                  setActiveCell({ row: rowIdx, col: colIdx })
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setEditRows((prev) =>
                                    prev.map((r, rIdx) => {
                                      if (rIdx !== rowIdx) return r;
                                      const copy = [...r];
                                      copy[colIdx] = v;
                                      return copy;
                                    })
                                  );
                                }}
                                InputProps={{
                                  sx: { fontSize: 13, py: 0.25 },
                                }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                      {editRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={Math.max(columnCount + 1, 2)}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 2, textAlign: "center" }}
                            >
                              No rows yet. Click <strong>Row</strong> to start
                              editing the table.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tip: keep one fact per row (e.g., one polymer–property–value
                    triple) to make NER/RE easier.
                  </Typography>
                </Box>


                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tip: use headers for property names (e.g., Tg, Mw) and keep
                    one fact per row to make NER/RE easier.
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Row 2: caption + footnote vs surrounding text */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#ffffff",
                  height: "100%",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  Caption & Footnote
                </Typography>

                <TextField
                  label="Caption"
                  fullWidth
                  multiline
                  minRows={2}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Footnote"
                  fullWidth
                  multiline
                  minRows={3}
                  value={editFootnote}
                  onChange={(e) => setEditFootnote(e.target.value)}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#ffffff",
                  height: "100%",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  Surrounding Text
                </Typography>

                <TextField
                  label="Context (Surrounding Text)"
                  fullWidth
                  multiline
                  minRows={6}
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={handleSaveEdits}>
            Save changes
          </Button>
          <Button onClick={handleCloseEdit}>Cancel</Button>
        </DialogActions>
      </Dialog>


      {/* ─────────────── NEW: Sidebar-style Edit Highlight Dialog (hardcoded content) ─────────────── */}
      <Dialog
        open={openEntityDialog}
        onClose={handleDialogCloseSidebarLike}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle style={{ textAlign: 'center' }}>Edit Highlight</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} aria-label="Entity and Relation tabs">
            <Tab label="Entity" />
            <Tab label="Relation" />
          </Tabs>

          {/* Entity Tab (hardcoded; using same components) */}
          <Box role="tabpanel" hidden={tabValue !== 0} sx={{ mt: 2 }}>
            {editableEntities.map((ent, i) => (
              <Box
                key={`editable-entity-${ent.id}-${i}`}
                sx={{
                  mb: 3,
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  boxShadow: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{`Entity #${i + 1} (${ent.id})`}</Typography>
                  <IconButton
                    aria-label={`Delete entity ${i + 1}`}
                    onClick={() => removeEditableEntityAt(i)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                <FormControl fullWidth margin="normal">
                  <InputLabel id={`entity-type-label-${i}`}>Entity Type</InputLabel>
                  <Select
                    labelId={`entity-type-label-${i}`}
                    label="Entity Type"
                    value={ent.type}
                    onChange={(e) => handleEntityTypeChangeAt(i, String(e.target.value))}
                    fullWidth
                  >
                    {entityTypes.map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <EditedEntityComponent
                  text={baseEntityText}
                  defaultStart={ent.start}
                  defaultEnd={ent.end}
                  onTextChange={() => {}}
                  onSelectionChange={(start: number, end: number) => handleEntitySelectionChangeAt(i, start, end)}
                  entityType={ent.type}
                />
              </Box>
            ))}

            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addEditableEntity}>
                Add Entity
              </Button>
            </Box>
          </Box>

          {/* Relation Tab (uses SplitButton for Subject/Object) */}
          <Box role="tabpanel" hidden={tabValue !== 1} sx={{ mt: 2 }}>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="relations table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Relation</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Object</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                {editableRelations.map((r, i) => {
                  const subj = entById(r.subjId);
                  const obj  = entById(r.objId);

                  const subjText = subj ? baseEntityText.slice(subj.start, subj.end) : "";
                  const objText  = obj  ? baseEntityText.slice(obj.start,  obj.end)  : "";

                  return (
                    <TableRow key={`${r.id}-${i}`}>
                      {/* Subject — read-only SplitButton */}
                      <TableCell>
                        <SplitButton
                          filledText={subj?.type ?? "—"}
                          outlinedText={clip(subjText)}
                          entityType={subj?.type ?? ""}
                        />
                      </TableCell>

                      {/* Relation type — still editable */}
                      <TableCell sx={{ minWidth: 160 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`rel-type-${i}`}>Relation</InputLabel>
                          <Select
                            labelId={`rel-type-${i}`}
                            label="Relation"
                            value={r.type}
                            onChange={(e) =>
                              updateRelationField(i, "type", String(e.target.value))
                            }
                          >
                            {relationTypes.map(rt => (
                              <MenuItem key={rt} value={rt}>{rt}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>

                      {/* Object — read-only SplitButton */}
                      <TableCell>
                        <SplitButton
                          filledText={obj?.type ?? "—"}
                          outlinedText={clip(objText)}
                          entityType={obj?.type ?? ""}
                        />
                      </TableCell>

                      <TableCell>
                        <IconButton
                          aria-label="delete relation"
                          onClick={() => removeEditableRelationAt(i)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* NEW: Add-relation row with editable selects */}
                <TableRow>
                  {/* Source entity select */}
                  <TableCell sx={{ minWidth: 200 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="new-rel-subj">Source Entity</InputLabel>
                      <Select
                        labelId="new-rel-subj"
                        label="Source Entity"
                        value={newRelation.subjId}
                        onChange={(e) =>
                          setNewRelation(prev => ({
                            ...prev,
                            subjId: String(e.target.value),
                          }))
                        }
                      >
                        {editableEntities.map(ent => (
                          <MenuItem key={ent.id} value={ent.id}>
                            {ent.type}: {clip(ent.text)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  {/* Relation type select */}
                  <TableCell sx={{ minWidth: 160 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="new-rel-type">Relation</InputLabel>
                      <Select
                        labelId="new-rel-type"
                        label="Relation"
                        value={newRelation.type}
                        onChange={(e) =>
                          setNewRelation(prev => ({
                            ...prev,
                            type: String(e.target.value),
                          }))
                        }
                      >
                        {relationTypes.map(rt => (
                          <MenuItem key={rt} value={rt}>{rt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  {/* Target entity select */}
                  <TableCell sx={{ minWidth: 200 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="new-rel-obj">Target Entity</InputLabel>
                      <Select
                        labelId="new-rel-obj"
                        label="Target Entity"
                        value={newRelation.objId}
                        onChange={(e) =>
                          setNewRelation(prev => ({
                            ...prev,
                            objId: String(e.target.value),
                          }))
                        }
                      >
                        {editableEntities.map(ent => (
                          <MenuItem key={ent.id} value={ent.id}>
                            {ent.type}: {clip(ent.text)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addEditableRelation}
                    >
                      Add Relation
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>




              </Table>
            </TableContainer>
          </Box>



        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <div />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleDialogCloseSidebarLike} variant="outlined">Cancel</Button>
            <Button onClick={handleSaveEntitiesAndRelations} variant="contained">Save</Button>
          </Box>
        </DialogActions>
      </Dialog>


    </Box>
  </LoadingOverlay>
  );
};

export default TableCommentForm;
