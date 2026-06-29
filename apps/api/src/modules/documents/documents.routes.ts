import { FastifyInstance } from 'fastify';
import type { Permission } from '@antrosys/types';
import {
  listFoldersHandler,
  getFolderHandler,
  createFolderHandler,
  updateFolderHandler,
  deleteFolderHandler,
  listDocumentsHandler,
  getDocumentHandler,
  createDocumentHandler,
  updateDocumentHandler,
  deleteDocumentHandler,
} from './documents.controller';

const DOCUMENTS_READ: Permission = 'documents:read';
const DOCUMENTS_WRITE: Permission = 'documents:write';

export async function documentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // ---- Folders ----
  fastify.get('/folders', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: listFoldersHandler,
  });

  fastify.get('/folders/:folderId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: getFolderHandler,
  });

  fastify.post('/folders', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: createFolderHandler,
  });

  fastify.patch('/folders/:folderId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: updateFolderHandler,
  });

  fastify.delete('/folders/:folderId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: deleteFolderHandler,
  });

  // ---- Documents ----
  fastify.get('/', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: listDocumentsHandler,
  });

  fastify.get('/:documentId', {
    preHandler: [fastify.requirePermission(DOCUMENTS_READ)],
    handler: getDocumentHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission(DOCUMENTS_WRITE)],
    handler: createDocumentHandler,
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
