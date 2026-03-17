import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface LLMSetting {
  name: string;
  top_k: number;
  top_p: number;
  temp: number;
  max_tokens: number;
  thinking_mode: boolean;
}

export interface TableContentPayload {
  document_id: string;
  update_id: string;
  table_id: string;
  llm_setting: LLMSetting;
}

export interface TableResponse {
  brat_format_output?: Array<Record<string, string | number | boolean>>;
  brat_output_format?: Array<Record<string, string | number | boolean>>;
  tables?: Array<Record<string, string | number | boolean>>;
  document_id: string;
  update_id: string;
  filename?: string;
  file_name?: string;
}

export interface EditTablesPayload {
  table_name: string;
  table_body: string;
  table_caption: string;
  table_footnote: string;
  context: string;
  document_id: string;
  update_id: string;
  table_id: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function generateTableContent(data: TableContentPayload): Promise<TableResponse> {
  const response = await axiosInstance.post(
    `${BASE_URL}/generate-table-content-in-pdf-viewer`,
    data,
    { headers: authHeaders() }
  );
  return response.data;
}

export async function editTables(data: EditTablesPayload): Promise<TableResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/edit-tables`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
