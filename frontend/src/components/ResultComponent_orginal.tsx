import React, { MouseEvent, useEffect, useRef, useState, useContext } from "react";
import CommentForm from "./CommentForm";
import { useLocation } from 'react-router-dom';
import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import ExpandableTip from "./ExpandableTip";
import HighlightContainer from "./HighlightContainer";
import Sidebar from "./Sidebar";
import ParagraphSidebar from "./ParagraphSidebar";
import SettingSidebar from "./SettingSidebar";
import EventSidebar from "./EventSidebar";
import TableSidebar from "./TableSidebar";
import LLMSidebar from "./LLMSidebar";
import Toolbar from "./Toolbar";
import { GlobalContext } from '../GlobalState';
import LoadingOverlay from 'react-loading-overlay-ts'; // Add this import
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosSetup';
import {
  GhostHighlight,
  Highlight,
  PdfHighlighter,
  PdfHighlighterUtils,
  PdfLoader,
  Tip,
  ViewportHighlight,
  PdfSelection
} from "../react-pdf-highlighter-extended";
import '../style/App.css';
import { CommentedHighlight } from "../types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Tooltip,
  TextField,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from '@mui/lab';
import ExpandableTipLLM from "./ExpandableTipLLM";


const getNextId = (paraId: number, entityId: number) => `para${paraId}_T${entityId}`;

const parseIdFromHash = () => {
  return document.location.hash.split("#").pop()?.slice("#highlight-".length - 1);
};

const resetHash = () => {
  const hash = document.location.hash;
  const parts = hash.split('#');
  document.location.hash = parts[0] + "#" + parts[1];
};

const extractRelationHighlights = (highlights: Array<CommentedHighlight>) => {
  const relationHighlights = highlights
    .filter(highlight => highlight.relations && highlight.relations.length > 0) // Filter highlights with relations
    .map(highlight => ({
      ...highlight,
      relationTypes: highlight.relations.map(relation => relation.type) // Extract relation types
    }));

  return relationHighlights;
};

const extractEventHighlights = (
  highlights: Array<CommentedHighlight>,
) => highlights
      .filter(h => h.trigger && h.trigger !== "none")
      .map(h => ({
        ...h,
        /*  (optional) surface the trigger if you want to display it) */
        triggerType: h.trigger,
      }));


const convertBratOutputToHighlights = (bratOutput: any[]): Highlight[] => {
  // console.log("bratOutput", bratOutput);
  let highlights: Highlight[] = [];
  bratOutput.forEach((para, paraId) => {
    const highlight: Highlight = {
      id:  `para${paraId}`,
      comment: "BLOCK_" + para.type.toUpperCase(), 
      content: {
        text: para.text,
      },      
      position: {
        boundingRect: para.bounding_box[0], 
        rects: para.bounding_box
      },
      para_id: paraId,
      visible: para.visible
    };

    highlights.push(highlight);
  });
  return highlights;
};



const convertBratOutputToTableHighlights = (tableOutput: any[]): Highlight[] => {

  if (!Array.isArray(tableOutput)) return [];

  const highlights: Highlight[] = [];

  tableOutput.forEach((table, tableIdx) => {
    // Defensive: ensure bounding_box is valid
    const rects = Array.isArray(table.bounding_box) ? table.bounding_box : [];

    const highlight: Highlight = {
      id: `${table.table_id}` || `table_${tableIdx}`,
      table_id: table.table_id || `table_${tableIdx}`,
      comment: `BLOCK_TABLE_BODY`,
      content: {
        text:
          table.table_caption?.trim() ||
          table.table_context?.trim() ||
          `Table ${tableIdx + 1}`,
      },
      position: {
        boundingRect: rects.length > 0 ? rects[0] : null,
        rects: rects,
      },
      para_id: tableIdx,
      visible: true,
      page_number: table.page_number || [],
      // attach rich table metadata for later use in sidebar / inspector
      table_name: table.table_name || "",
      table_caption: table.table_caption || "",
      table_body: table.table_body || "",
      table_context: table.context || "",
      text: table.text || [],
      entities: table.entities || [],
      relations: table.relations || [],
      result: table.result || [],
      bounding_box: rects,
    };

    highlights.push(highlight);
  });

  return highlights;
};


const convertLlmOutputToHighlights = (llmOutput: any[]): Highlight[] => {
  if (!Array.isArray(llmOutput)) return [];

  const highlights: Highlight[] = [];

  llmOutput.forEach((item, idx) => {
    const position = item.position || {};
    const rects = Array.isArray(position.rects) ? position.rects : [];
    const boundingRect =
      position.boundingRect || (rects.length > 0 ? rects[0] : null);

    const highlight: Highlight = {
      id: item.id?.toString() || `llm_${idx}`,
      comment: "BLOCK_LLM",
      content: {
        // you can adjust what you want to show as the main label
        text: item.text || item.original_text || "LLM result",
      },
      position: {
        boundingRect,
        rects,
      },
      para_id: item.para_id ?? 0,
      visible: true,

      // Extra metadata so LLMSidebar can show system prompt / prompt / I/O
      llm_input_text: item.text || item.original_text || "",
      llm_system_prompt: item.system_prompt || "",
      llm_input_prompt: item.prompt || "",
      llm_output_text: item.result || item.output || "",
      apply_pipeline: item.apply_pipeline || false,
      relations: item.relations || [],
      entities: item.entities || []
    };

    highlights.push(highlight);
  });

  return highlights;
};

type LLMPresetId = "default" | "natural-text" | "entities-detail";

interface LLMPreset {
  id: LLMPresetId;
  shortLabel: string;
  description: string;
  systemPrompt: string;
  inputPrompt: string;
}

/**
 * Note:
 * - For "polymer-properties" we’ll override systemPrompt/inputPrompt
 *   with the values coming from ExpandableTipLLM when opening the dialog,
 *   so the text here is just a fallback.
 */
const LLM_PROMPT_PRESETS: Record<LLMPresetId, LLMPreset> = {
  "default": {
    id: "default",
    shortLabel: "Default",
    description:
      "Extract polymer property tuples (POLYMER | PROP_NAME | PROP_VALUE | CONDITION | CHAR_METHOD). Default preset for PolyMinder.",
    systemPrompt: `You are an information extraction assistant specialized in polymer science. Your task is to extract ONLY polymer property facts explicitly stated in the text.`,
    inputPrompt: `Extract all polymer property facts from the text.

Output format (one line per fact):
POLYMER | PROP_NAME | PROP_VALUE | CONDITION | CHAR_METHOD

Rules:
- Keep all numbers, units, symbols, percentages, Greek letters, subscript/superscript notations, and formatting EXACTLY as written in the text.
- CONDITION includes experimental conditions (temperature, heating rate, gas atmosphere, ramp rate, solvent, etc.).
- CHAR_METHOD should be the technique used (e.g., DSC, TGA, DMA, GPC, NMR, FTIR).
- If a field does not appear explicitly in the text, write "N/A".
- Output only the lines of extracted facts. Do NOT add explanations, lists, or commentary.`,
  },

  "natural-text": {
    id: "natural-text",
    shortLabel: "Natural Text",
    description:
      "Rewrite and clarify scientific text for better NER/RE extraction.",
    systemPrompt: `You rewrite and clarify scientific text so that NER and RE models can extract entities and relations more reliably.`,
    inputPrompt: `Rewrite the following text to make it clearer and easier for NER/RE extraction.

Requirements:
- Keep the meaning exactly the same.
- Preserve all scientific entities, conditions, and numbers exactly.
- Simplify grammar and sentence structure.
- Do NOT add details that are not explicitly in the text.
- If something is ambiguous, keep it ambiguous; do not guess.

Output only the rewritten text.`,
  },

  "entities-detail": {
    id: "entities-detail",
    shortLabel: "Entities Detail",
    description:
      "Extract detailed entities from text in JSON format.",
    systemPrompt: `You extract entities from text and return them strictly in valid JSON.
Do NOT add or guess information not in the text.
Preserve all wording, numbers, and units exactly as written.`,
    inputPrompt: `Extract all entities from the text and return them in valid JSON.

Rules:
- Use the exact wording from the text.
- Do NOT infer or add information.
- Start and end positions must match the character indices in the ORIGINAL full text.
- If an entity does not exist, do not create it.
- Output only valid JSON.

JSON schema:
{
  "entities": [
    {
      "type": "<ENTITY_TYPE>",
      "text": "<EXACT_SPAN>",
      "start": <START_INDEX>,
      "end": <END_INDEX>
    }
  ]
}

ENTITY_TYPE (use only when appropriate):
- "POLYMER"
- "PROPERTY_NAME"
- "PROPERTY_VALUE"
- "CONDITION"
- "CHAR_METHOD"
- "MATERIAL"
- "PROCESS"
- "OTHER"

Output only the JSON object.
`

  },
};



const ResultComponent = () => {
  const [isActive, setIsActive] = useState(false); // Add this state
  const [relationHighlights, setRelationHighlights] = useState<Array<CommentedHighlight>>([]); // Add this state
  const [eventHighlights, setEventHighlights] = useState<Array<CommentedHighlight>>([]);

  const globalContext = useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }
  const { bratOutput, documentId, updateId, tableOutput, LLLOutput, setTableOutput, setBratOutput, setDocumentId, setUpdateId, setFileName, setLLLOutput } = globalContext;
  const navigate = useNavigate();
  const navigateTo = useNavigate();
  const paraHighlights = convertBratOutputToHighlights(bratOutput);
  // console.log("paraHighlights", paraHighlights);
  
  const tableHighlights = convertBratOutputToTableHighlights(tableOutput || []);

  const llmHighlights = convertLlmOutputToHighlights(LLLOutput || []);

  const [currentPDFPage, setCurrentPDFPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const location = useLocation();
  const initialHighlights = location.state?.highlights || [];
  const initialVisibleHighlights = initialHighlights.filter((highlight: CommentedHighlight) => highlight.visible);
  // console.log("Initial highlights", initialHighlights);
  const MAIN_URL = location.state?.url || "";
  const [url, setUrl] = useState(MAIN_URL);
  const [highlights, setHighlights] = useState<Array<CommentedHighlight>>(
    initialVisibleHighlights ?? [],
  );

  const [isLLMDialogOpen, setIsLLMDialogOpen] = useState(false);
  const [llmDialogSelection, setLLMDialogSelection] = useState<PdfSelection | null>(null);
  const [llmSystemPrompt, setLLMSystemPrompt] = useState("");
  const [llmInputPrompt, setLLMInputPrompt] = useState("");
  const [llmSelectedText, setLLMSelectedText] = useState("");
  const [isLLMGenerating, setIsLLMGenerating] = useState(false);
  const [llmRunMode, setLLMRunMode] = useState<"pipeline" | "llm-only">("llm-only");

  const [llmTemplateId, setLLMTemplateId] = useState<LLMPresetId>("default");

  // For the “default” polymer-properties preset, we want to keep what comes
  // from ExpandableTipLLM rather than hardcoding it here.
  const [llmDefaultSystemPrompt, setLLMDefaultSystemPrompt] = useState("");
  const [llmDefaultInputPrompt, setLLMDefaultInputPrompt] = useState("");

  const setVisibleHighlights = (
    value: React.SetStateAction<Array<CommentedHighlight>>
  ) => {
    setHighlights((prev) => {
      const newHighlights = typeof value === "function" ? value(prev) : value;
      return newHighlights.filter((hl) => hl.visible);
    });
  };
  
  // useEffect(() => {
  //   setRelationHighlights(extractRelationHighlights(highlights));
  // }, [highlights]);

  // Example history events (toy data)
  const [history, setHistory] = useState<{ id: number, name: string; upload_time: string }[]>([]);

  const [filteredHighlights, setFilteredHighlights] = useState<Array<CommentedHighlight>>([]);
  const [filteredRelationHighlights, setFilteredRelationHighlights] = useState<Array<CommentedHighlight>>([]); // Add this state for relation filtering
  const [isFiltered, setIsFiltered] = useState(false);
  const [isRelationFiltered, setIsRelationFiltered] = useState(false); // Add this state for relation filtering
  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
  // Default to 1.0 scale value
  const [pdfScaleValue, setPdfScaleValue] = useState<number>(1.0);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const [hover, setHover] = useState(false); // State for hover

  // New state to store PDF document reference
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  // Refs for PdfHighlighter utilities
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>();

  // State to track the last entity ID used in each paragraph
  const [lastEntityIds, setLastEntityIds] = useState<{ [key: number]: number }>({});

  // New state to track selected mode
  const [selectedMode, setSelectedMode] = useState<
    'Entities' | 'Relations' | 'Events' | 'Paragraphs' | 'Tables' | 'LLM'
  >('Entities');


  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<{ id: number, real_id: number, name: string; upload_time: string } | null>(null);


  // New ref for PDF container
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Set total pages when the pdfDocument changes
  useEffect(() => {
    if (pdfDocument) {
      setTotalPages(pdfDocument.numPages);
    }
  }, [pdfDocument]);

  // Click listeners for context menu
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [contextMenu]);

  // Scroll slightly when selectedMode changes
  useEffect(() => {
    // document.location.hash = "";
    // console.log("Selected mode changed to", selectedMode);
    if (highlighterUtilsRef.current) {
      highlighterUtilsRef.current.scrolledToHighlightIdRef.current = null;
      highlighterUtilsRef.current.renderHighlightLayers();
    }
    if (selectedMode === "Relations"){
      setRelationHighlights(extractRelationHighlights(highlights));
    }

    if (selectedMode === "Events"){
      // setEventHighlights 20% random of the highlights
      const randomHighlights = highlights.filter(() => Math.random() < 0.2);
      setEventHighlights(extractEventHighlights(highlights));
      // setEventHighlights(randomHighlights);
    }

  }, [selectedMode]);

  useEffect(() => {
    setRelationHighlights(extractRelationHighlights(highlights));
    // setEventHighlights(extractEventHighlights(highlights));
  }, [highlights]);

  
  const handleContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    highlight: ViewportHighlight,
  ) => {
    event.preventDefault();

    // Set the context menu with position and actions
    setContextMenu({
      xPos: event.clientX,
      yPos: event.clientY,
      deleteHighlight: () => deleteHighlight(highlight),
      editComment: () => editComment(highlight), 
    });
  };

  const handleRunWithLLM = async () => {
    if (!llmDialogSelection) return;

    setIsLLMGenerating(true);
    setIsActive(true);

    try {
      const token = localStorage.getItem("accessToken");
      const selection = llmDialogSelection;
      const selectedText = selection.content?.text ?? "";

      const pageId =
        (selection.position?.boundingRect as any)?.pageNumber ?? currentPDFPage;

      const payload = {
        document_id: documentId,
        update_id: updateId,
        position: selection.position,
        scale_value: pdfScaleValue,
        page_id: pageId,
        text: selectedText,
        system_prompt: llmSystemPrompt,
        prompt: llmInputPrompt,
        apply_pipeline: llmRunMode === "pipeline", // "pipeline" | "llm-only"
      };

      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/run-with-LLM`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;

      if (llmRunMode === "pipeline") {
        // ✅ Full pipeline: update document, highlights, tables, navigate
        if (data.brat_format_output) {
          setBratOutput(data.brat_format_output);
        }
        if (data.table_output) {
          setTableOutput(data.table_output);
        }
        if (data.document_id) {
          setDocumentId(data.document_id);
        }
        if (data.update_id) {
          setUpdateId(data.update_id);
        }
        if (data.filename) {
          setFileName(data.filename);
        }
        if (data.pdf_format_output) {
          setVisibleHighlights(data.pdf_format_output);
        }
        if (data.llm_texts) {
          setLLLOutput(data.llm_texts);
        }

        navigateTo("/result", {
          state: {
            highlights: data.pdf_format_output,
            url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${data.filename}`,
          },
        });
      } else {
        // ✅ LLM-only: do NOT touch NER/RE results, just store LLM outputs
        if (data.llm_texts) {
          setLLLOutput(data.llm_texts);
        }
        // Optionally: keep existing pdf/NER/RE state as is.
        console.log("LLM-only mode result:", data);
      }

      console.log("LLM /run-with-LLM result:", data);

      // Close dialog after success
      setIsLLMDialogOpen(false);
      setLLMDialogSelection(null);
    } catch (error) {
      console.error("Error running /run-with-LLM:", error);
    } finally {
      setIsLLMGenerating(false);
      setIsActive(false);
    }
  };


  const handleOpenLLMDialog = ({
    selection,
    defaultSystemPrompt,
    defaultInputPrompt,
  }: {
    selection: PdfSelection;
    defaultSystemPrompt: string;
    defaultInputPrompt: string;
  }) => {
    setLLMDialogSelection(selection);
    setLLMSelectedText(selection.content?.text ?? "");

    // Remember defaults for the “Properties” preset
    setLLMDefaultSystemPrompt(defaultSystemPrompt);
    setLLMDefaultInputPrompt(defaultInputPrompt);

    // Start with the default preset
    setLLMTemplateId("default");
    setLLMSystemPrompt(defaultSystemPrompt);
    setLLMInputPrompt(defaultInputPrompt);

    setLLMRunMode("llm-only"); // default execution mode
    setIsLLMDialogOpen(true);
  };

  const handleCloseLLMDialog = () => {
    if (isLLMGenerating) return; // optional guard
    setIsLLMDialogOpen(false);
    setLLMDialogSelection(null);
  };

  const addHighlight = async (highlight: GhostHighlight, comment: string) => {
    const { position: { boundingRect } } = highlight;
    const paraId = findParagraphId(boundingRect);
    // console.log("Saving highlight", highlight);
    // setHighlights([{ ...highlight, comment, relations: [], para_id: paraId, id: getNextId(paraId, entityId) }, ...highlights]);
    // const text = highlight.content.text ?? '';
    // const charPositions = getCharacterPositions(paraId, text);
    setIsActive(true);
    const data = {
        document_id: documentId,
        update_id: updateId,
        para_id: paraId,
        position: highlight.position,
        comment: comment,
        scale_value: pdfScaleValue
    };
    // console.log('data:', data);
    try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_BACKEND_URL}/create-entity`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log('Paragraphs updated successfully:', response.data);
        setBratOutput(response.data.brat_format_output);
        setDocumentId(response.data.document_id); // Store documentId in GlobalState
        setUpdateId(response.data.update_id);
        setVisibleHighlights(response.data.pdf_format_output);
        navigateTo('/result', { 
          state: { 
            highlights: response.data.pdf_format_output, 
            url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`
          }
        });
    } catch (error) {
        console.error('Error updating paragraphs:', error);
    } finally {
        setIsActive(false);
    }
  };

  // const addEntityToBratOutput = (paraId: number, entityId: number, boundingRect: any, comment: string, text: string) => {
  //   const charPositions = getCharacterPositions(paraId, text);
  //   const newEntity = [
  //     `T${entityId}`,
  //     comment,
  //     [
  //       charPositions
  //     ],
  //     text
  //   ];

  //   const updatedBratOutput = [...bratOutput];
  //   updatedBratOutput[paraId].entities.push(newEntity);
  //   setBratOutput(updatedBratOutput);
  // };

  const getCharacterPositions = (paraId: number, text: string) => {
    const paragraphText = bratOutput[paraId].text;
    const start = paragraphText.indexOf(text);
    const end = start + text.length;
    return [start, end];
  };

  const findParagraphId = (boundingRect: any) => {
    // Logic to find the paragraph ID that covers most of the bounding box
    // You need to implement this based on your specific logic
    let paraId = 0;
    // Assuming paragraphs are stored in bratOutput and have bounding boxes
    let maxOverlap = 0;
    bratOutput.forEach((para: any, index: number) => {
      const overlap = calculateOverlap(para.bounding_box, boundingRect);
      console.log(`Overlap with para ${index}: ${overlap}`);
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        paraId = index;
      }
    });
    return paraId;
  };

  const calculateOverlap = (box1: any, box2: any) => {
    const normalizedBox1 = normalizeBoundingBox(box1);
    const normalizedBox2 = normalizeBoundingBox(box2);
    const xOverlap = Math.max(0, Math.min(normalizedBox1.x2, normalizedBox2.x2) - Math.max(normalizedBox1.x1, normalizedBox2.x1));
    const yOverlap = Math.max(0, Math.min(normalizedBox1.y2, normalizedBox2.y2) - Math.max(normalizedBox1.y1, normalizedBox2.y1));
    const overlapArea = xOverlap * yOverlap;

    const box1Area = (normalizedBox1.x2 - normalizedBox1.x1) * (normalizedBox1.y2 - normalizedBox1.y1);
    const box2Area = (normalizedBox2.x2 - normalizedBox2.x1) * (normalizedBox2.y2 - normalizedBox2.y1);

    return overlapArea / Math.min(box1Area, box2Area); // Scale overlap by the smaller box area
  };

  const normalizeBoundingBox = (box: any) => {
    const { width, height } = box;
    return {
      x1: box.x1 / width,
      y1: box.y1 / height,
      x2: box.x2 / width,
      y2: box.y2 / height,
    };
  };

  const getNextEntityId = (paraId: number) => {
    const paragraph = bratOutput[paraId];
    const lastEntityId = paragraph.entities.reduce((maxId: number, entity: any) => {
      const entityId = parseInt(entity[0].substring(1));
      return Math.max(maxId, entityId);
    }, 0);
    const newEntityId = lastEntityId + 1;
    return newEntityId;
  }

  const deleteHighlight = (highlight: ViewportHighlight | Highlight) => {
    console.log("Deleting highlight", highlight);
    setVisibleHighlights(highlights.filter((h) => h.id != highlight.id));
  };

  const editHighlight = (
    idToUpdate: string,
    edit: Partial<CommentedHighlight>,
  ) => {
    console.log(`Editing highlight ${idToUpdate} with `, edit);
    setVisibleHighlights(
      highlights.map((highlight) =>
        highlight.id === idToUpdate ? { ...highlight, ...edit } : highlight,
      ),
    );
  };

  const PDFpageChange = (page: number) => {
    setCurrentPDFPage(page);
  };

  // UPDATED: getHighlightById now supports 'Tables'
  const getHighlightById = (id: string) => {
    if (selectedMode === 'Entities') return highlights.find(h => h.id === id);
    if (selectedMode === 'Relations') return relationHighlights.find(h => h.id === id);
    if (selectedMode === 'Events')   return eventHighlights.find(h => h.id === id);
    if (selectedMode === 'Tables')   return tableHighlights.find(h => h.table_id === id) as any;
    if (selectedMode === 'LLM')        return llmHighlights.find(h => h.id === id) as any;
    return paraHighlights.find(h => h.id === id);
  };
  

  const getViewportHighlightById = (id: string) => {
    let found_highlights = highlights.find((highlight) => highlight.id === id);
    let transformed = found_highlights as unknown as ViewportHighlight;
    return transformed;
  };

  // Open comment tip and update highlight with new user input
  const editComment = (highlight: ViewportHighlight<CommentedHighlight>) => {
    if (!highlighterUtilsRef.current) return;

    const editCommentTip: Tip = {
      position: highlight.position,
      content: (
        <CommentForm
          placeHolder={highlight.comment}
          onSubmit={(input) => {
            editHighlight(highlight.id, { comment: input });
            highlighterUtilsRef.current!.setTip(null);
            highlighterUtilsRef.current!.toggleEditInProgress(false);
          }}
        ></CommentForm>
      ),
    };

    highlighterUtilsRef.current.setTip(editCommentTip);
    highlighterUtilsRef.current.toggleEditInProgress(true);
  };

  // Scroll to highlight based on hash in the URL
  const scrollToHighlightFromHash = () => {
    const id = parseIdFromHash();
    
    // Check if the hash is empty
    if (id) {
      const highlight = getHighlightById(parseIdFromHash());
      // const viewport_highlight = getViewportHighlightById(parseIdFromHash());
      console.log("Highlight to scroll to", highlight);
      if (highlight && highlighterUtilsRef.current) {
        

        highlighterUtilsRef.current.custom_scrollToHighlight(highlight, editHighlight, selectedMode);
        setTimeout(() => {
          const hash = document.location.hash;
          const parts = hash.split('#');
          document.location.hash = parts[0] + "#" + parts[1] + "#highlight-" + highlight.id;
        }, 50);
      }
    }
  };

  // Hash listeners for autoscrolling to highlights
  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash);

    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash);
    };
  }, [scrollToHighlightFromHash]);

  
  // // Filter highlights based on comment value
  // const filterHighlights = (comment: string) => {
  //   const filtered = highlights.filter(highlight => highlight.comment == comment);
  //   setFilteredHighlights(filtered);
  //   setIsFiltered(true);
  // };

  // // Filter highlights based on multiple comments
  // const filterHighlights = (comments: string[]) => {
  //   const filtered = highlights.filter(highlight => comments.includes(highlight.comment));
  //   setFilteredHighlights(filtered);
  //   setIsFiltered(true);
  // };


  const filterHighlights = (selectedEntityRelationMap: { [entityType: string]: string[] }) => {
    const filtered = highlights.filter(highlight => {
      const entityType = highlight.comment;
      const selectedRelationTypes = selectedEntityRelationMap[entityType];
      if (!selectedRelationTypes) return false;
      const relations = highlight.relations || [];
      if (relations.length === 0) {
        return selectedRelationTypes.includes('None');
      }
      const relationMatch = relations.some(relation => selectedRelationTypes.includes(relation.type));
      return relationMatch;
    });
    setFilteredHighlights(filtered);
    setIsFiltered(true);
  };
      

  // const filterRelations = (relationType: string) => {
  //   const filtered = relationHighlights.filter(highlight => 
  //     highlight.relationTypes.includes(relationType)
  //   );
  //   setFilteredRelationHighlights(filtered);
  //   setIsRelationFiltered(true);
  // };

  const filterRelations = (selectedRelationEntityMap: { [relationType: string]: string[] }) => {
    const filtered = relationHighlights.filter(highlight => {
      // Check if any of the highlight's relation types are in selectedRelationEntityMap
      const matchingRelationTypes = highlight.relationTypes.filter(relationType => selectedRelationEntityMap[relationType]);
  
      if (matchingRelationTypes.length === 0) return false;
  
      // Now, for each matching relation type, check if the connected entities include any of the selected entity types
      return matchingRelationTypes.some(relationType => {
        const selectedEntityTypes = selectedRelationEntityMap[relationType];
  
        // Assuming highlight has an array of connected entity types in highlight.connectedEntityTypes
        const entityType = highlight.comment || '';
  
        return selectedEntityTypes.includes(entityType);
      });
    });
  
    setFilteredRelationHighlights(filtered);
    setIsRelationFiltered(true);
  };

  // // Filter realtions based on multiple relationTypes
  // const filterRelations = (relationTypes: string[]) => {
  //   const filtered = relationHighlights.filter(highlight => {
  //     let found = false;
  //     highlight.relationTypes.forEach(relationType => {
  //       if (relationTypes.includes(relationType)) {
  //         found = true;
  //       }
  //     });
  //     return found;
  //   });
  //   setFilteredRelationHighlights(filtered);
  //   setIsRelationFiltered(true);
  // };

  const resetFilter = () => {
    setFilteredHighlights([]);
    setIsFiltered(false);
  };

  const resetRelationFilter = () => {
    setFilteredRelationHighlights([]);
    setIsRelationFiltered(false);
  };

  // Toggle dialog visibility
  const toggleDialog = async () => {
    if (!isDialogOpen) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-update-history/${documentId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setHistory(response.data.updates);
      } catch (error) {
        console.error('Error fetching update history:', error);
      }
    }
    setIsDialogOpen(!isDialogOpen);
  };

  // Function to handle item click and show confirm dialog
  const handleHistoryClick = (event: MouseEvent, historyItem: { id: number, real_id: number, name: string; upload_time: string }) => {
    setSelectedHistory(historyItem);
    setIsConfirmDialogOpen(true);
  };

  // Function to confirm revert
  const handleRevertConfirm = async () => {
    if (selectedHistory) {
      // console.log(`Reverting to history checkpoint: ${selectedHistory.name}`);
      // Add logic to handle revert
        setIsActive(true);
        let token = localStorage.getItem('accessToken');
    
        try {
          const response = await axiosInstance.get(
            `${import.meta.env.VITE_BACKEND_URL}/get-document/${documentId}/${selectedHistory.real_id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          setIsActive(false);
          setBratOutput(response.data.brat_format_output);
          setDocumentId(response.data.document_id);
          setUpdateId(response.data.update_id);
          setFileName(response.data.filename);
          setVisibleHighlights(response.data.pdf_format_output);
        } catch (error: any) {
          console.error('Error fetching document:', error);
          setIsActive(false);
        }
    }
    setIsConfirmDialogOpen(false);
    setIsDialogOpen(false);
  };


  // Set PdfLoader based on the selected model
  let pdfloader;
  let sidebar;
  if (selectedMode === 'Entities') {
    pdfloader = <PdfLoader document={url}>
      {(loadedPdfDocument) => {
        // Set the loaded PDF document state here
        setPdfDocument(loadedPdfDocument);
        return (
            <PdfHighlighter
              enableAreaSelection={(event) => event.altKey}
              pdfDocument={loadedPdfDocument}
              // onScrollAway={resetHash}
              utilsRef={(_pdfHighlighterUtils) => {
                highlighterUtilsRef.current = _pdfHighlighterUtils;
              }}
              pdfScaleValue={pdfScaleValue}
              selectionTip={<ExpandableTip addHighlight={(highlight, comment) => addHighlight(highlight, comment)} />}
              highlights={isFiltered ? filteredHighlights : highlights}
              style={{
                height: "calc(100% - 41px)",
              }}
              onPageChange={(page) => PDFpageChange(page)}
            >
              <HighlightContainer
                editHighlight={editHighlight}
                onContextMenu={handleContextMenu}
              />
            </PdfHighlighter>
        );
      }}
    </PdfLoader>

    sidebar = <Sidebar
        highlights={isFiltered ? filteredHighlights : highlights}
        getHighlightById={getHighlightById}
        setIsActive={setIsActive}
        setHighlights={setVisibleHighlights}
        selectedMode={selectedMode}
        paraHighlights={paraHighlights}
      />

    } else if (selectedMode === 'Relations') {
      pdfloader = (
        <PdfLoader document={url}>
          {(loadedPdfDocument) => {
            setPdfDocument(loadedPdfDocument);
            return (
              <PdfHighlighter
                enableAreaSelection={(event) => event.altKey}
                pdfDocument={loadedPdfDocument}
                utilsRef={(_pdfHighlighterUtils) => {
                  highlighterUtilsRef.current = _pdfHighlighterUtils;
                }}
                pdfScaleValue={pdfScaleValue}
                highlights={isRelationFiltered ? filteredRelationHighlights : relationHighlights}
                style={{ height: "calc(100% - 41px)" }}
                onPageChange={PDFpageChange}
              >
                <HighlightContainer editHighlight={editHighlight} onContextMenu={handleContextMenu} />
              </PdfHighlighter>
            );
          }}
        </PdfLoader>
      );
      sidebar = (
        <Sidebar
        highlights={isRelationFiltered ? filteredRelationHighlights : relationHighlights}
          getHighlightById={getHighlightById}
          setIsActive={setIsActive}
          setHighlights={setVisibleHighlights}
          selectedMode={selectedMode}
          paraHighlights={paraHighlights}
        />
      );
    } else if (selectedMode === 'Events') {
      pdfloader = <PdfLoader document={url}>
      {(loadedPdfDocument) => {
        // Set the loaded PDF document state here
        setPdfDocument(loadedPdfDocument);
        return (
            <PdfHighlighter
              enableAreaSelection={(event) => event.altKey}
              pdfDocument={loadedPdfDocument}
              // onScrollAway={resetHash}
              utilsRef={(_pdfHighlighterUtils) => {
                highlighterUtilsRef.current = _pdfHighlighterUtils;
              }}
              pdfScaleValue={pdfScaleValue}
              selectionTip={<ExpandableTip addHighlight={(highlight, comment) => addHighlight(highlight, comment)} />}
              highlights={eventHighlights}
              style={{
                height: "calc(100% - 41px)",
              }}
              onPageChange={(page) => PDFpageChange(page)}
            >
              <HighlightContainer
                editHighlight={editHighlight}
                onContextMenu={handleContextMenu}
              />
            </PdfHighlighter>
        );
      }}
    </PdfLoader>

    sidebar = <EventSidebar
        highlights={eventHighlights}
        getHighlightById={getHighlightById}
        setIsActive={setIsActive}
        setHighlights={setVisibleHighlights}
        selectedMode={selectedMode}
        paraHighlights={paraHighlights}
      />
    } else if (selectedMode === 'Tables') {           // ➕ NEW MODE
      pdfloader = (
        <PdfLoader document={url}>
          {(loadedPdfDocument) => {
            setPdfDocument(loadedPdfDocument);
            return (
              <PdfHighlighter
                enableAreaSelection={(event) => event.altKey}
                pdfDocument={loadedPdfDocument}
                utilsRef={(_pdfHighlighterUtils) => { highlighterUtilsRef.current = _pdfHighlighterUtils; }}
                pdfScaleValue={pdfScaleValue}
                highlights={tableHighlights}
                style={{ height: "calc(100% - 41px)" }}
                onPageChange={PDFpageChange}
              >
                <HighlightContainer editHighlight={editHighlight} onContextMenu={handleContextMenu}/>
              </PdfHighlighter>
            );
          }}
        </PdfLoader>
      );

      // Reuse TableSidebar to list only table blocks (works as a simple table list)
      sidebar = (
        <TableSidebar
          highlights={tableHighlights as any}
          getHighlightById={getHighlightById}
          setIsActive={setIsActive}
          setHighlights={setHighlights}
        />
      );
    } else if (selectedMode === 'LLM') {
      // For now behave the same as Tables: show tableHighlights and reuse LLMSidebar
      pdfloader = (
        <PdfLoader document={url}>
          {(loadedPdfDocument) => {
            setPdfDocument(loadedPdfDocument);
            return (
              <PdfHighlighter
                enableAreaSelection={(event) => event.altKey}
                pdfDocument={loadedPdfDocument}
                utilsRef={(_pdfHighlighterUtils) => {
                  highlighterUtilsRef.current = _pdfHighlighterUtils;
                }}
                selectionTip={
                  <ExpandableTipLLM
                    addHighlight={addHighlight}
                    setIsActive={setIsActive}
                    onOpenLLMDialog={handleOpenLLMDialog}
                  />
                }

                pdfScaleValue={pdfScaleValue}
                highlights={llmHighlights}
                style={{ height: "calc(100% - 41px)" }}
                onPageChange={PDFpageChange}
              >
                <HighlightContainer
                  editHighlight={editHighlight}
                  onContextMenu={handleContextMenu}
                />
              </PdfHighlighter>
            );
          }}
        </PdfLoader>
      );
    
      sidebar = (
        <LLMSidebar
          highlights={llmHighlights as any}
          getHighlightById={getHighlightById}
          setIsActive={setIsActive}
          setHighlights={setHighlights}
        />
      );    
    } else {
    pdfloader = <PdfLoader document={url}>
      {(loadedPdfDocument) => {
        // Set the loaded PDF document state here
        setPdfDocument(loadedPdfDocument);
        return (
            <PdfHighlighter
              enableAreaSelection={(event) => event.altKey}
              pdfDocument={loadedPdfDocument}
              // onScrollAway={resetHash}
              utilsRef={(_pdfHighlighterUtils) => {
                highlighterUtilsRef.current = _pdfHighlighterUtils;
              }}
              pdfScaleValue={pdfScaleValue}

              highlights={paraHighlights}
              style={{
                height: "calc(100% - 41px)",
              }}
              onPageChange={(page) => PDFpageChange(page)}
            >
              <HighlightContainer
                editHighlight={editHighlight}
                onContextMenu={handleContextMenu}
              />
            </PdfHighlighter>
        );
      }}
    </PdfLoader>

    sidebar = <ParagraphSidebar
        highlights={paraHighlights}
        getHighlightById={getHighlightById}
        setIsActive={setIsActive}
        setHighlights={setHighlights}
      />
  }


  return (
    <LoadingOverlay
      active={isActive}
      spinner
      text="Saving ..."
      styles={{
        overlay: (base) => ({
          ...base,
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
        }),
      }}
    >
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        <div
          style={{
            height: "100vh",
            width: "75vw",
            overflow: "hidden",
            position: "relative",
            flexGrow: 1,
          }}
        >
          <Toolbar setPdfScaleValue={(value) => setPdfScaleValue(value)} currentPage={currentPDFPage} totalPages={totalPages} setIsActive={setIsActive} />
          {pdfloader}
        </div>
        
        {/* Sidebar component */}
        {sidebar}

        <SettingSidebar
          highlights={highlights}
          paraHighlights={paraHighlights}
          relationHighlights={relationHighlights}
          eventHighlights={eventHighlights}
          tableHighlights={tableHighlights as any}
          filterHighlights={filterHighlights}
          filterRelations={filterRelations} // Pass filterRelations function
          resetFilter={resetFilter}
          resetRelationFilter={resetRelationFilter} // Pass resetRelationFilter function
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          setIsActive={setIsActive}
        />
        {contextMenu && <ContextMenu {...contextMenu} />}
        <Tooltip title="Click to view document information" placement="left" arrow>
          <InfoIcon style={{  
              position: "fixed",
              bottom: "10px",
              right: "10px",
              zIndex: 1000,
              cursor: "pointer",
              color: hover ? "blue" : "gray" // Change color on hover
            }}
            onClick={toggleDialog}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          />
        </Tooltip>
        <Dialog 
          open={isDialogOpen} 
          onClose={toggleDialog} 
          maxWidth="xl" 
          PaperProps={{
            style: {
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h5" component="div" fontWeight="bold">
              Document Information
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total Highlights:</strong> {highlights.length}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Model Update Time (NER and RE):</strong> July 15, 2024
              </Typography>
              <Typography variant="body1">
                <strong>PylyMinder Version:</strong> 3.2.0
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" component="div" fontWeight="bold" sx={{ mb: 2 }}>
                History:
              </Typography>
              <Timeline position="alternate">
                {history.map((event, idx) => (
                  <TimelineItem key={idx}>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      {idx < history.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        style={{ cursor: 'pointer', color: 'blue' }}
                        onClick={(e) => handleHistoryClick(e, event)}
                      >
                        {event.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.upload_time}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={toggleDialog} 
              color="primary" 
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          maxWidth="sm"
          PaperProps={{
            style: {
              borderRadius: '8px',
              backgroundColor: '#fff',
            },
          }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Confirm Revert
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to revert to the selected history checkpoint?
              This action will overwrite any updates made since this checkpoint.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsConfirmDialogOpen(false)}
              color="secondary"
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevertConfirm}
              color="primary"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>


        <Dialog
          open={isLLMDialogOpen}
          onClose={handleCloseLLMDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ textAlign: "center" }}>
              🧠 Prepare LLM Extraction
            </Typography>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              // Fix the overall content height so both columns align
              height: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Explanation + mode selector */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Execution mode
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Choose whether the LLM output should update the full extraction pipeline,
                or just be returned as plain text.
              </Typography>

              <FormControl fullWidth>
                <ToggleButtonGroup
                  value={llmRunMode}
                  exclusive
                  onChange={(_, value) => {
                    if (value !== null) {
                      setLLMRunMode(value as "pipeline" | "llm-only");
                    }
                  }}
                  sx={{
                    width: "100%",
                    "& .MuiToggleButton-root": {
                      flex: 1,
                      textTransform: "none",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      px: 2,
                      py: 1.5,
                      borderRadius: 1.5,
                      gap: 1.5,
                    },
                  }}
                >
                  <ToggleButton value="llm-only">
                    <Box textAlign="left">
                      <Typography variant="body2" fontWeight="bold">
                        ✨ LLM only
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Run the LLM and keep the current NER/RE results unchanged.
                        The generated text will appear in the <b>LLM</b> tab only.
                      </Typography>
                    </Box>
                  </ToggleButton>


                  <ToggleButton value="pipeline">
                    <Box textAlign="left">
                      <Typography variant="body2" fontWeight="bold">
                        🔗 Pipeline (LLM → NER &amp; RE)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Use the LLM output as input to the polymer NER and RE models.
                        Highlights and relations in this document will be updated
                        automatically.
                      </Typography>
                    </Box>
                  </ToggleButton>


                </ToggleButtonGroup>

                <FormHelperText sx={{ mt: 1 }}>
                  Use <b>Pipeline</b> when you want automatic new entities/relations, or{" "}
                  <b>LLM only</b> when you just need a suggestion or reformatted text.
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Main dialog content: selected text + prompts */}
            <Grid
              container
              spacing={2}
              sx={{
                flex: 1,
                minHeight: 0, // allow children to shrink inside fixed height
              }}
            >
              {/* LEFT: Selected text preview */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minHeight: 0,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  📄 Selected Text{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    (Read-only)
                  </Typography>
                </Typography>

                {/* Fixed-height scrollable area */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 1,
                    bgcolor: "background.paper",
                    overflowY: "auto",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {llmSelectedText || "(No text selected)"}
                  </Typography>
                </Box>
              </Grid>

              {/* RIGHT: prompts */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minHeight: 0,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  ✏️ LLM Prompts{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    (Editable)
                  </Typography>
                </Typography>

                {/* Everything on the right side shares the same fixed height */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Prompt preset selector (static, small) */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: "block" }}
                    >
                      Prompt preset
                    </Typography>

                    <ToggleButtonGroup
                      value={llmTemplateId}
                      exclusive
                      onChange={(_, value) => {
                        if (!value) return;
                        const presetId = value as LLMPresetId;
                        setLLMTemplateId(presetId);

                        if (presetId === "default") {
                          setLLMSystemPrompt(
                            llmDefaultSystemPrompt ||
                              LLM_PROMPT_PRESETS["default"].systemPrompt,
                          );
                          setLLMInputPrompt(
                            llmDefaultInputPrompt ||
                              LLM_PROMPT_PRESETS["default"].inputPrompt,
                          );
                        } else {
                          const preset = LLM_PROMPT_PRESETS[presetId];
                          setLLMSystemPrompt(preset.systemPrompt);
                          setLLMInputPrompt(preset.inputPrompt);
                        }
                      }}
                      sx={{
                        width: "100%",
                        mb: 0.5,
                        "& .MuiToggleButton-root": {
                          flex: 1,
                          textTransform: "none",
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                        },
                      }}
                    >
                      <ToggleButton value="default">
                        {LLM_PROMPT_PRESETS["default"].shortLabel}
                      </ToggleButton>
                      <ToggleButton value="natural-text">
                        {LLM_PROMPT_PRESETS["natural-text"].shortLabel}
                      </ToggleButton>
                      <ToggleButton value="entities-detail">
                        {LLM_PROMPT_PRESETS["entities-detail"].shortLabel}
                      </ToggleButton>
                    </ToggleButtonGroup>

                    <FormHelperText>
                      {LLM_PROMPT_PRESETS[llmTemplateId].description}
                    </FormHelperText>
                  </Box>

                  {/* Scrollable prompts area */}
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                    }}
                  >
                    <TextField
                      label="System Prompt"
                      fullWidth
                      multiline
                      minRows={4}
                      value={llmSystemPrompt}
                      onChange={(e) => setLLMSystemPrompt(e.target.value)}
                      sx={{
                        mb: 2,
                        mt: 1,
                        "& textarea": { fontFamily: "monospace", fontSize: 13 },
                      }}
                    />

                    <TextField
                      label="Input Prompt"
                      fullWidth
                      multiline
                      minRows={6}
                      value={llmInputPrompt}
                      onChange={(e) => setLLMInputPrompt(e.target.value)}
                      sx={{
                        "& textarea": { fontFamily: "monospace", fontSize: 13 },
                      }}
                    />
                    <FormHelperText sx={{ mt: 0.5 }}>
                      You can freely edit these prompts after selecting a preset.
                    </FormHelperText>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleCloseLLMDialog}
              variant="outlined"
              disabled={isLLMGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRunWithLLM}
              variant="contained"
              disabled={isLLMGenerating || !llmDialogSelection}
            >
              {isLLMGenerating ? "Generating..." : "Run LLM"}
            </Button>
          </DialogActions>
        </Dialog>



        
      </div>
    </LoadingOverlay>
  );
};
  
export default ResultComponent;