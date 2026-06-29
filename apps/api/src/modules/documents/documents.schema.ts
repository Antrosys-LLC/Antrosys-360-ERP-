import { z } from 'zod';

export const documentParamsSchema = z.object({
  documentId: z.string().min(1),
});

export type DocumentParams = z.infer<typeof documentParamsSchema>;

export const folderParamsSchema = z.object({
  folderId: z.string().min(1),
});

export type FolderParams = z.infer<typeof folderParamsSchema>;

export const listDocumentsQuerySchema = z.object({
  folderId: z.string().optional(),
  search: z.string().max(200).optional(),
  employeeId: z.string().optional(),
  clientId: z.string().optional(),
  fileType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;

export const createDocumentBodySchema = z.object({
  title: z.string().min(1).max(300),
  fileName: z.string().min(1).max(500),
  fileType: z.string().min(1).max(50),
  fileSize: z.string().min(1).max(50),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isConfidential: z.boolean().default(false),
  description: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().max(100)).default([]),
  folderId: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;

export const updateDocumentBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().max(100)).optional(),
  isConfidential: z.boolean().optional(),
  folderId: z.string().optional(),
  employeeId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;

export const createFolderBodySchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().optional().nullable(),
  isLocked: z.boolean().default(false),
});

export type CreateFolderBody = z.infer<typeof createFolderBodySchema>;

export const updateFolderBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isLocked: z.boolean().optional(),
});

export type UpdateFolderBody = z.infer<typeof updateFolderBodySchema>;
