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
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  MenuItem,
  InputLabel,
  FormHelperText,
  TextField
} from "@mui/material";

  interface SettingSidebarProps {
    highlights: Array<CommentedHighlight>;
    paraHighlights: Array<CommentedHighlight>;
    relationHighlights: Array<CommentedHighlight>; // Add relations highlights
    filterHighlights: (selectedEntityRelationMap: {}) => void;
    filterRelations: (selectedRelationEntityMap: {})=> void; // Add filterRelations function
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

    if (!globalContext) {
      throw new Error("GlobalContext must be used within a GlobalProvider");
    }

    const { documentId, fileName, updateId, setDocumentId, setUpdateId } = globalContext;

    // const [selectedIndex, setSelectedIndex] = React.useState(0);

    const [selectedIndexes, setSelectedIndexes] = React.useState<number[]>([0]);

    const [selectedLabels, setSelectedLabels] = React.useState<string[]>([]);
    
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const [downloadOption, setDownloadOption] = React.useState('all');

    const [isCheckpointDialogOpen, setIsCheckpointDialogOpen] = React.useState(false);
    const [checkpointName, setCheckpointName] = React.useState('');
  
    const handleCheckpointDialogOpen = () => {
      setIsCheckpointDialogOpen(true);
    };
  
    const handleCheckpointDialogClose = () => {
      setIsCheckpointDialogOpen(false);
    };
  
    const handleCheckpointSave = async () => {
      try {
        if (!checkpointName) {
          alert('Please enter a checkpoint name.');
          return;
        }
        const data = {
            document_id: documentId,
            update_id: updateId,
            update_name: checkpointName
        };

        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/save/`, data, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUpdateId(response.data.update_id);
        console.log('Checkpoint saved successfully:', response.data);
      } catch (error) {
        console.error('Error saving checkpoint:', error);
      } finally {
        setIsCheckpointDialogOpen(false);
      }
    };

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

    const relationTypes = [
      "has_property",
      "has_value",
      "has_amount",
      "has_condition",
      "abbreviation_of",
      "refers_to",
      "synthesised_by",
      "characterized_by",
      "None"
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
      else if (downloadOption === 'filter') {
        try {
          
          let filter_entities = [];
          let filter_relations = [];
          // Logic to handle the selected models
          if (selectedMode === 'Entities') {
            if (selectedIndexes.includes(0)) {
              for (let i = 0; i < entityTypes.length; i++) {
                let tmp = [];
                for (let j = 0; j < relationTypes.length; j++) {
                  if (checkedItems[0][i][j]) {
                    tmp.push(relationTypes[j]);
                  }
                }
                filter_entities.push({type: entityTypes[i], sub_type: tmp});
              } 
            }
            else {
              selectedLabels.forEach((label) => {
                let tmp = [];
                for (let j = 0; j < relationTypes.length; j++) {
                  if (checkedItems[0][entityTypes.indexOf(label)][j]) {
                    tmp.push(relationTypes[j]);
                  }
                }
                filter_entities.push({type: label, sub_type: tmp});
              });
            }
          }
          else {
            if (selectedIndexes.includes(0)) {
              for (let i = 0; i < relationTypes.length; i++) {
                let tmp = [];
                for (let j = 0; j < entityTypes.length; j++) {
                  if (checkedItems[1][i][j]) {
                    tmp.push(entityTypes[j]);
                  }
                }
                filter_relations.push({type: relationTypes[i], sub_type: tmp});
              }
            }
            else {
              selectedLabels.forEach((label) => {
                let tmp = [];
                for (let j = 0; j < entityTypes.length; j++) {
                  if (checkedItems[1][relationTypes.indexOf(label)][j]) {
                    tmp.push(entityTypes[j]);
                  }
                }
                filter_relations.push({type: label, sub_type: tmp});
              });
            }

          }
          const data = {
            document_id: documentId,
            update_id: updateId,
            filtering_entity_types: filter_entities,
            filtering_relation_types: filter_relations
          };
          const response = await axiosInstance.post(`${import.meta.env.VITE_BACKEND_URL}/download-filtered-info/`, data, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const jsonString = JSON.stringify(response.data, null, 2); // Pretty-print JSON with 2 spaces
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName.split('.')[0] + `_output_filtered.json`;
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
          setSelectedLabels([]);
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
              const selectedRelationEntityMap: { [relationType: string]: string[] } = {};
        
              checkedItems[1].forEach((subArray, relationIndex) => {
                const relationType = relationTypes[relationIndex];
                const selectedEntities = [];
          
                subArray.forEach((isChecked, entityIndex) => {
                  if (isChecked) {
                    const entityType = entityTypes[entityIndex];
                    selectedEntities.push(entityType);
                  }
                });
          
                if (selectedEntities.length > 0 && selectedLabels.includes(relationType)) {
                  selectedRelationEntityMap[relationType] = selectedEntities;
                }
              });
              
              console.log(selectedRelationEntityMap);
              filterRelations(selectedRelationEntityMap);
            } else {
              const selectedEntityRelationMap: { [entityType: string]: string[] } = {};
      
              checkedItems[0].forEach((subArray, entityIndex) => {
                const entityType = entityTypes[entityIndex];
                const selectedRelations = [];
                
                subArray.forEach((isChecked, relationIndex) => {
                  if (isChecked) {
                    const relationType = relationTypes[relationIndex];
                    selectedRelations.push(relationType);
                  }
                });
          
                if (selectedRelations.length > 0 && selectedLabels.includes(entityType)) {
                  selectedEntityRelationMap[entityType] = selectedRelations;
                }
              });
              filterHighlights(selectedEntityRelationMap);
            }
            setSelectedLabels(selectedLabels);

            return newSelectedIndexes;
          });
        }
      };

      const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState(false);

      const [filterDialogIndex, setFilterDialogIndex] = React.useState<number>(0);

      // const handleFilterIconClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      //   event.stopPropagation();
      //   setIsFilterDialogOpen(true);
      // };
    
      const handleFilterIconClick = (
        event: React.MouseEvent<HTMLButtonElement>,
        label: string,
        mode: 'Entities' | 'Relations'
      ) => {
        event.stopPropagation();
        setIsFilterDialogOpen(true);
        if (mode === 'Entities') {
          setFilterDialogIndex(entityTypes.indexOf(label));
        }
        else {
          setFilterDialogIndex(relationTypes.indexOf(label));
        }
      };

      const handleFilterDialogClose = () => {
        setIsFilterDialogOpen(false);
      };

      const handleFilterApply = () => {
        if (selectedMode === 'Entities') {
          const selectedEntityRelationMap: { [entityType: string]: string[] } = {};
      
          checkedItems[0].forEach((subArray, entityIndex) => {
            const entityType = entityTypes[entityIndex];
            const selectedRelations = [];
            
            subArray.forEach((isChecked, relationIndex) => {
              if (isChecked) {
                const relationType = relationTypes[relationIndex];
                selectedRelations.push(relationType);
              }
            });
      
            if (selectedRelations.length > 0 && selectedLabels.includes(entityType)) {
              selectedEntityRelationMap[entityType] = selectedRelations;
            }
          });
          // Apply the filter based on selected mode and collected labels
          filterHighlights(selectedEntityRelationMap);
        } else {
          const selectedRelationEntityMap: { [relationType: string]: string[] } = {};
      
          checkedItems[1].forEach((subArray, relationIndex) => {
            const relationType = relationTypes[relationIndex];
            const selectedEntities = [];
      
            subArray.forEach((isChecked, entityIndex) => {
              if (isChecked) {
                const entityType = entityTypes[entityIndex];
                selectedEntities.push(entityType);
              }
            });
      
            if (selectedEntities.length > 0 && selectedLabels.includes(relationType)) {
              selectedRelationEntityMap[relationType] = selectedEntities;
            }
          });
      
          filterRelations(selectedRelationEntityMap);
        }
      
        setIsFilterDialogOpen(false);
      };
      

      const handleDownload = () => {
        setIsDialogOpen(true);
      };

      const handleButtonClick = (mode: 'Entities' | 'Paragraphs' | 'Relations') => {
        setSelectedIndexes([0]);
        setSelectedLabels([]);
        mode === 'Relations' ? resetRelationFilter() : resetFilter();
        setSelectedMode(mode);
      };


      const [checkedItems, setCheckedItems] = React.useState<boolean[][][]>([
        Array(entityTypes.length).fill(Array(relationTypes.length).fill(true)), // For Entities mode
        Array(relationTypes.length).fill(Array(entityTypes.length).fill(true)) // For Relations mode
      ]);
      
      const handleCheckboxChange = (typeIndex: number, subIndex: number) => {
        setCheckedItems((prevCheckedItems) => {
          const modeIndex = selectedMode === 'Entities' ? 0 : 1;
      
          // Deep copy of the checked items array for immutability
          const newCheckedItems = prevCheckedItems.map((items, index) => 
            items.map((item, i) => 
              item.map((subItem, j) => (index === modeIndex && i === typeIndex && j === subIndex ? !subItem : subItem))
            )
          );
          
          return newCheckedItems;
        });
      };

      const handleCheckBoxAllChange = (typeIndex: number) => {
        setCheckedItems((prevCheckedItems) => {
          const modeIndex = selectedMode === 'Entities' ? 0 : 1;
      
          // Check if all items are already true
          const allSelected = prevCheckedItems[modeIndex][typeIndex].every((isChecked) => isChecked);
      
          // Set all items to false if all are currently true; otherwise, set all to true
          const newCheckedItems = prevCheckedItems.map((modeItems, modeIdx) =>
            modeIdx === modeIndex
              ? modeItems.map((items, index) =>
                  index === typeIndex
                    ? items.map(() => !allSelected) // Toggle all values
                    : items
                )
              : modeItems
          );
      
          return newCheckedItems;
        });
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
              {/* Add ArrowDropDownIcon when selected */}
              {selectedIndexes.includes(index+1) && (
                            <Tooltip title={"Details filter"}>
                <IconButton 
                  color="primary" 
                  aria-label={"filter"} 
                  onClick={(event) => handleFilterIconClick(event, label, "Entities")}
                  sx={{ position: 'absolute', right: 0, top: "5px" }}
                >
                  <FilterAltIcon />
                </IconButton>
              </Tooltip>
              )}

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

              {/* Add ArrowDropDownIcon when selected */}
              {selectedIndexes.includes(index+1) && (
                            <Tooltip title={"Details filter"}>
                <IconButton 
                  color="primary" 
                  aria-label={"filter"} 
                  onClick={(event) => handleFilterIconClick(event, relationType, "Relations")}
                  sx={{ position: 'absolute', right: 0, top: "5px" }}
                >
                  <FilterAltIcon />
                </IconButton>
              </Tooltip>
              )}
            </ListItemButton>
          ))}
        </List>
    }
    else {
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
      <Box className='filter_sidebar' sx={{ width: '100%', maxWidth: 220, bgcolor: 'background.paper' }} style={{ margin: "1rem", overflow: "auto" }}>
        <Tooltip title="Click to save a checkpoint of the current state">
          <Button variant="contained" color="primary" fullWidth onClick={handleCheckpointDialogOpen} style={{ marginBottom: '1rem', fontSize: "small", padding: "5px 6px" }} startIcon={<SaveIcon />}>
            Save CHECKPOINT
          </Button>
        </Tooltip>
        <Tooltip title="Click to download the result as a file">
          <Button variant="outlined" color="primary" fullWidth onClick={handleDownload} style={{ marginBottom: '1rem', fontSize: "small", padding: "5px 6px" }} startIcon={<FileDownloadIcon />}>
            Download Result
          </Button>
        </Tooltip>
        <Divider />

        <List component="nav" aria-label="main mailbox folders" style={{ paddingBottom: "0" }}>
          <Tooltip title="Click to filter entities" placement="top">
            <ListItemButton
              selected={selectedMode === 'Entities'}
              onClick={() => handleButtonClick('Entities')}
            >
              <ListItemText primary="Entities" />
              <ListItemIcon sx={{ position: 'absolute', right: 0, minWidth: "30px" }}>
                <DescriptionIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>

          <Tooltip title="Click to filter relations" placement="top">
            <ListItemButton selected={selectedMode === "Relations"} onClick={() => handleButtonClick("Relations")}>
              <ListItemText primary="Relations" />
              <ListItemIcon sx={{ position: 'absolute', right: 0, minWidth: "30px" }}>
                <LinkIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>

          <Tooltip title="Click to filter paragraphs" placement="top">
            <ListItemButton
              selected={selectedMode === 'Paragraphs'}
              onClick={() => handleButtonClick('Paragraphs')}
            >
              <ListItemText primary="Paragraphs" />
              <ListItemIcon sx={{ position: 'absolute', right: 0, minWidth: "30px" }}>
                <ParagraphIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
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
                <FormControlLabel value="filter" control={<Radio />} label="Based-on Current Filter" />
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
                    {/* ignore the last one */}
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


        <Dialog open={isFilterDialogOpen} onClose={handleFilterDialogClose}>
          <DialogTitle>{`Filter ${selectedMode === 'Entities' ? 'Entity Types' : 'Relation Types'} for This ${selectedMode.slice(0, -1)}`}</DialogTitle>
          <DialogContent>
            <div>
              <FormControlLabel
                label="Select All"
                control={
                  <Checkbox
                    checked={
                      selectedMode === 'Entities'
                        ? checkedItems[0][filterDialogIndex].every((item) => item === true)
                        : checkedItems[1][filterDialogIndex].every((item) => item === true)
                    }
                    // Pass also current value of Select All
                    onChange={() => handleCheckBoxAllChange(filterDialogIndex)}
                  />
                }
            />
            {(selectedMode === 'Entities' ? checkedItems[0][filterDialogIndex] : checkedItems[1][filterDialogIndex]).map((type, typeIndex) => (

            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
              <FormControlLabel
                label={`${selectedMode === 'Entities' ? relationTypes[typeIndex] : entityTypes[typeIndex]}`}
                control={<Checkbox checked={type} onChange={() => handleCheckboxChange(filterDialogIndex, typeIndex)} />}
              />
            </Box>
            
              // <FormControlLabel
              //   key={`${selectedMode === 'Entities' ? relationTypes[typeIndex] : entityTypes[typeIndex]}`}
              //   control={
              //     <Checkbox
              //       checked={type}
              //       onChange={() => handleCheckboxChange(filterDialogIndex, typeIndex)}
              //     />
              //   }
              //   label={`${selectedMode === 'Entities' ? relationTypes[typeIndex] : entityTypes[typeIndex]}`}
              // />
              
            ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFilterDialogClose}>Cancel</Button>
            <Button color="primary" variant="contained" onClick={handleFilterApply}>
              Apply
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={isCheckpointDialogOpen} onClose={handleCheckpointDialogClose}>
          <DialogTitle>Save Checkpoint</DialogTitle>
          <DialogContent>
            <TextField 
              autoFocus 
              margin="dense" 
              id="checkpoint-name" 
              label="Checkpoint Name" 
              type="text" 
              fullWidth 
              value={checkpointName} 
              onChange={(e) => setCheckpointName(e.target.value)} 
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCheckpointDialogClose}>Cancel</Button>
            <Button onClick={handleCheckpointSave} color="primary" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>


      </Box>
    );
  }
