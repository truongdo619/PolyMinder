import React, { useEffect, useState } from "react";
import { CommentedHighlight } from "../types";
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Card from '@mui/material/Card';
import BratEmbedding from './BratEmbedding';
import Draggable from 'react-draggable';
import DownloadIcon from '@mui/icons-material/Download';
import { GlobalContext } from '../../matsci/src/GlobalState';


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
  pdfHighlighterUtils: any;  // Add pdfHighlighterUtils as a prop
}

const CommentForm = ({ onSubmit, highlight, brat_item, toggleEditInProgress, pdfHighlighterUtils }: CommentFormProps) => {

  const globalContext = React.useContext(GlobalContext);
  const { fileName } = globalContext;
  
  const [key, setKey] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showAllEntities, setShowAllEntities] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

  const calculateWidthBasedOnContent = (content: string) => {
    const baseWidth = 300; 
    const maxWidth = Math.min(800, windowWidth - 20); 
    const contentWidth = content.length * 5; 

    return Math.min(baseWidth + contentWidth, maxWidth);
  };

  const cardWidth = calculateWidthBasedOnContent(brat_item.text);

  const svgStyle = {
    '& svg': {
      width: '100%',
      height: '16px',
      border: 'none',
    }
  };


  const handleDownload = () => {
    const dataStr = JSON.stringify(brat_item, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    // TODO: change the name to the highlight id
    const exportFileDefaultName = fileName.split('.')[0] + '_' + highlight.id.split('_')[0] + '_output.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
      pdfHighlighterUtils.scrolledToHighlightIdRef.current = null;  // Reset the scrolled highlight
      pdfHighlighterUtils.renderHighlightLayers();
    }
    document.location.hash = "";
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
          relation[2].forEach(([role, entityId]) => {
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
              <Button sx={svgStyle} size="small" onClick={handleDownload} startIcon={<DownloadIcon />} variant="contained">
                  Download JSON
              </Button>
            </CardActions>
          </Card>
        </div>
      </Draggable>
    </Box>
  );
};

export default CommentForm;
