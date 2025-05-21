import React from 'react';
import MUIDataTable, { MUIDataTableColumnDef } from "mui-datatables";
import Container from '@mui/material/Container';

const columns: MUIDataTableColumnDef[] = [
  {
    name: "ID",
    label: "ID",
    options: {
      setCellHeaderProps: () => ({ style: { paddingLeft: "0px"} }),
    },
  },
  {
    name: "Title",
    label: "Title",
    options: {
      setCellHeaderProps: () => ({ style: { paddingLeft: "0px" } }),
    },
  },
  {
    name: "Uploaded Time",
    label: "Uploaded Time",
    options: {
      setCellHeaderProps: () => ({ style: { paddingLeft: "0px" } }),
    },
  },
  {
    name: "Number of Pages",
    label: "Number of Pages",
    options: {
      setCellHeaderProps: () => ({ style: { paddingLeft: "0px"} }),
    },
  },
  {
    name: "Number of Entities",
    label: "Number of Entities",
    options: {
      setCellHeaderProps: () => ({ style: { paddingLeft: "0px"} }),
    },
  },
  {
    name: "Number of Relations",
    label: "Number of Relations",
    options: {
      setCellHeaderProps: () => ({ style: { paddingLeft: "0px"} }),
    },
  },
];

const data: Array<{ [key: string]: any }> = [
  {
    ID: "001",
    Title: "Document A",
    "Uploaded Time": "2024-08-01 10:30:00",
    "Number of Pages": 15,
    "Number of Entities": 120,
    "Number of Relations": 45,
  },
  {
    ID: "002",
    Title: "Document B",
    "Uploaded Time": "2024-08-02 14:45:00",
    "Number of Pages": 10,
    "Number of Entities": 80,
    "Number of Relations": 30,
  },
  {
    ID: "003",
    Title: "Document C",
    "Uploaded Time": "2024-08-03 09:20:00",
    "Number of Pages": 20,
    "Number of Entities": 150,
    "Number of Relations": 60,
  },
  {
    ID: "004",
    Title: "Document D",
    "Uploaded Time": "2024-08-04 12:00:00",
    "Number of Pages": 25,
    "Number of Entities": 200,
    "Number of Relations": 75,
  },
];

const options = {
  filterType: 'checkbox',
  responsive: 'standard' as const,
  selectableRows: 'none' as const,  // Removes row selection checkboxes
};

const DocumentList: React.FC = () => {
  return (
    <Container maxWidth="xl" style={{ marginTop: "50px" }}>
      <MUIDataTable
        title={"Document List"}
        data={data}
        columns={columns}
        options={options}
      />
    </Container>
  );
};

export default DocumentList;
