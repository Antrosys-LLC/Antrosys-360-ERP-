import apiClient from './api-client';

export interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  children: DocumentFolder[];
  _count: { documents: number };
}

export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  isConfidential: boolean;
  description: string | null;
  tags: string[];
  folderId: string;
  createdAt: string;
  updatedAt: string;
  folder: { id: string; name: string; parentId: string | null };
  employee: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  client: { id: string; name: string } | null;
  uploadedBy: { id: string; email: string };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- Folders ----

export async function fetchFolders(): Promise<DocumentFolder[]> {
  const { data } = await apiClient.get('/documents/folders');
  return data.data;
}

export async function createFolder(payload: { name: string; parentId?: string | null; isLocked?: boolean }): Promise<DocumentFolder> {
  const { data } = await apiClient.post('/documents/folders', payload);
  return data.data;
}

export async function updateFolder(folderId: string, payload: { name?: string; isLocked?: boolean }): Promise<DocumentFolder> {
  const { data } = await apiClient.patch(`/documents/folders/${folderId}`, payload);
  return data.data;
}

export async function deleteFolder(folderId: string): Promise<void> {
  await apiClient.delete(`/documents/folders/${folderId}`);
}

// ---- Documents ----

export async function fetchDocuments(params: {
  folderId?: string;
  search?: string;
  employeeId?: string;
  clientId?: string;
  fileType?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<DocumentItem>> {
  const { data } = await apiClient.get('/documents', { params });
  return data.data;
}

export async function fetchDocument(documentId: string): Promise<DocumentItem> {
  const { data } = await apiClient.get(`/documents/${documentId}`);
  return data.data;
}

export async function createDocument(payload: {
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  isConfidential?: boolean;
  description?: string | null;
  tags?: string[];
  folderId: string;
  employeeId?: string | null;
  clientId?: string | null;
}): Promise<DocumentItem> {
  const { data } = await apiClient.post('/documents', payload);
  return data.data;
}

export async function updateDocument(documentId: string, payload: {
  title?: string;
  description?: string | null;
  tags?: string[];
  isConfidential?: boolean;
  folderId?: string;
  employeeId?: string | null;
  clientId?: string | null;
}): Promise<DocumentItem> {
  const { data } = await apiClient.patch(`/documents/${documentId}`, payload);
  return data.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}
