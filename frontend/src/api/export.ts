import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface SavePayload {
  document_id: string;
  update_id: string;
  update_name: string;
}

export interface SaveResponse {
  update_id: string;
}

export interface DownloadPayload {
  document_id: string;
  update_id: string;
  mode: string;
  type?: string;
  filter_entities?: Array<Record<string, string | number | boolean>>;
  filter_relations?: Array<Record<string, string | number | boolean>>;
}

export interface EntityDownloadPayload {
  document_id: string;
  update_id: string;
  id: string;
}

export interface ParaDownloadPayload {
  document_id: string;
  update_id: string;
  para_id: number | null;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

export async function saveDocument(data: SavePayload): Promise<SaveResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/save/`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function downloadHighlightedDocument(data: DownloadPayload): Promise<Blob> {
  const response = await axiosInstance.post(`${BASE_URL}/download-highlighted-document`, data, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadJson(data: DownloadPayload): Promise<Blob> {
  const response = await axiosInstance.post(`${BASE_URL}/download-json/`, data, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadEntity(data: EntityDownloadPayload): Promise<Record<string, string | number | boolean>> {
  const response = await axiosInstance.post(`${BASE_URL}/download-entity/`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function downloadParaInfo(data: ParaDownloadPayload): Promise<Record<string, string | number | boolean>> {
  const response = await axiosInstance.post(`${BASE_URL}/download-infor-para/`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
