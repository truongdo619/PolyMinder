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
import { CommentedHighlight } from "./types";
import { GlobalContext } from './GlobalState';
import ListItemIcon from '@mui/material/ListItemIcon';
import DescriptionIcon from '@mui/icons-material/Description';
import ParagraphIcon from '@mui/icons-material/FormatAlignLeft';
import LinkIcon from '@mui/icons-material/Link';
import axiosInstance from './axiosSetup';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  MenuItem,
  InputLabel,
  FormHelperText
} from "@mui/material";


interface SettingSidebarProps {
  highlights: Array<CommentedHighlight>;
  paraHighlights: Array<CommentedHighlight>;
  relationHighlights: Array<CommentedHighlight>; // Add relations highlights
  filterHighlights: (ccomments: string[]) => void;
  filterRelations: (relationTypes: string[]) => void; // Add filterRelations function
  resetFilter: () => void;
  resetRelationFilter: () => void; // Add resetRelationFilter function
  selectedMode: 'Entities' | 'Paragraphs' | 'Relations'; // Add Relations option
  setSelectedMode: (mode: 'Entities' | 'Paragraphs' | 'Relations') => void; // Update setter
  setIsActive: (active: boolean) => void;
}

export default function SettingSidebar({
  highlights,
  paraHighlights,
  relationHighlights,
  filterHighlights,
  filterRelations, // Added filterRelations prop
  resetFilter,
  resetRelationFilter, // Added resetRelationFilter prop
  selectedMode,
  setSelectedMode,
  setIsActive
}: SettingSidebarProps) {

  const globalContext = React.useContext(GlobalContext);

  const { documentId, fileName, updateId } = globalContext;

  // const [selectedIndex, setSelectedIndex] = React.useState(0);

  const [selectedIndexes, setSelectedIndexes] = React.useState<number[]>([0]);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const [downloadOption, setDownloadOption] = React.useState('all');

  const countRelations = (arr: CommentedHighlight[]): number => {
    return arr.reduce((total, highlight) => {
      return total + (highlight.relations ? highlight.relations.length : 0);
    }, 0);
  };

  const [entityType, setEntityType] = React.useState('POLYMER');

  const entityTypes = [
    "POLYMER",
    "POLYMER_FAMILY",
    "INORGANIC",
    "REF_EXP",
    "CONDITION",
    "MATERIAL_AMOUNT",
    "ORGANIC",
    "PROP_NAME",
    "CHAR_METHOD",
    "PROP_VALUE",
    "MONOMER",
    "OTHER_MATERIAL",
    "COMPOSITE",
    "SYN_METHOD"
  ];

  const handleEntityTypeChange = (event: SelectChangeEvent) => {
    setEntityType(event.target.value);
  };


  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDownloadOption((event.target as HTMLInputElement).value);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleDialogSubmit = async () => {
    setIsActive(true);
    
    let token = localStorage.getItem('accessToken');
    // Logic to handle the selected models
    if (downloadOption === 'all') {
      try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_BACKEND_URL}/download-all-entities/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const jsonString = JSON.stringify(response.data, null, 2); // Pretty-print JSON with 2 spaces
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.split('.')[0] + '_output_full.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download button clicked');
      } catch (error: any) {
        console.error('Error fetching document:', error);
      } finally {
        setIsActive(false);
      }
    } else if (downloadOption === 'confirmed') {
      try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_BACKEND_URL}/download-editted-entities/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const jsonString = JSON.stringify(response.data, null, 2); // Pretty-print JSON with 2 spaces
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.split('.')[0] + '_output_confirmed.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download button clicked');
      } catch (error: any) {
        console.error('Error fetching document:', error);
      } finally {
        setIsActive(false);
      }
    }
    else if (downloadOption === 'entity_type') {
      try {
          const data = {
            document_id: documentId,
            update_id: updateId,
            type: entityType
        };
        const response = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/download-entity-type/`, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const jsonString = JSON.stringify(response.data, null, 2); // Pretty-print JSON with 2 spaces
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.split('.')[0] + `_output_${entityType}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download button clicked');
      } catch (error: any) {
        console.error('Error fetching document:', error);
      } finally {
        setIsActive(false);
      }
    }
    setIsDialogOpen(false);
  };


  function countOccurrences(arr: CommentedHighlight[]): Record<string, number> {
    return arr.reduce((acc: Record<string, number>, obj: CommentedHighlight) => {
      const comment = obj.comment;
      acc[comment] = (acc[comment] || 0) + 1;
      return acc;
    }, {});
  }

  // Function to count occurrences of relation types
  function countRelationTypes(arr: CommentedHighlight[]): Record<string, number> {
    return arr.reduce((acc: Record<string, number>, obj: CommentedHighlight) => {
      if (obj.relationTypes) {
        obj.relationTypes.forEach((relationType) => {
          acc[relationType] = (acc[relationType] || 0) + 1;
        });
      }
      return acc;
    }, {});
  }

  // Count relation types and sort by count
  const relationTypeOccurrences = countRelationTypes(relationHighlights);
  const sortedRelationOccurrences = Object.keys(relationTypeOccurrences)
    .sort((a, b) => relationTypeOccurrences[b] - relationTypeOccurrences[a])
    .reduce((acc, key) => {
      acc[key] = relationTypeOccurrences[key];
      return acc;
    }, {} as Record<string, number>);



    const entity_occurrences = countOccurrences(highlights);
    // Sort by count
    const sorted_occurrences = Object.keys(entity_occurrences).sort((a, b) => entity_occurrences[b] - entity_occurrences[a]).reduce((acc, key) => {
      acc[key] = entity_occurrences[key];
      return acc;
    }, {});

    
    // const handleListItemClick = (
    //   event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    //   index: number,
    //   label?: string
    // ) => {
    //   setSelectedIndex(index);
    //   if (selectedMode === 'Entities') {
    //     if (index === 0) {
    //       resetFilter();
    //     } else if (label) {
    //       filterHighlights(label);
    //     }
    //   } else if (selectedMode === 'Relations') {
    //     if (index === 0) {
    //       resetRelationFilter(); // Reset relation filter
    //     } else if (label) {
    //       filterRelations(label); // Filter relation highlights
    //     }
    //   }
    // };

    const handleListItemClick = (
      event: React.MouseEvent<HTMLDivElement, MouseEvent>,
      index: number,
      label?: string
    ) => {
      if (index === 0) {
        // Reset selection if "All" is clicked
        setSelectedIndexes([0]);
        selectedMode === 'Relations' ? resetRelationFilter() : resetFilter();
      } else {
        // Toggle selection of the current index and exclude "All" if selected
        setSelectedIndexes((prevSelectedIndexes) => {
          const isSelected = prevSelectedIndexes.includes(index);
          const newSelectedIndexes = isSelected
            ? prevSelectedIndexes.filter((i) => i !== index || i === 0)
            : [...prevSelectedIndexes.filter((i) => i !== 0), index]; // Exclude 0 when adding other indexes
    
          // Get all selected labels based on newSelectedIndexes
          const selectedLabels = newSelectedIndexes
            .filter(i => i !== 0) // Exclude "All" index
            .map(i => (selectedMode === 'Relations' ? Object.keys(sortedRelationOccurrences)[i - 1] : Object.keys(sorted_occurrences)[i - 1]));
    
          // Apply filters based on selected mode and labels
          if (selectedMode === 'Relations') {
            filterRelations(selectedLabels);
          } else {
            filterHighlights(selectedLabels);
          }
          return newSelectedIndexes;
        });
      }
    };
    
    

    const handleDownload = () => {
      setIsDialogOpen(true);
    };

    const handleButtonClick = (mode: 'Entities' | 'Paragraphs' | 'Relations') => {
      setSelectedIndexes([0]);
      setSelectedMode(mode);
    };

    let filterSettings;
    if (selectedMode === 'Entities') {
      filterSettings = <List component="nav" aria-label="main mailbox folders" style={{ marginTop: "1rem", paddingTop: "0" }}>
          <ListItemButton
          selected={selectedIndexes.includes(0)}
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
            selected={selectedIndexes.includes(index+1)}
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
  else if (selectedMode === 'Relations') {
      const totalRelations = countRelations(relationHighlights); 
      filterSettings = <List component="nav" aria-label="main mailbox folders" style={{ marginTop: "1rem", paddingTop: "0" }}>
      <ListItemButton
        selected={selectedIndexes.includes(0)}
        onClick={(event) => {handleListItemClick(event, 0)}}
      >
        <ListItemText primary="All Relations"
          secondary={
            <React.Fragment>
              <Typography
                sx={{ display: 'inline' }}
                component="span"
                variant="body2"
                color="text.primary"
              >
                {totalRelations}
              </Typography>
              {" items"}
            </React.Fragment>
          }
        />
      </ListItemButton>

      {Object.entries(sortedRelationOccurrences).map(([relationType, count], index) => (
          <ListItemButton
            key={relationType}
            selected={selectedIndexes.includes(index+1)}
            onClick={(event) => handleListItemClick(event, index + 1, relationType)}
          >
            <ListItemText
              primary={relationType}
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
                  {" relations"}
                <Slider
                    aria-label="Temperature"
                    defaultValue={100}
                    step={0}
                    className={relationType + '_COLOR'}
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
        selected={selectedIndexes.includes(0)}
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

        <ListItemButton selected={selectedMode === "Relations"} onClick={() => handleButtonClick("Relations")}>
          <ListItemText primary="Relations" />
          <ListItemIcon sx={{ position: 'absolute', right: 0, minWidth: "30px" }}>
            <LinkIcon />
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

      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Download Options</DialogTitle>
        <DialogContent>
          <FormControl>
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              value={downloadOption}
              onChange={handleChange}
            >
              <FormControlLabel value="all" control={<Radio />} label="All Data" />
              <FormControlLabel value="confirmed" control={<Radio />} label="Only Confirmed Data" />
              <FormControlLabel value="entity_type" control={<Radio />} label="Based-on Entity Type" />
            </RadioGroup>
          </FormControl>
          {downloadOption === 'entity_type' && (
            <Box display="flex" justifyContent="center" alignItems="center">
              <FormControl sx={{ m: 1, minWidth: 200 }}>
                <InputLabel id="demo-simple-select-helper-label">Type</InputLabel>
                <Select
                  labelId="demo-simple-select-helper-label"
                  id="demo-simple-select-helper"
                  value={entityType}
                  label="Age"
                  onChange={handleEntityTypeChange}
                >
                  {entityTypes.map((type, index) => (
                    <MenuItem key={index} value={type}>{type}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select Entity Type to Download</FormHelperText>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSubmit} color="primary" variant="contained">
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
