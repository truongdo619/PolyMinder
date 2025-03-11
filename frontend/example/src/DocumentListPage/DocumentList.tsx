import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosSetup';
import MUIDataTable, { MUIDataTableColumnDef } from "mui-datatables";
import Container from '@mui/material/Container';
import { GlobalContext } from '../GlobalState';
import LoadingOverlay from 'react-loading-overlay-ts';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/GetApp';
import PrintIcon from '@mui/icons-material/Print';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { FileUploader } from 'react-drag-drop-files';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import { format } from 'date-fns';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';


const fileTypes = ["PDF"];

interface DocumentData {
  id: string;
  filename: string;
  upload_time: string;
  pages: number;
  entities: number;
  relations: number;
  status: string;
  task_id?: string;
  error?: string;
}

const DocumentList: React.FC = () => {
  const globalContext = useContext(GlobalContext);

  if (!globalContext) {
    throw new Error("GlobalContext must be used within a GlobalProvider");
  }

  const { setBratOutput, setDocumentId, setFileName, setUpdateId } = globalContext;
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [tableData, setTableData] = useState<DocumentData[]>([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<string | null>(null); // Notification message
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snackbar visibility state



  // Use a ref to store the interval ID
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTableData = useCallback(async () => {
    setIsActive(true);
    let token = localStorage.getItem('accessToken');
    try {
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/documents`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          onUnauthorized: () => navigate('/'),
        }
      );
      setTableData(response.data);
    } catch (error) {
      console.error('Error fetching document list:', error);
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setIsActive(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const pollPendingDocuments = useCallback(() => {
    const pendingDocuments = tableData.filter(
      (doc) => (doc.status === 'processing' || doc.status === 'queued') && doc.task_id
    );

    if (pendingDocuments.length > 0) {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(async () => {
          let token = localStorage.getItem('accessToken');
          try {
            for (const doc of pendingDocuments) {
              const response = await axiosInstance.get(
                `${import.meta.env.VITE_BACKEND_URL}/task-status/${doc.task_id}/`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );
              const { status } = response.data;

              if (status === 'completed') {
                const updatedDoc: DocumentData = {
                  ...response.data.result,
                  task_id: doc.task_id,
                };
                setTableData((prevData) =>
                  prevData.map((d) => (d.id === doc.id ? updatedDoc : d))
                );
                setNotification(`${doc.filename} has completed processing!`);
                setOpenSnackbar(true);
              } else if (status === 'failed') {
                setTableData((prevData) =>
                  prevData.map((d) =>
                    d.id === doc.id ? { ...d, status: 'failed', error: response.data.error } : d
                  )
                );
              }
            }
          } catch (error) {
            console.error('Error polling task status:', error);
          }
        }, 5000);
      }
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [tableData]);

  useEffect(() => {
    pollPendingDocuments();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [pollPendingDocuments]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleFileNameClick = async (documentId: string) => {
    setIsActive(true);
    let token = localStorage.getItem('accessToken');

    try {
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/get-document/${documentId}`,
        {},
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
      navigate('/result', {
        state: {
          highlights: response.data.pdf_format_output,
          url: `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${response.data.filename}`,
        },
      });
    } catch (error: any) {
      console.error('Error fetching document:', error);
      setIsActive(false);
    }
  };

  const handleDeleteClick = async (id: string, fileName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);
    if (!confirmDelete) return;

    setIsActive(true);
    let token = localStorage.getItem('accessToken');

    try {
      await axiosInstance.get(`${import.meta.env.VITE_BACKEND_URL}/delete-document/${id}`, {
        data: { fileName },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setTableData(tableData.filter((doc) => doc.id !== id));
    } catch (error: any) {
      console.error('Error deleting file:', error);
    } finally {
      setIsActive(false);
    }
  };

  const handleDownloadClick = async (document_id: string, fileName: string) => {
    const fileUrl = `${import.meta.env.VITE_BACKEND_URL}/download-document/${document_id}`;
    let token = localStorage.getItem('accessToken');

    try {
      const response = await axiosInstance.post(fileUrl, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Create a download link for the file
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([response.data]));
      link.setAttribute('download', fileName);

      // Append to the document body and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up and remove the link
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePrintClick = (fileName: string) => {
    const fileUrl = `${import.meta.env.VITE_PDF_BACKEND_URL}/statics/${fileName}`;
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleUploadNewPDF = async (file: File) => {
    setFile(file);
    setIsActive(true);

    const formData = new FormData();
    formData.append('file', file);
    let token = localStorage.getItem('accessToken');

    try {
      const response = await axiosInstance.post(
        `${import.meta.env.VITE_BACKEND_URL}/upload-pdf-queue/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      // Include 'task_id' in the document data
      const newDocument: DocumentData = {
        ...response.data.infor,
        task_id: response.data.task_id,
      };
      setTableData([...tableData, newDocument]);
    } catch (error: any) {
      console.error('Error uploading file:', error);
    } finally {
      setIsActive(false);
      setOpenUploadDialog(false);
    }
  };

  const columns: MUIDataTableColumnDef[] = [
    { name: "id", label: "ID" },
    {
      name: "filename",
      label: "File Name",
      options: {
        customBodyRender: (value: string, tableMeta) => {
          const status = tableData[tableMeta.rowIndex].status;
          if (status === 'queued') {
            return value;
          } else {
            return (
              <Link
                onClick={() => handleFileNameClick(tableData[tableMeta.rowIndex].id)}
                sx={{ cursor: 'pointer' }}
              >
                {value}
              </Link>
            );
          }
        },
      },
    },
    {
      name: "upload_time",
      label: "Uploaded Time",
      options: {
        customBodyRender: (value: string) => {
          try {
            // Convert the date to the desired time zone (UTC+9)
            const utcDate = new Date(value);
    
            // Adjust the time by adding 9 hours
            const utcPlusNineDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    
            // Format the date in a readable way
            const formattedDate = format(utcPlusNineDate, 'yyyy-MM-dd HH:mm:ss');
            return formattedDate;
          } catch (error) {
            console.error("Error formatting date:", error);
            // Return the fallback date-time "0000-00-00 00:00:00"
            return "0000-00-00 00:00:00";
          }
        },
      },
    },
    { name: "pages", label: "# Pages" },
    { name: "entities", label: "# Entities" },
    { name: "relations", label: "# Relations" },
    {
      name: "status",
      label: "Status",
      options: {
        customBodyRender: (value: string) => {
          if (value === 'queued') {
            return '⏳ Queued';
          } else if (value === 'processing') {
            return '🔄 Processing';
          } else if (value === 'completed') {
            return '✅ Completed';
          } else if (value === 'failed') {
            return '❌ Failed';
          }
          return value;
        },
      },
    },
    {
      name: "actions",
      label: "Actions",
      options: {
        customBodyRender: (value: string, tableMeta) => {
          const fileName = tableData[tableMeta.rowIndex].filename;
          const id = tableData[tableMeta.rowIndex].id;
          return (
            <>
              <Tooltip title="Download the original document">
                <IconButton aria-label="download" onClick={() => handleDownloadClick(id, fileName)}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print the document">
                <IconButton aria-label="print" onClick={() => handlePrintClick(fileName)}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete the selected document">
                <IconButton aria-label="delete" onClick={() => handleDeleteClick(id, fileName)}>
                  <DeleteIcon sx={{ color: 'indianred' }} />
                </IconButton>
              </Tooltip>
            </>
          );
        },
      },
    },
  ];

  const options = {
    filterType: 'checkbox',
    responsive: 'standard' as const,
    selectableRows: 'none' as const,
  };

  return (
    <LoadingOverlay
      active={isActive}
      spinner
      text='Processing ...'
      styles={{
        overlay: (base) => ({
          ...base,
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          zIndex: 9999,
        }),
      }}
    >
      <Container
        className="document-list"
        maxWidth="xl"
        style={{ top: "150px", position: "relative" }}
      >
        <Box display="flex" justifyContent="flex-end" mb={2} style={{ marginBottom: 0 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload Document
          </Button>
        </Box>
        <MUIDataTable
          title={"Document Management"}
          data={tableData}
          columns={columns}
          options={options}
          className="document-list-table"
        />
      </Container>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{vertical: 'top',horizontal: 'center'}}>
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }} >
            {notification}
          </Alert>
      </Snackbar>
      
      {/* Upload Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload PDF Document</DialogTitle>
        <DialogContent>
          <FileUploader
            handleChange={handleUploadNewPDF}
            name="file"
            types={fileTypes}
            classes="custom-fileUploader"
          />
        </DialogContent>
      </Dialog>
    </LoadingOverlay>
  );
};

export default DocumentList;
