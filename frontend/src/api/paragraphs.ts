import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface EditParagraphPayload {
  document_id: string;
  update_id: string;
  paragraphs: string[];
}

export interface ParagraphResponse {
  brat_format_output: Array<Record<string, string | number | boolean>>;
  pdf_format_output: Array<Record<string, string | number | boolean>>;
  document_id: string;
  update_id: string;
  filename: string;
}

export interface ReorderParagraphPayload {
  document_id: string;
  update_id: string;
  paragraphs: string[];
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function editParagraph(data: EditParagraphPayload): Promise<ParagraphResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/edit-paragraph`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function reorderParagraph(data: ReorderParagraphPayload): Promise<ParagraphResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/reorder-paragraph`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
