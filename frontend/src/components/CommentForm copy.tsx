import React, { useEffect, useState } from "react";
import { CommentedHighlight } from "../types";
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import BratEmbedding from './BratEmbedding';
import Draggable from 'react-draggable';
import DownloadIcon from '@mui/icons-material/Download';
import { GlobalContext } from '../../example/src/GlobalState';
import axiosInstance from '../../example/src/axiosSetup';

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

interface CommentFormProps {
  onSubmit: (input: string) => void;
  highlight: CommentedHighlight;
  brat_item: {
    text: string;
    entities: Array<any>;
    relations: Array<any>;
  };
  toggleEditInProgress: (isEditing: boolean) => void;  
  pdfHighlighterUtils: any;
}

const CommentForm = ({ onSubmit, highlight, brat_item, toggleEditInProgress, pdfHighlighterUtils }: CommentFormProps) => {
  const globalContext = React.useContext(GlobalContext);
  if (!globalContext) {
    throw new Error("GlobalContext is undefined");
  }
  const { documentId, fileName, updateId } = globalContext;

  const [key, setKey] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showAllEntities, setShowAllEntities] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const calculateWidthBasedOnContent = (content: string) => {
    const baseWidth = 300; 
    const maxWidth = Math.min(800, windowWidth - 20); 
    const contentWidth = content.length * 5; 
    return Math.min(baseWidth + contentWidth, maxWidth);
  };

  // Compute the base card width and then increase it when showAllEntities is true.
  const baseCardWidth = calculateWidthBasedOnContent(brat_item.text);
  const cardWidth = showAllEntities 
    ? Math.min(baseCardWidth + 200, Math.min(800, windowWidth - 20))
    : baseCardWidth;

  const svgStyle = {
    '& svg': {
      width: '100%',
      height: '16px',
      border: 'none',
    }
  };

  function extractNumberFromParaId(para_id: string): number | null {
    const match = para_id.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  const handleDownload = async () => {
    let token = localStorage.getItem('accessToken');
    if (!showAllEntities) {
      try {
        const data = {
          document_id: documentId,
          update_id: updateId,
          id: highlight.id
        };
        const response = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/download-entity/`, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.split('.')[0] + `_output_${highlight.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download button clicked');
      } catch (error: any) {
        console.error('Error fetching document:', error);
      }
    } else {
      try {
        const para_id = extractNumberFromParaId(highlight.id.split('_')[0]);
        const data = {
          document_id: documentId,
          update_id: updateId,
          para_id: para_id
        };
        const response = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/download-infor-para/`, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.split('.')[0] + `_output_para${para_id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download button clicked');
      } catch (error: any) {
        console.error('Error fetching document:', error);
      }
    }
  };

  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [brat_item]);

  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    toggleEditInProgress(false);
    if (pdfHighlighterUtils && pdfHighlighterUtils.scrolledToHighlightIdRef) {
      pdfHighlighterUtils.scrolledToHighlightIdRef.current = null;
      pdfHighlighterUtils.renderHighlightLayers();
    }
    const hash = document.location.hash;
    const parts = hash.split('#');
    document.location.hash = parts[0] + "#" + parts[1];
  };

  const toggleEntitiesView = () => {
    setShowAllEntities(prevState => !prevState);
    setKey(prevKey => prevKey + 1);
  };

  const currentEntityId = highlight.id.split('_')[1];

  const filteredBratItem = showAllEntities ? brat_item : (() => {
    if (!brat_item || !brat_item.entities) return brat_item;

    const relatedEntityIds = new Set([currentEntityId]);

    if (brat_item.relations) {
      brat_item.relations.forEach(relation => {
        if (relation && relation[2]) {
          relation[2].forEach(([role, entityId]: [string, string]) => {
            if (entityId === currentEntityId) {
              relatedEntityIds.add(relation[2][0][1]);
              relatedEntityIds.add(relation[2][1][1]);
            }
          });
        }
      });
    }

    const filteredEntities = brat_item.entities.filter(entity => relatedEntityIds.has(entity[0]));
    const filteredRelations = brat_item.relations
      ? brat_item.relations.filter(relation =>
          relatedEntityIds.has(relation[2][0][1]) && relatedEntityIds.has(relation[2][1][1])
        )
      : [];

    return { ...brat_item, entities: filteredEntities, relations: filteredRelations };
  })();

  return (
    <Box>
      <Draggable>
        <div>
          <Card key={key} sx={{ minWidth: 300, width: cardWidth }}>
            {/* Tabs Header */}
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Brat Visualization" />
              <Tab label="Tree Visualization" />
            </Tabs>

            {/* First Tab: Brat Visualization */}
            {tabValue === 0 && (
              <Box>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {highlight.comment}
                  </Typography>
                  <Slider
                    aria-label="Temperature"
                    defaultValue={100}
                    step={0}
                    className={highlight.comment + '_COLOR'}
                  />
                  <Typography variant="body2">
                    {'"' + highlight.content.text + '"'}
                  </Typography>
                  <BratEmbedding docData={filteredBratItem} />
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Button size="small" onClick={toggleEntitiesView}>
                      {showAllEntities ? "Show Only Highlighted Entity" : "Show All Entities"}
                    </Button>
                    <Button size="small" onClick={handleClose}>Close</Button>
                  </Box>
                  <Button
                    sx={svgStyle}
                    size="small"
                    onClick={handleDownload}
                    startIcon={<DownloadIcon />}
                    variant="contained"
                  >
                    Download JSON
                  </Button>
                </CardActions>
              </Box>
            )}

            {/* Second Tab: Tree Visualization (placeholder) */}
            {tabValue === 1 && (
              <Box sx={{ p: 2 }}>
                Fill with tree visualization
              </Box>
            )}
          </Card>
        </div>
      </Draggable>
    </Box>
  );
};

export default CommentForm;
