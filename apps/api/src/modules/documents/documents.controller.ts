import { FastifyReply, FastifyRequest } from 'fastify';
import {
  documentParamsSchema,
  folderParamsSchema,
  listDocumentsQuerySchema,
  createDocumentBodySchema,
  updateDocumentBodySchema,
  createFolderBodySchema,
  updateFolderBodySchema,
} from './documents.schema';
import * as documentsService from './documents.service';

function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({ error: 'Validation failed', details: error });
}

// ============================================================================
// FOLDER HANDLERS
// ============================================================================

export async function listFoldersHandler(_request: FastifyRequest, reply: FastifyReply) {
  const folders = await documentsService.listFolders();
  return reply.code(200).send({ status: 'success', data: folders });
}

export async function getFolderHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = folderParamsSchema.safeParse(request.params);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());

  const folder = await documentsService.getFolderById(parsed.data.folderId);
  if (!folder) return reply.code(404).send({ error: 'Folder not found' });

  return reply.code(200).send({ status: 'success', data: folder });
}

export async function createFolderHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createFolderBodySchema.safeParse(request.body);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());

  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const folder = await documentsService.createFolder(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: folder });
}

export async function updateFolderHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = folderParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return sendValidationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateFolderBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return sendValidationError(reply, bodyParsed.error.flatten());

  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const updated = await documentsService.updateFolder(
    paramsParsed.data.folderId,
    bodyParsed.data,
    request.user.id,
  );
  if (!updated) return reply.code(404).send({ error: 'Folder not found' });

  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteFolderHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = folderParamsSchema.safeParse(request.params);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());

  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  try {
    const deleted = await documentsService.deleteFolder(parsed.data.folderId, request.user.id);
    if (!deleted) return reply.code(404).send({ error: 'Folder not found' });

    return reply.code(200).send({ status: 'success', data: deleted });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to delete folder',
    });
  }
}

// ============================================================================
// DOCUMENT HANDLERS
// ============================================================================

export async function listDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listDocumentsQuerySchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());

  const result = await documentsService.listDocuments(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = documentParamsSchema.safeParse(request.params);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());

  const document = await documentsService.getDocumentById(parsed.data.documentId);
  if (!document) return reply.code(404).send({ error: 'Document not found' });

  return reply.code(200).send({ status: 'success', data: document });
}

export async function createDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createDocumentBodySchema.safeParse(request.body);
  if (!parsed.success) {
    request.log.error({ validationErrors: parsed.error.flatten() }, 'Create document validation failed');
    return sendValidationError(reply, parsed.error.flatten());
  }

  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const document = await documentsService.createDocument(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: document });
}

export async function updateDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = documentParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) return sendValidationError(reply, paramsParsed.error.flatten());

  const bodyParsed = updateDocumentBodySchema.safeParse(request.body);
  if (!bodyParsed.success) return sendValidationError(reply, bodyParsed.error.flatten());

  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const updated = await documentsService.updateDocument(
    paramsParsed.data.documentId,
    bodyParsed.data,
    request.user.id,
  );
  if (!updated) return reply.code(404).send({ error: 'Document not found' });

  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = documentParamsSchema.safeParse(request.params);
  if (!parsed.success) return sendValidationError(reply, parsed.error.flatten());

  if (!request.user?.id) return reply.code(401).send({ error: 'Unauthorized' });

  const deleted = await documentsService.deleteDocument(parsed.data.documentId, request.user.id);
  if (!deleted) return reply.code(404).send({ error: 'Document not found' });

  return reply.code(200).send({ status: 'success', data: deleted });
}
