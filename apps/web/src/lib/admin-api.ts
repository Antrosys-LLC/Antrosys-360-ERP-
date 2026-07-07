import apiClient from '@/lib/api-client';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode?: string;
    department?: string;
    designation?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  ipAddress?: string;
  statusCode?: number;
  metadata?: unknown;
  createdAt: string;
  user: { id: string; email: string; role: string };
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  mfaEnabled: number;
  mfaAdoption: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
}) {
  const { data } = await apiClient.get<{ status: string; data: PaginatedUsers }>('/admin/users', { params });
  return data.data;
}

export async function fetchAdminUserStats() {
  const { data } = await apiClient.get<{ status: string; data: AdminUserStats }>('/admin/users/stats');
  return data.data;
}

export async function fetchAdminUser(id: string) {
  const { data } = await apiClient.get<{ status: string; data: AdminUser }>(`/admin/users/${id}`);
  return data.data;
}

export async function createAdminUser(payload: { email: string; password: string; role: string }) {
  const { data } = await apiClient.post<{ status: string; data: AdminUser }>('/admin/users', payload);
  return data.data;
}

export async function updateAdminUser(id: string, payload: { email?: string; role?: string; isActive?: boolean }) {
  const { data } = await apiClient.put<{ status: string; data: AdminUser }>(`/admin/users/${id}`, payload);
  return data.data;
}

export async function deleteAdminUser(id: string) {
  const { data } = await apiClient.delete<{ status: string; data: { deleted: boolean } }>(`/admin/users/${id}`);
  return data.data;
}

export async function fetchAuditLogs(params?: { page?: number; limit?: number; userId?: string }) {
  const { data } = await apiClient.get<{ status: string; data: PaginatedAuditLogs }>('/admin/audit-logs', { params });
  return data.data;
}

// ---- Module Access ----

export type ModuleAccessLevel = 'OFF' | 'READ' | 'FULL';

export interface ModuleDef {
  key: string;
  label: string;
  writeCapable: boolean;
}

export interface RoleModuleAccessCell {
  module: string;
  level: ModuleAccessLevel;
  isOverridden: boolean;
}

export interface RoleModuleAccessRow {
  role: string;
  modules: RoleModuleAccessCell[];
}

export interface ModuleAccessMatrix {
  modules: ModuleDef[];
  roles: RoleModuleAccessRow[];
}

export async function fetchModuleAccess() {
  const { data } = await apiClient.get<{ status: string; data: ModuleAccessMatrix }>('/admin/module-access');
  return data.data;
}

export async function setModuleAccess(payload: { role: string; module: string; accessLevel: ModuleAccessLevel }) {
  const { data } = await apiClient.put<{ status: string; data: unknown }>('/admin/module-access', payload);
  return data.data;
}

export async function fetchMyPermissions() {
  const { data } = await apiClient.get<{ status: string; data: { id: string; role: string; permissions: string[] } }>('/auth/permissions');
  return data.data;
}
