import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Chip, 
  Stack, 
  IconButton, 
  Tooltip,
  Divider,
  Slider,
  Popover,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Link
} from '@mui/material';
import { 
  RestartAlt as ResetIcon, 
  FilterAlt as FilterIcon,
  Info as InfoIcon,
  Tune as TuneIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  HelpOutline as HelpIcon,
  Close as CloseIcon,
  FormatQuote as QuoteIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

// --- Types ---

interface NodeParagraph {
  id: number;
  text: string;
  type?: string;
}

interface GraphNode {
  id: string;
  label: string;
  shape?: string;
  color?: {
    background?: string;
    border?: string;
  };
  font?: {
    size?: number;
    bold?: boolean;
    color?: string;
  };
  hidden?: boolean; 
  x?: number;
  y?: number;
  physics?: boolean;
  paragraphs?: NodeParagraph[]; 
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  arrows?: string;
}

interface SummarizeGraphProps {
  data?: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    options?: any;
  };
  loading: boolean;
  topK: number;
  onTopKChange: (k: number) => void;
}

// Helper to extract category from label "CATEGORY: Content"
const getNodeCategory = (label: string) => {
  if (!label) return 'UNKNOWN';
  const parts = label.split(':');
  if (parts.length > 1) return parts[0].trim();
  return 'OTHER';
};

// --- Sub-component for Expandable Text ---
const ExpandableParagraph = ({ text, limit = 150 }: { text: string; limit?: number }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= limit) {
    return (
      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.5 }}>
        {text}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.5, display: 'inline' }}>
        {expanded ? text : `${text.substring(0, limit)}... `}
      </Typography>
      <Link
        component="button"
        variant="caption"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        sx={{
          ml: 0.5,
          textDecoration: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          verticalAlign: 'baseline',
          color: 'primary.main'
        }}
      >
        {expanded ? "Show less" : "Read more"}
      </Link>
    </Box>
  );
};

export default function SummarizeGraph({ 
  data,
  loading,
  topK,
  onTopKChange
}: SummarizeGraphProps) {
  
  const wrapperRef = useRef<HTMLDivElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null); 
  const networkRef = useRef<Network | null>(null);

  const nodesDataSet = useRef<DataSet<GraphNode> | null>(null);
  const edgesDataSet = useRef<DataSet<GraphEdge> | null>(null);
  const fullGraphData = useRef<{ nodes: GraphNode[], edges: GraphEdge[] }>({ nodes: [], edges: [] });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [sliderValue, setSliderValue] = useState<number>(topK);
  const [categories, setCategories] = useState<Record<string, string>>({}); 
  const [activeFilters, setActiveFilters] = useState<Set<string> | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [graphHelpAnchorEl, setGraphHelpAnchorEl] = useState<HTMLElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    setSliderValue(topK);
  }, [topK]);

  // --- Helpers ---

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);
  const handleGraphHelpOpen = (event: React.MouseEvent<HTMLElement>) => setGraphHelpAnchorEl(event.currentTarget);
  const handleGraphHelpClose = () => setGraphHelpAnchorEl(null);

  const extractCategories = (nodes: GraphNode[]) => {
    const catMap: Record<string, string> = {};
    nodes.forEach(node => {
      const cat = getNodeCategory(node.label);
      if (!catMap[cat] && node.color?.background) {
        catMap[cat] = node.color.background;
      }
    });
    setCategories(catMap);
    setActiveFilters(new Set(Object.keys(catMap)));
  };

  const handleFitGraph = () => {
    networkRef.current?.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
  };

  const togglePhysics = () => {
    if (!networkRef.current) return;
    const nextState = !physicsEnabled;
    setPhysicsEnabled(nextState);
    networkRef.current.setOptions({ physics: { enabled: nextState } });
  };

  const handleToggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
        wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
        document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
      const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFilter = (category: string) => {
    const currentSet = activeFilters || new Set(Object.keys(categories));
    const newFilters = new Set(currentSet);
    if (newFilters.has(category)) newFilters.delete(category);
    else newFilters.add(category);
    setActiveFilters(newFilters);
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => setSliderValue(newValue as number);
  const handleSliderCommit = (event: Event | React.SyntheticEvent, newValue: number | number[]) => onTopKChange(newValue as number);

  // Close the side panel
  const handleClosePanel = () => {
    setSelectedNode(null);
    networkRef.current?.unselectAll();
  };

  /**
   * Initialize Network
   */
  useEffect(() => {
    if (!containerRef.current) return;

    nodesDataSet.current = new DataSet<GraphNode>([]);
    edgesDataSet.current = new DataSet<GraphEdge>([]);

    const options = {
      nodes: {
        shape: 'box',
        margin: 10,
        font: { size: 14, color: '#000000', face: 'Roboto' },
        borderWidth: 2,
        shadow: true,
        widthConstraint: { maximum: 160 }
      },
      edges: {
        width: 1,
        color: { color: '#B0BEC5', highlight: '#2196F3' },
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        smooth: { type: 'continuous', roundness: 0 },
        font: { size: 10, align: 'middle', strokeWidth: 3, strokeColor: '#ffffff' }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.005,
          springLength: 200,
          springConstant: 0.08,
          damping: 0.4
        },
        stabilization: { 
            enabled: true,
            iterations: 150 
        }
      },
      layout: { improvedLayout: true },
      interaction: { 
        hover: true, 
        navigationButtons: false,
        zoomView: true,
        dragNodes: true
      },
      autoResize: true,
      height: '100%',
      width: '100%'
    };

    const net = new Network(
      containerRef.current,
      { nodes: nodesDataSet.current, edges: edgesDataSet.current },
      options
    );

    const resizeObserver = new ResizeObserver(() => {
        net.redraw();
        net.fit();
    });
    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    // --- EVENT LISTENERS ---

    // 1. Click Handler (Expand + Select)
    net.on('click', (params) => {
      const clickedNodeId = params.nodes[0];

      // --- HANDLE SELECTION FOR SIDE PANEL ---
      if (clickedNodeId && nodesDataSet.current) {
        // VisJS DataSet stores the full object passed to it, so 'paragraphs' should be present
        const node = nodesDataSet.current.get(clickedNodeId);
        setSelectedNode(node as GraphNode); 
      } else {
        setSelectedNode(null); // Clicked background -> Hide panel
        return; // Stop processing if background click
      }

      // --- EXPANSION LOGIC ---
      const connectedEdges = fullGraphData.current.edges.filter(
        edge => edge.from === clickedNodeId || edge.to === clickedNodeId
      );

      const newNodes: GraphNode[] = [];
      const newEdges: GraphEdge[] = [];
      let hasChanges = false;

      connectedEdges.forEach(edge => {
        const neighborId = edge.from === clickedNodeId ? edge.to : edge.from;
        if (!nodesDataSet.current!.get(neighborId)) {
          const neighborNode = fullGraphData.current.nodes.find(n => n.id === neighborId);
          if (neighborNode) {
            newNodes.push({ ...neighborNode, hidden: false });
            hasChanges = true;
          }
        }
        const existingEdges = edgesDataSet.current!.get({
          filter: (e: any) => e.from === edge.from && e.to === edge.to
        });
        if (existingEdges.length === 0) {
          newEdges.push(edge);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        nodesDataSet.current.add(newNodes);
        edgesDataSet.current.add(newEdges);
        net.setOptions({ physics: { enabled: true } });
        setPhysicsEnabled(true);
      }
    });

    net.on('dragStart', () => {
      net.setOptions({ physics: { enabled: true } });
      setPhysicsEnabled(true);
    });

    net.on('dragEnd', (params) => {
        if (params.nodes.length > 0 && nodesDataSet.current) {
            const nodeId = params.nodes[0];
            const positions = net.getPositions([nodeId]);
            const pos = positions[nodeId];
            
            nodesDataSet.current.update({
                id: nodeId,
                x: pos.x,
                y: pos.y,
                physics: false 
            });
        }
    });

    net.on('doubleClick', (params) => {
        if (params.nodes.length > 0 && nodesDataSet.current) {
            const nodeId = params.nodes[0];
            nodesDataSet.current.update({
                id: nodeId,
                physics: true // Re-enable physics
            });
            net.setOptions({ physics: { enabled: true } });
        }
    });

    networkRef.current = net;

    return () => {
      resizeObserver.disconnect();
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, []);

  // Filter Watcher
  useEffect(() => {
    if(nodesDataSet.current && activeFilters) {
        const allNodes = nodesDataSet.current.get();
        const updates = allNodes.map(n => ({
            id: n.id,
            hidden: !activeFilters.has(getNodeCategory(n.label))
        }));
        nodesDataSet.current.update(updates);
    }
  }, [activeFilters]);

  // Update Graph Data
  useEffect(() => {
    if (data && nodesDataSet.current && edgesDataSet.current) {
        fullGraphData.current = {
            nodes: data.nodes || [],
            edges: data.edges || []
        };

        extractCategories(data.nodes || []);

        nodesDataSet.current.clear();
        edgesDataSet.current.clear();

        let initialNodes = (data.nodes || []).filter(node => 
            getNodeCategory(node.label) === 'POLYMER'
        );

        if (initialNodes.length === 0) {
            initialNodes = data.nodes || [];
        }

        const initialNodeIds = new Set(initialNodes.map(n => n.id));

        const initialEdges = (data.edges || []).filter(edge => 
            initialNodeIds.has(edge.from) && initialNodeIds.has(edge.to)
        );

        if (initialNodes.length > 0) nodesDataSet.current.add(initialNodes);
        if (initialEdges.length > 0) edgesDataSet.current.add(initialEdges);
        
        setTimeout(() => {
            if (networkRef.current) {
                networkRef.current.redraw();
                networkRef.current.fit({ animation: true });
            }
        }, 150);
    }
  }, [data]);

  return (
    <Box 
      ref={wrapperRef}
      sx={{ 
        height: isFullscreen ? '100vh' : '700px', 
        width: '100%', 
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 1300 : 1, 
        border: isFullscreen ? 'none' : '1px solid #e0e0e0',
        borderRadius: isFullscreen ? 0 : 2,
        backgroundColor: 'background.paper',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* --- HEADER SECTION --- */}
      <Box sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'background.paper', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 11 }}>
        
        {/* Row 1: Controls (Top-K) & Actions */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
           
           {/* Left: Top-K Control */}
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <TuneIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Top-K</Typography>
                <IconButton size="small" onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose} sx={{ ml: 0.5 }}>
                   <InfoIcon fontSize="small" color="disabled" style={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: 220, bgcolor: 'action.hover', p: '2px 12px', borderRadius: 4 }}>
                <Slider
                  size="small"
                  value={sliderValue}
                  min={1}
                  max={50}
                  step={1}
                  onChange={handleSliderChange}
                  onChangeCommitted={handleSliderCommit}
                  sx={{ 
                    color: 'primary.main',
                    height: 6,
                    '& .MuiSlider-thumb': {
                      height: 20, width: 20, backgroundColor: '#fff', border: '2px solid currentColor',
                      '&:focus, &:hover, &.Mui-active': { boxShadow: 'inherit' },
                      '&:before': { display: 'none' },
                    },
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 24, textAlign: 'center', color: 'primary.main' }}>
                   {sliderValue}
                </Typography>
              </Box>

              <Popover
                sx={{ pointerEvents: 'none' }}
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                onClose={handlePopoverClose}
                disableRestoreFocus
              >
                <Typography sx={{ p: 1, fontSize: '0.75rem', maxWidth: 220, color: 'text.secondary' }}>
                  Adjusts the extraction depth. Higher values retrieve more entities but may clutter the view.
                </Typography>
              </Popover>
           </Box>

           {/* Right: Actions */}
           <Stack direction="row" spacing={1}>
              <Tooltip title="What is this graph?">
                 <IconButton onClick={handleGraphHelpOpen} size="small" color={Boolean(graphHelpAnchorEl) ? "primary" : "default"}>
                    <HelpIcon />
                 </IconButton>
              </Tooltip>
              <Tooltip title={physicsEnabled ? "Pause Layout" : "Resume Layout"}>
                 <IconButton onClick={togglePhysics} size="small" sx={{ bgcolor: physicsEnabled ? 'rgba(33, 150, 243, 0.1)' : 'transparent', color: physicsEnabled ? '#2196F3' : 'text.disabled', '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.2)' } }}>
                    {physicsEnabled ? <PauseIcon /> : <PlayIcon />}
                 </IconButton>
              </Tooltip>
              <Tooltip title="Reset Zoom">
                <IconButton onClick={handleFitGraph} size="small"><ResetIcon /></IconButton>
              </Tooltip>
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                 <IconButton onClick={handleToggleFullscreen} size="small" color={isFullscreen ? "primary" : "default"}>
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                 </IconButton>
              </Tooltip>
           </Stack>

           <Popover
              open={Boolean(graphHelpAnchorEl)}
              anchorEl={graphHelpAnchorEl}
              onClose={handleGraphHelpClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
           >
              <Box sx={{ p: 2, maxWidth: 300 }}>
                 <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                    Summary Graph
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                    This is a summary graph that connects all the entities in the document and visualizes their relations.
                 </Typography>
                 <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', color: 'text.disabled' }}>
                    Tip: Drag nodes to rearrange. Double-click to unfreeze a node.
                 </Typography>
              </Box>
           </Popover>
        </Box>

        <Divider />

        {/* Row 2: Filter Bar */}
        <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: 'action.hover', overflowX: 'auto', '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#ddd', borderRadius: '3px' } }}>
           <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: 'text.secondary', minWidth: 'fit-content' }}>
             <FilterIcon fontSize="small" sx={{ mr: 0.5 }} />
             <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Filters</Typography>
           </Box>
           {Object.keys(categories).length === 0 && !loading && (
             <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>No data to filter</Typography>
           )}
           <Stack direction="row" spacing={1} sx={{ minWidth: 'fit-content' }}>
             {Object.entries(categories).map(([cat, color]) => (
               <Chip
                 key={cat}
                 label={cat}
                 size="small"
                 onClick={() => toggleFilter(cat)}
                 sx={{ 
                   height: 24, fontSize: '0.7rem',
                   backgroundColor: activeFilters?.has(cat) ? color : 'action.disabledBackground',
                   color: activeFilters?.has(cat) ? '#fff' : 'text.disabled',
                   fontWeight: activeFilters?.has(cat) ? 700 : 500,
                   border: '1px solid transparent',
                   opacity: activeFilters?.has(cat) ? 1 : 0.6,
                   transition: 'all 0.2s',
                   '&:hover': { opacity: 1, transform: 'translateY(-1px)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
                 }}
               />
             ))}
           </Stack>
        </Box>
      </Box>

      {/* --- CONTENT AREA --- */}
      <Box sx={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        )}
        
        {/* --- SOURCE PARAGRAPHS SIDE PANEL --- */}
        {selectedNode && (
          <Paper 
            elevation={4} 
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 320,
              maxHeight: 'calc(100% - 32px)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            {/* Panel Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', bgcolor: '#f5f5f5' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
                  Selected Node
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {selectedNode.label.split(':')[1] || selectedNode.label}
                </Typography>
                <Chip 
                  label={getNodeCategory(selectedNode.label)} 
                  size="small" 
                  sx={{ mt: 1, height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: selectedNode.color?.background, color: '#fff' }} 
                />
              </Box>
              <IconButton size="small" onClick={handleClosePanel} sx={{ mt: -0.5, mr: -0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Panel Content (Scrollable) */}
            <Box sx={{ overflowY: 'auto', p: 0, flex: 1 }}>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ArticleIcon fontSize="inherit" /> FOUND IN PARAGRAPHS
                </Typography>
              </Box>
              
              <List disablePadding>
                {selectedNode.paragraphs && selectedNode.paragraphs.length > 0 ? (
                  selectedNode.paragraphs.map((para, idx) => (
                    <ListItem key={para.id || idx} alignItems="flex-start" sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                        <QuoteIcon fontSize="small" color="action" sx={{ transform: 'rotate(180deg)' }}/>
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <ExpandableParagraph text={para.text} />
                        } 
                        secondary={
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Paragraph ID: {para.id + 1}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box p={3} textAlign="center">
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No source paragraph available.
                    </Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Paper>
        )}

        {/* Legend */}
        {!loading && Object.keys(categories).length > 0 && !selectedNode && (
          <Paper elevation={3} sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, p: 1.5, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)', maxWidth: 200 }}>
             <Typography variant="overline" sx={{ lineHeight: 1, fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>Legend</Typography>
             <Divider sx={{ my: 0.5 }} />
             <Stack spacing={0.5} sx={{ maxHeight: 200, overflowY: 'auto' }}>
               {Object.entries(categories).map(([cat, color]) => (
                 <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                    <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.7rem', fontWeight: 500 }}>{cat}</Typography>
                 </Box>
               ))}
             </Stack>
          </Paper>
        )}

        <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#f4f6f8' }} />
      </Box>
    </Box>
  );
}