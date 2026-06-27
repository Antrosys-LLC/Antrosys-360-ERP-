import { z } from 'zod';

export const createFolderBodySchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().cuid().optional().nullable(),
  path: z.string().max(500).optional(),
  isLocked: z.boolean().default(false),
});

export const folderParamsSchema = z.object({
  folderId: z.string().cuid(),
});

export const documentParamsSchema = z.object({
  documentId: z.string().cuid(),
});

export const listDocumentsQuerySchema = z.object({
  folderId: z.string().optional(),
  search: z.string().max(200).optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const updateDocumentBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isConfidential: z.boolean().optional(),
  previewText: z.string().max(2000).optional().nullable(),
});

export type CreateFolderBody = z.infer<typeof createFolderBodySchema>;
export type FolderParams = z.infer<typeof folderParamsSchema>;
export type DocumentParams = z.infer<typeof documentParamsSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
