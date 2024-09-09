import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Slider from '@mui/material/Slider';
import ListItemText from '@mui/material/ListItemText';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { CommentedHighlight } from "../types";
import { GlobalContext } from '../GlobalState';
import ListItemIcon from '@mui/material/ListItemIcon';
import DescriptionIcon from '@mui/icons-material/Description';
import ParagraphIcon from '@mui/icons-material/FormatAlignLeft';

interface SettingSidebarProps {
  highlights: Array<CommentedHighlight>;
  paraHighlights: Array<CommentedHighlight>;
  filterHighlights: (highlights: Array<CommentedHighlight>) => void;
  resetFilter: () => void;
  selectedMode: 'Entities' | 'Paragraphs';
  setSelectedMode: (mode: 'Entities' | 'Paragraphs') => void;
}

export default function SettingSidebar({
  highlights,
  paraHighlights,
  filterHighlights,
  resetFilter,
  selectedMode,
  setSelectedMode
}: SettingSidebarProps) {

  const globalContext = React.useContext(GlobalContext);

  const { bratOutput, fileName } = globalContext;

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  function countOccurrences(arr: CommentedHighlight[]): Record<string, number> {
    return arr.reduce((acc: Record<string, number>, obj: CommentedHighlight) => {
      const comment = obj.comment;
      acc[comment] = (acc[comment] || 0) + 1;
      return acc;
    }, {});
  }

    const entity_occurrences = countOccurrences(highlights);
    // Sort by count
    const sorted_occurrences = Object.keys(entity_occurrences).sort((a, b) => entity_occurrences[b] - entity_occurrences[a]).reduce((acc, key) => {
      acc[key] = entity_occurrences[key];
      return acc;
    }, {});

    const handleListItemClick = (
      event: React.MouseEvent<HTMLDivElement, MouseEvent>,
      index: number,
      label?: string
    ) => {
      setSelectedIndex(index);
      if (index === 0) {
        resetFilter();
        return;
      }
      if (label) {
        filterHighlights(label);
      }
    };

    const handleDownload = () => {
      const jsonString = JSON.stringify(bratOutput, null, 2); // Pretty-print JSON with 2 spaces
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.split('.')[0] + '_output.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Download button clicked');
    };

    const handleButtonClick = (mode: 'Entities' | 'Paragraphs') => {
      setSelectedMode(mode);
    };

    let filterSettings;
    if (selectedMode === 'Entities') {
      filterSettings = <List component="nav" aria-label="main mailbox folders" style={{ marginTop: "1rem", paddingTop: "0" }}>
          <ListItemButton
          selected={selectedIndex === 0}
          onClick={(event) => handleListItemClick(event, 0)}
        >
          <ListItemText primary="All Entity Types"
            secondary={
              <React.Fragment>
                <Typography
                  sx={{ display: 'inline' }}
                  component="span"
                  variant="body2"
                  color="text.primary"
                >
                  {highlights.length}
                </Typography>
                {" entities"}
              </React.Fragment>
            }
          />
        </ListItemButton>

        {Object.entries(sorted_occurrences).map(([label, count], index) => (
          <ListItemButton
            key={label}
            selected={selectedIndex === index + 1}
            onClick={(event) => handleListItemClick(event, index + 1, label)}
          >
            <ListItemText
              primary={label}
              secondary={
                <React.Fragment>
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {count}
                  </Typography>
                  {" entities"}
                  <Slider
                    aria-label="Temperature"
                    defaultValue={100}
                    step={0}
                    className={label + '_COLOR'}
                  />
                </React.Fragment>
              }
            />
          </ListItemButton>
        ))}
      </List>
  }
  else{
    filterSettings = <List component="nav" aria-label="main mailbox folders" style={{ marginTop: "1rem", paddingTop: "0" }}>
      <ListItemButton
        selected={selectedIndex === 0}
        onClick={(event) => {handleListItemClick(event, 0)}}
      >
        <ListItemText primary="All Paragraphs"
          secondary={
            <React.Fragment>
              <Typography
                sx={{ display: 'inline' }}
                component="span"
                variant="body2"
                color="text.primary"
              >
                {paraHighlights.length}
              </Typography>
              {" items"}
            </React.Fragment>
          }
        />
      </ListItemButton>
    </List>
  }


  return (
    <Box className='filter_sidebar' sx={{ width: '100%', maxWidth: 180, bgcolor: 'background.paper' }} style={{ margin: "1rem", overflow: "auto" }}>
      <Button variant="outlined" color="primary" fullWidth onClick={handleDownload} style={{ marginBottom: '1rem', fontSize: "small", padding: "5px 6px" }} startIcon={<FileDownloadIcon />}>
        Download Result
      </Button>
      <Divider />

      <List component="nav" aria-label="main mailbox folders" style={{ paddingBottom: "0" }}>
        <ListItemButton
          selected={selectedMode === 'Entities'}
          onClick={() => handleButtonClick('Entities')}
        >
          <ListItemText primary="Entities" />
          <ListItemIcon sx={{ position: 'absolute', right: 0, minWidth: "30px" }}>
            <DescriptionIcon />
          </ListItemIcon>
        </ListItemButton>
        <ListItemButton
          selected={selectedMode === 'Paragraphs'}
          onClick={() => handleButtonClick('Paragraphs')}
        >
          <ListItemText primary="Paragraphs" />
          <ListItemIcon sx={{ position: 'absolute', right: 0, minWidth: "30px" }}>
            <ParagraphIcon />
          </ListItemIcon>
        </ListItemButton>
      </List>

      <Divider />
      {filterSettings}
    </Box>
  );
}
