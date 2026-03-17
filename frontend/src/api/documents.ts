import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface DocumentInfo {
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

export interface DocumentResponse {
  brat_format_output: Array<Record<string, string | number | boolean>>;
  tables: Array<Record<string, string | number | boolean>>;
  document_id: string;
  update_id: string;
  filename: string;
  pdf_format_output: Array<Record<string, string | number | boolean>>;
  llm_texts: Array<Record<string, string | number | boolean>>;
}

export interface UploadResponse {
  infor: DocumentInfo;
  task_id: string;
}

export interface TaskStatus {
  status: string;
  result?: DocumentInfo;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchDocuments(): Promise<DocumentInfo[]> {
  const response = await axiosInstance.post(`${BASE_URL}/documents`, {}, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/get-document/${id}`, {}, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await axiosInstance.get(`${BASE_URL}/delete-document/${id}`, {
    headers: authHeaders(),
  });
}

export async function uploadPdf(formData: FormData): Promise<UploadResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/upload-pdf-queue/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
  });
  return response.data;
}

export async function uploadPdfWithJson(formData: FormData): Promise<UploadResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/upload-pdf-with-json/`, formData, {
    headers: authHeaders(),
    maxBodyLength: Infinity,
  });
  return response.data;
}

export async function downloadDocument(id: string): Promise<Blob> {
  const response = await axiosInstance.get(`${BASE_URL}/download-document/${id}`, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return response.data;
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await axiosInstance.get(`${BASE_URL}/task-status/${taskId}/`, {
    headers: authHeaders(),
  });
  return response.data;
}
