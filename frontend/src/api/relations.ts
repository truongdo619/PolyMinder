import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface UpdateRelationsPayload {
  document_id: string;
  update_id: string;
  entity_id: string;
  relations: Array<{ type: string; arg_type: string; arg_id: string; arg_text?: string }>;
}

export interface RelationResponse {
  brat_format_output: Array<Record<string, string | number | boolean>>;
  pdf_format_output: Array<Record<string, string | number | boolean>>;
  document_id: string;
  update_id: string;
  filename: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function updateRelations(data: UpdateRelationsPayload): Promise<RelationResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/update-relations`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
