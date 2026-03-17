export { login, register, forgotPassword, resetPassword } from './auth';

export {
  fetchDocuments,
  getDocument,
  deleteDocument,
  uploadPdf,
  uploadPdfWithJson,
  downloadDocument,
  getTaskStatus,
} from './documents';
export type {
  DocumentInfo,
  DocumentResponse,
  UploadResponse,
  TaskStatus,
} from './documents';

export {
  createEntity,
  updateEntity,
  deleteEntity,
  setVisible,
  changeEditStatus,
  applyUpdate,
} from './entities';
export type {
  DocumentUpdateResponse,
  EntityResponse,
  CreateEntityPayload,
  UpdateEntityPayload,
  DeleteEntityPayload,
  SetVisiblePayload,
  EditStatusPayload,
  ApplyUpdatePayload,
} from './entities';

export { updateRelations } from './relations';
export type { UpdateRelationsPayload, RelationResponse } from './relations';

export {
  runWithLLM,
  parseLLMOutput,
  compareWithModelOutput,
  mergeLLMResult,
} from './llm';
export type {
  LLMSetting,
  RunLLMPayload,
  LLMResponse,
  ParseLLMPayload,
  CompareLLMPayload,
  MergeLLMPayload,
  MergeResponse,
} from './llm';

export { generateTableContent, editTables } from './tables';
export type {
  TableContentPayload,
  TableResponse,
  EditTablesPayload,
} from './tables';

export { editParagraph, reorderParagraph } from './paragraphs';
export type {
  EditParagraphPayload,
  ParagraphResponse,
  ReorderParagraphPayload,
} from './paragraphs';

export {
  saveDocument,
  downloadHighlightedDocument,
  downloadJson,
  downloadEntity,
  downloadParaInfo,
} from './export';
export type {
  SavePayload,
  SaveResponse,
  DownloadPayload,
  EntityDownloadPayload,
  ParaDownloadPayload,
} from './export';
