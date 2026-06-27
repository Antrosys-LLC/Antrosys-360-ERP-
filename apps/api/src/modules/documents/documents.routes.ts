import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import multipart from '@fastify/multipart';
import {
  listFoldersHandler,
  createFolderHandler,
  deleteFolderHandler,
  listDocumentsHandler,
  getDocumentByIdHandler,
  uploadDocumentHandler,
  downloadDocumentHandler,
  updateDocumentHandler,
  deleteDocumentHandler,
} from './documents.controller';

const DOCUMENTS_READ: Permission = 'documents:read';
const DOCUMENTS_WRITE: Permission = 'documents:write';

export async function documentsRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  fastify.addHook('preHandler', fastify.verifyJwt);

  fastify.get('/folders', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: listFoldersHandler,
  });

  fastify.post('/folders', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: createFolderHandler,
  });

  fastify.delete('/folders/:folderId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: deleteFolderHandler,
  });

  fastify.get('/', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: listDocumentsHandler,
  });

  fastify.get('/download/:uniqueName', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: downloadDocumentHandler,
  });

  fastify.get('/:documentId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: getDocumentByIdHandler,
  });

  fastify.post('/upload', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: uploadDocumentHandler,
  });

  fastify.patch('/:documentId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: updateDocumentHandler,
  });

  fastify.delete('/:documentId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: deleteDocumentHandler,
  });
}
