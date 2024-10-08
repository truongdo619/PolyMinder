import React, { MouseEvent, useEffect, useRef, useState, useContext } from "react";
import CommentForm from "./components/CommentForm";
import { useLocation } from 'react-router-dom';
import ContextMenu, { ContextMenuProps } from "./components/ContextMenu";
import ExpandableTip from "./components/ExpandableTip";
import HighlightContainer from "./components/HighlightContainer";
import Sidebar from "./components/Sidebar";
import ParagraphSidebar from "./components/ParagraphSidebar";
import SettingSidebar from "./components/SettingSidebar";
import Toolbar from "./components/Toolbar";
import { GlobalContext } from './GlobalState';
import LoadingOverlay from 'react-loading-overlay-ts'; // Add this import
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosSetup';
import {
  GhostHighlight,
  Highlight,
  PdfHighlighter,
  PdfHighlighterUtils,
  PdfLoader,
  Tip,
  ViewportHighlight
} from "./react-pdf-highlighter-extended";
import './style/App.css';
import { CommentedHighlight } from "./types";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';

const getNextId = (paraId: number, entityId: number) => `para${paraId}_T${entityId}`;

const parseIdFromHash = () => {
  return document.location.hash.slice("#highlight-".length);
};

const resetHash = () => {
  document.location.hash = "";
};


const convertBratOutputToHighlights = (bratOutput: any[]): Highlight[] => {
  let highlights: Highlight[] = [];
  bratOutput.forEach((para, paraId) => {
    const highlight: Highlight = {
      id:  `para${paraId}`,
      comment: "PARAGRAPH", 
      content: {
        text: para.text,
      },      
      position: {
        boundingRect: {
          x1: para.bounding_box.x1,
          y1: para.bounding_box.y1,
          x2: para.bounding_box.x2,
          y2: para.bounding_box.y2,
          width: para.bounding_box.width,
          height: para.bounding_box.height,
          pageNumber: para.bounding_box.pageNumber,
        },
        rects: [
          {
            x1: para.bounding_box.x1,
            y1: para.bounding_box.y1,
            x2: para.bounding_box.x2,
            y2: para.bounding_box.y2,
            width: para.bounding_box.width,
            height: para.bounding_box.height,
            pageNumber: para.bounding_box.pageNumber,
          }
        ]
      },
      para_id: paraId,
    };

    highlights.push(highlight);
  });
  return highlights;
};



const ResultComponent = () => {
  const [isActive, setIsActive] = useState(false); // Add this state
  const globalContext = useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }
  const { bratOutput, documentId, updateId, setBratOutput, setDocumentId, setUpdateId } = globalContext;
  const navigateTo = useNavigate();
  const paraHighlights = convertBratOutputToHighlights(bratOutput);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const location = useLocation();
  const initialHighlights = location.state?.highlights || {};

  // console.log("Initial highlights", initialHighlights);
  const MAIN_URL = location.state?.url || "";
  const [url, setUrl] = useState(MAIN_URL);
  const [highlights, setHighlights] = useState<Array<CommentedHighlight>>(
    initialHighlights ?? [],
  );

  
  // console.log("Highlights", highlights);
  
  
  const [filteredHighlights, setFilteredHighlights] = useState<Array<CommentedHighlight>>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
  const [pdfScaleValue, setPdfScaleValue] = useState<number | undefined>(
    undefined,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const [hover, setHover] = useState(false); // State for hover

  // New state to store PDF document reference
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  // Refs for PdfHighlighter utilities
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>();

  // State to track the last entity ID used in each paragraph
  const [lastEntityIds, setLastEntityIds] = useState<{ [key: number]: number }>({});

  // New state to track selected mode
  const [selectedMode, setSelectedMode] = useState<'Entities' | 'Paragraphs'>('Entities');

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
    document.location.hash = "";
    console.log("Selected mode changed to", selectedMode);
    if (highlighterUtilsRef.current) {
      highlighterUtilsRef.current.scrolledToHighlightIdRef.current = null;
      highlighterUtilsRef.current.renderHighlightLayers();
    }
  }, [selectedMode]);

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

  const addHighlight = async (highlight: GhostHighlight, comment: string) => {
    const { position: { boundingRect } } = highlight;
    const paraId = findParagraphId(boundingRect);
    // console.log("Saving highlight", highlight);
    // setHighlights([{ ...highlight, comment, relations: [], para_id: paraId, id: getNextId(paraId, entityId) }, ...highlights]);
    const text = highlight.content.text ?? '';
    const charPositions = getCharacterPositions(paraId, text);
    setIsActive(true);
    const data = {
        document_id: documentId,
        update_id: updateId,
        para_id: paraId,
        head_pos: charPositions[0],
        tail_pos: charPositions[1],
        comment: comment
    };
    console.log('data:', data);
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
        setHighlights(response.data.pdf_format_output);
        navigateTo('/result', { 
          state: { 
            highlights: response.data.pdf_format_output, 
            url: `${import.meta.env.VITE_BACKEND_URL}/statics/${response.data.filename}`
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
    setHighlights(highlights.filter((h) => h.id != highlight.id));
  };

  const editHighlight = (
    idToUpdate: string,
    edit: Partial<CommentedHighlight>,
  ) => {
    console.log(`Editing highlight ${idToUpdate} with `, edit);
    setHighlights(
      highlights.map((highlight) =>
        highlight.id === idToUpdate ? { ...highlight, ...edit } : highlight,
      ),
    );
  };

  const resetHighlights = () => {
    setHighlights([]);
  };

  const pageChange = (page: number) => {
    console.log("Page changed to", page);
    setCurrentPage(page);
  };

  const getHighlightById = (id: string) => {
    if (selectedMode === 'Entities') {
      return highlights.find((highlight) => highlight.id === id);
    }
    else{
      return paraHighlights.find((highlight) => highlight.id === id);
    }
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
        highlighterUtilsRef.current.custom_scrollToHighlight(highlight, editHighlight);
        setTimeout(() => {
          document.location.hash = `highlight-${highlight.id}`;
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

  
  // Filter highlights based on comment value
  const filterHighlights = (comment: string) => {
    const filtered = highlights.filter(highlight => highlight.comment == comment);
    setFilteredHighlights(filtered);
    setIsFiltered(true);
  };

  // Reset to show all highlights
  const resetFilter = () => {
    setFilteredHighlights([]);
    setIsFiltered(false);
  };

  // Toggle dialog visibility
  const toggleDialog = () => {
    setIsDialogOpen(!isDialogOpen);
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
              onPageChange={(page) => pageChange(page)}
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
        setHighlights={setHighlights}
      />

  // } else if (selectedMode === 'Events') {
    // content = <div>Error! Please try again.</div>;
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
              onPageChange={(page) => pageChange(page)}
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
          <Toolbar setPdfScaleValue={(value) => setPdfScaleValue(value)} currentPage={currentPage} totalPages={totalPages} />
          {pdfloader}
        </div>
        
        {/* Sidebar component */}
        {sidebar}

        <SettingSidebar 
          highlights={highlights}
          paraHighlights={paraHighlights}
          filterHighlights={filterHighlights}
          resetFilter={resetFilter}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
        />
        {contextMenu && <ContextMenu {...contextMenu} />}
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
        <Dialog open={isDialogOpen} onClose={toggleDialog}>
          <DialogTitle>Result Information</DialogTitle>
          <DialogContent>
            <p>Total Highlights: {highlights.length}</p>
            <p>Model Update Time (NER and RE): July 15, 2024</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={toggleDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LoadingOverlay>
  );
};
  
export default ResultComponent;