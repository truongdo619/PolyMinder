import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface DocumentUpdateResponse {
  brat_format_output: Array<Record<string, string | number | boolean>>;
  pdf_format_output: Array<Record<string, string | number | boolean>>;
  document_id: string;
  update_id: string;
  filename: string;
}

export interface EntityResponse extends DocumentUpdateResponse {
  matched_entities?: Array<Record<string, string | number | boolean>>;
  update_content_matched_entities?: Record<string, Record<string, string | number | boolean>>;
}

export interface CreateEntityPayload {
  document_id: string;
  update_id: string;
  para_id: string;
  position: Record<string, Record<string, number>>;
  comment: string;
  scale_value: number | string;
}

export interface UpdateEntityPayload {
  document_id: string;
  update_id: string;
  id: string;
  head_pos: number;
  tail_pos: number;
  type: string;
  user_comment: string;
}

export interface DeleteEntityPayload {
  document_id: string;
  update_id: string;
  ids: string[];
}

export interface SetVisiblePayload {
  document_id: string;
  update_id: string;
  visible_list: Record<string, boolean>;
}

export interface EditStatusPayload {
  document_id: string;
  update_id: string;
  id: string;
}

export interface ApplyUpdatePayload {
  list_update: Array<Record<string, string | number | boolean>>;
  old_entity: Record<string, string | number | boolean>;
  new_entity: Record<string, string | number | boolean>;
  document_id: string;
  update_id: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function createEntity(data: CreateEntityPayload): Promise<EntityResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/create-entity`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function updateEntity(data: UpdateEntityPayload): Promise<EntityResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/update-entity`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function deleteEntity(data: DeleteEntityPayload): Promise<EntityResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/delete-entity`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function setVisible(data: SetVisiblePayload): Promise<EntityResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/set-visible`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function changeEditStatus(data: EditStatusPayload): Promise<EntityResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/change-edit-status`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function applyUpdate(data: ApplyUpdatePayload): Promise<EntityResponse> {
  const response = await axiosInstance.post(`${BASE_URL}/apply-update`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
