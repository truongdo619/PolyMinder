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

export interface RunLLMPayload {
  document_id: string;
  update_id: string;
  position: Record<string, Record<string, number>>;
  para_id: string;
  scale_value: number;
  page_id: number;
  text: string;
  system_prompt: string;
  prompt: string;
  apply_pipeline: boolean;
  llm_setting: LLMSetting;
  json_schema?: string;
}

export interface LLMResponse {
  brat_format_output?: Array<Record<string, string | number | boolean>>;
  table_output?: Array<Record<string, string | number | boolean>>;
  pdf_format_output?: Array<Record<string, string | number | boolean>>;
  document_id?: string;
  update_id?: string;
  filename?: string;
  llm_texts?: Array<Record<string, string | number | boolean>>;
}

export interface ParseLLMPayload {
  document_id: string;
  update_id: string;
  llm_text_id: string;
}

export interface CompareLLMPayload {
  document_id: string;
  update_id: string;
  llm_text_id: string;
  paragraph_id: string;
}

export interface MergeLLMPayload {
  document_id: string;
  update_id: string;
  llm_text_id: string;
  paragraph_id: string;
}

export interface MergeResponse {
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

export async function runWithLLM(data: RunLLMPayload): Promise<LLMResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/run-with-LLM`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function parseLLMOutput(data: ParseLLMPayload): Promise<LLMResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/parse-LLM-output`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function compareWithModelOutput(data: CompareLLMPayload): Promise<LLMResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/compare-with-model-output`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function mergeLLMResult(data: MergeLLMPayload): Promise<MergeResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/merge_LLM_result`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
