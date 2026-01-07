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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,          // ⬅️ add this
  Stack,         // ⬅️ and this//
  Select,
  MenuItem,
  InputLabel,
  Slider, // ⬅️ Add Slider
  Switch  // ⬅️ Add Switch
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

    // direct concat item.entities to highlights as well
    if (item.entities && Array.isArray(item.entities))
    {
      highlights.push(...(item.entities || []));
    }


    //     // direct concat item.entities to highlights as well
    // if (Array.isArray(item.entities)) {
    //   const entityHighlights: Highlight[] = item.entities.map((ent, eidx) => ({
    //     id: `llm_${idx}_ent_${eidx}`,
    //     comment: ent.label || ent.type || "ENTITY_LLM",
    //     content: {
    //       text: ent.text || ent.value || "Entity",
    //     },
    //     position: {
    //       boundingRect: ent.position?.boundingRect || ent.boundingRect || boundingRect,
    //       rects: ent.position?.rects || ent.rects || rects,
    //     },
    //     para_id: ent.para_id ?? item.para_id ?? 0,
    //     visible: true,

    //     entity_type: ent.type || ent.label,
    //     source: "llm",
    //   }));

    //   highlights.push(...entityHighlights); // ✅ SAFE CONCAT
    // }

  });

  // 

  return highlights;
};

type LLMPresetId = "default" | "natural-text" | "entities-detail" | "json-schema-reference";

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
    shortLabel: "Rewrite Text",
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
- If an entity does not exist, do not create it.
- Output only valid JSON.

JSON schema:
{
  "entities": [
    {
      "type": "<ENTITY_TYPE>",
      "text": "<EXACT_SPAN>"
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

  "json-schema-reference": {
    id: "json-schema-reference",
    shortLabel: "JSON Schema Reference",
    description:
      "Reference schema for structured JSON output from LLM.",
    systemPrompt: `Extract all entities and relations from the text.
        
Entity Extraction Rules:
1. Extract entities strictly in the order they appear.
2. Entity types must be one of: "POLYMER", "PROP_NAME", "PROP_VALUE", "CONDITION", "CHAR_METHOD".
3. The "text" field must be an exact copy of the string in the source.
4. Include the character start and end indices for each entity.
5. If an entity appears multiple times, list it multiple times (create a new ID for each).
6. Assign a unique ID (T1, T2, etc.) to each entity.

Relation Extraction Rules:
1. After extracting entities, identify relationships between them.
2. Relation types must be one of: "has_property", "has_value".
    - "has_property": Links a POLYMER to a PROP_NAME (e.g., polymer has a property).
    - "has_value": Links a PROP_NAME to a PROP_VALUE (e.g., property has a value).
3. Assign a unique ID (R1, R2, etc.) to each relation.
4. arg1_id is the source entity ID, arg2_id is the target entity ID.
5. Only create relations where there is a clear semantic connection in the text.

Output format:
{
    "entities": [...],
    "relations": [...]
}
    `,
    inputPrompt: `Now extract all entities and relations in the text below. Make sure each entity has an id, type, text, start and end. For relations, identify the relationship between entities and specify the type, arg1_id (source entity), and arg2_id (target entity):`
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
  const { bratOutput, documentId, updateId, tableOutput, LLLOutput, setTableOutput, setBratOutput, setDocumentId, setUpdateId, setFileName, setLLLOutput, supportedModels } = globalContext;
  const navigate = useNavigate();
  const navigateTo = useNavigate();
  const paraHighlights = convertBratOutputToHighlights(bratOutput);
  // console.log("paraHighlights", paraHighlights);
  
  // ⬇️ Add Local State for Selected Model
  const [selectedLLMModel, setSelectedLLMModel] = useState<string>("");

  const [topK, setTopK] = useState<number>(50);
  const [topP, setTopP] = useState<number>(0.9);
  const [temperature, setTemperature] = useState<number>(0.1); // ⬅️ Add Temperature
  const [maxTokens, setMaxTokens] = useState<number>(4096); // ⬅️ Add Max Tokens
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);


  // ⬇️ Initialize selected model when supportedModels loads
  useEffect(() => {
    if (supportedModels && supportedModels.length > 0 && !selectedLLMModel) {
      setSelectedLLMModel(supportedModels[0]);
    }
  }, [supportedModels]);
  
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
  const [llmSelectedText, setLLMSelectedText] = useState("");
  const [isLLMGenerating, setIsLLMGenerating] = useState(false);
  
  const [llmRunMode, setLLMRunMode] = useState<"pipeline" | "llm-only">("llm-only");

  // NEW: generation type – UI-level mode
  const [llmOutputMode, setLLMOutputMode] = useState<"text" | "json">("text");

  // Text generation prompts
  const [llmTextSystemPrompt, setLLMTextSystemPrompt] = useState("");
  const [llmTextInputPrompt, setLLMTextInputPrompt] = useState("");

  // Structured (JSON) generation prompts
  const [llmJsonSystemPrompt, setLLMJsonSystemPrompt] = useState(
    LLM_PROMPT_PRESETS["entities-detail"].systemPrompt,
  );
  const [llmJsonInputPrompt, setLLMJsonInputPrompt] = useState(
    LLM_PROMPT_PRESETS["json-schema-reference"].inputPrompt,
  );

  // JSON schema reference (editable by user)
  const [llmJsonSchema, setLLMJsonSchema] = useState(
    `{
        "entities": [
            {
                "id": str,
                "type": str,
                "text": str,
                "start": int,
                "end": int
            }
        ],
        "relations": [
            {
                "id": str,
                "type": str,
                "arg1_id": str,
                "arg2_id": str
            }
        ]
    }`,
  );

const [llmTemplateId, setLLMTemplateId] = useState<LLMPresetId>("default");

// For the “default” polymer-properties preset (TEXT mode)
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

      const systemPromptToSend =
        llmOutputMode === "text" ? llmTextSystemPrompt : llmJsonSystemPrompt;
      const inputPromptToSend =
        llmOutputMode === "text" ? llmTextInputPrompt : llmJsonInputPrompt;
      
      // Check if llmOutputMode is "json"
      const payload: any = {
        document_id: documentId,
        update_id: updateId,
        position: selection.position,
        scale_value: pdfScaleValue,
        page_id: pageId,
        text: selectedText,
        system_prompt: systemPromptToSend,
        prompt: inputPromptToSend,
        apply_pipeline: llmRunMode === "pipeline",
        llm_setting: {
          name: selectedLLMModel,
          top_k: topK,
          top_p: topP,
          temp: temperature, // ⬅️ Sent to backend
          max_tokens: maxTokens, // ⬅️ Sent to backend
          thinking_mode: thinkingMode
        }
      };

      if (llmOutputMode === "json") {
        payload.json_schema = llmJsonSchema;
      }

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
        // same as before...
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
        if (data.llm_texts) {
          setLLLOutput(data.llm_texts);
        }
        console.log("LLM-only mode result:", data);
      }

      console.log("LLM /run-with-LLM result:", data);
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

    // Remember defaults for the “Properties” preset (TEXT mode)
    setLLMDefaultSystemPrompt(defaultSystemPrompt);
    setLLMDefaultInputPrompt(defaultInputPrompt);

    // Initialize TEXT mode prompts from ExpandableTipLLM
    setLLMTextSystemPrompt(defaultSystemPrompt);
    setLLMTextInputPrompt(defaultInputPrompt);

    // Keep JSON mode prompts as their own defaults (entities-detail)
    setLLMJsonSystemPrompt(LLM_PROMPT_PRESETS["json-schema-reference"].systemPrompt);
    setLLMJsonInputPrompt(LLM_PROMPT_PRESETS["json-schema-reference"].inputPrompt);

    setLLMTemplateId("default");
    setLLMRunMode("llm-only");   // backend mode
    setLLMOutputMode("text");    // UI: start in text generation
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
            {/* Generation type selector */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Generation type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Choose whether you want free-form text generation or structured JSON output
                that follows an entity schema.
              </Typography>

              <FormControl fullWidth>
                <ToggleButtonGroup
                  value={llmOutputMode}
                  exclusive
                  onChange={(_, value) => {
                    if (!value) return;
                    setLLMOutputMode(value as "text" | "json");
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
                  <ToggleButton value="text">
                    <Box textAlign="left">
                      <Typography variant="body2" fontWeight="bold">
                        📝 Text generation
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Produce natural language text (annotations, explanations, or reformatted
                        content).
                      </Typography>
                    </Box>
                  </ToggleButton>

                  <ToggleButton value="json">
                    <Box textAlign="left">
                      <Typography variant="body2" fontWeight="bold">
                        🧩 Structured generation (JSON format)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ask the LLM to output machine-readable JSON that can be parsed and
                        mapped back to PDF highlights.
                      </Typography>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>

                <FormHelperText sx={{ mt: 1 }}>
                  Use <b>Structured generation</b> when you need entities and offsets in JSON
                  for automatic post-processing.
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
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                ✏️ LLM Prompts{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  (Editable)
                </Typography>
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    pr: 0.5,
                  }}
                >

                  {/* ⬇️ UPDATED: Advanced Settings Accordion (Available in ALL modes) */}
                  <Accordion
                    disableGutters
                    defaultExpanded={false}
                    sx={{
                      mb: 1.5,
                      borderRadius: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === "light" ? "grey.50" : "grey.900",
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
                        py: 1.25,
                        "& .MuiAccordionSummary-content": {
                          alignItems: "center",
                          margin: 0,
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
                            Presets, backend mode & parameters
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

                    <AccordionDetails sx={{ pt: 1.5, pb: 2, px: 2 }}>
                      <Stack spacing={2}>
                        {/* ⬇️ NEW: LLM Parameters */}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px dashed",
                            borderColor: "divider",
                            bgcolor: "background.paper",
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
                                value={maxTokens}
                                min={256}
                                max={8192} // Adjust max range as needed
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

                        {/* Prompt preset card (Only for TEXT mode) */}
                        {llmOutputMode === "text" && (
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              border: "1px dashed",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mb: 0.5, display: "block" }}
                            >
                              Prompt preset (text generation)
                            </Typography>
                            {/* ... toggle buttons for presets ... */}
                            <ToggleButtonGroup
                              value={llmTemplateId}
                              exclusive
                              onChange={(_, value) => {
                                if (!value) return;
                                const presetId = value as LLMPresetId;
                                setLLMTemplateId(presetId);

                                if (presetId === "default") {
                                  setLLMTextSystemPrompt(
                                    llmDefaultSystemPrompt ||
                                      LLM_PROMPT_PRESETS["default"].systemPrompt
                                  );
                                  setLLMTextInputPrompt(
                                    llmDefaultInputPrompt ||
                                      LLM_PROMPT_PRESETS["default"].inputPrompt
                                  );
                                } else {
                                  const preset = LLM_PROMPT_PRESETS[presetId];
                                  setLLMTextSystemPrompt(preset.systemPrompt);
                                  setLLMTextInputPrompt(preset.inputPrompt);
                                }
                              }}
                              sx={{
                                width: "100%",
                                "& .MuiToggleButton-root": {
                                  flex: 1,
                                  textTransform: "none",
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 1.5,
                                  fontSize: 13,
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
                          </Box>
                        )}

                        {/* Backend mode card */}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px dashed",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: "block" }}
                          >
                            LLM backend mode
                          </Typography>
                          {/* ... toggle buttons for run mode ... */}
                          <ToggleButtonGroup
                            value={llmRunMode}
                            exclusive
                            onChange={(_, value) => {
                              if (!value) return;
                              setLLMRunMode(value as "pipeline" | "llm-only");
                            }}
                            sx={{
                              width: "100%",
                              "& .MuiToggleButton-root": {
                                flex: 1,
                                textTransform: "none",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                px: 1.5,
                                py: 1,
                                borderRadius: 1.5,
                                gap: 1,
                                fontSize: 13,
                              },
                            }}
                          >
                            <ToggleButton value="llm-only">
                              <Box textAlign="left">
                                <Typography variant="body2" fontWeight="bold">
                                  ✨ LLM only
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Store output in LLM panel only.
                                </Typography>
                              </Box>
                            </ToggleButton>

                            <ToggleButton value="pipeline">
                              <Box textAlign="left">
                                <Typography variant="body2" fontWeight="bold">
                                  🔗 Pipeline
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Feed output to NER/RE.
                                </Typography>
                              </Box>
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {/* Model Selector */}
                  <FormControl fullWidth sx={{ mb: 2, bgcolor: "background.paper" }}>
                    <InputLabel id="llm-model-select-label">Model</InputLabel>
                    <Select
                      labelId="llm-model-select-label"
                      value={selectedLLMModel}
                      label="Model"
                      onChange={(e) => setSelectedLLMModel(e.target.value)}
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
                  
                  {/* Scrollable prompts area (mode-dependent) */}
                  <Box sx={{ mt: 1.5 }}>
                    {/* ... System Prompt TextField ... */}
                    <TextField
                      label={
                        llmOutputMode === "text"
                          ? "System Prompt (text generation)"
                          : "System Prompt (structured JSON generation)"
                      }
                      fullWidth
                      multiline
                      minRows={4}
                      value={
                        llmOutputMode === "text"
                          ? llmTextSystemPrompt
                          : llmJsonSystemPrompt
                      }
                      onChange={(e) => {
                        if (llmOutputMode === "text") {
                          setLLMTextSystemPrompt(e.target.value);
                        } else {
                          setLLMJsonSystemPrompt(e.target.value);
                        }
                      }}
                      sx={{
                        mb: 2,
                        "& textarea": { fontFamily: "monospace", fontSize: 13 },
                      }}
                    />

                    {/* ... Input Prompt TextField ... */}
                    <TextField
                      label={
                        llmOutputMode === "text"
                          ? "Input Prompt (text generation)"
                          : "Input Prompt (structured JSON generation)"
                      }
                      fullWidth
                      multiline
                      minRows={6}
                      value={
                        llmOutputMode === "text"
                          ? llmTextInputPrompt
                          : llmJsonInputPrompt
                      }
                      onChange={(e) => {
                        if (llmOutputMode === "text") {
                          setLLMTextInputPrompt(e.target.value);
                        } else {
                          setLLMJsonInputPrompt(e.target.value);
                        }
                      }}
                      sx={{
                        "& textarea": { fontFamily: "monospace", fontSize: 13 },
                      }}
                    />
                    <FormHelperText sx={{ mt: 0.5 }}>
                      {llmOutputMode === "text"
                        ? "These prompts control how the model generates natural language responses."
                        : "These prompts should clearly tell the model to output only valid JSON matching your schema."}
                    </FormHelperText>

                    {/* JSON schema editor – only in structured mode */}
                    {llmOutputMode === "json" && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          label="JSON schema (reference for structured output)"
                          fullWidth
                          multiline
                          minRows={6}
                          value={llmJsonSchema}
                          onChange={(e) => setLLMJsonSchema(e.target.value)}
                          sx={{
                            "& textarea": { fontFamily: "monospace", fontSize: 13 },
                          }}
                        />
                        <FormHelperText sx={{ mt: 0.5 }}>
                          This schema is used as a reference for how the JSON should look.
                        </FormHelperText>
                      </Box>
                    )}
                  </Box>
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