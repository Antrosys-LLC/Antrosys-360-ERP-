import { FastifyReply, FastifyRequest } from 'fastify';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
  createFolderBodySchema,
  folderParamsSchema,
  documentParamsSchema,
  listDocumentsQuerySchema,
  updateDocumentBodySchema,
} from './documents.schema';
import * as documentService from './documents.service';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'documents');

export async function listFoldersHandler(_request: FastifyRequest, reply: FastifyReply) {
  const folders = await documentService.listFolders();
  return reply.code(200).send({ status: 'success', data: folders });
}

export async function createFolderHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createFolderBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const folder = await documentService.createFolder(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: folder });
}

export async function deleteFolderHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = folderParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const deleted = await documentService.deleteFolder(parsed.data.folderId, request.user.id);
  if (!deleted) return reply.code(404).send({ status: 'error', error: 'Folder not found' });
  return reply.code(200).send({ status: 'success', data: { id: deleted.id } });
}

export async function listDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listDocumentsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const result = await documentService.listDocuments(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getDocumentByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = documentParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const doc = await documentService.getDocumentById(parsed.data.documentId);
  if (!doc) return reply.code(404).send({ status: 'error', error: 'Document not found' });
  return reply.code(200).send({ status: 'success', data: doc });
}

export async function uploadDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });

  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const file = await request.file();
  if (!file) {
    return reply.code(400).send({ status: 'error', error: 'No file uploaded' });
  }

  const folderId = (file.fields as any)?.folderId?.value as string;
  if (!folderId) {
    return reply.code(400).send({ status: 'error', error: 'folderId is required' });
  }

  const uniqueName = `${randomUUID()}-${file.filename}`;
  const filePath = join(UPLOADS_DIR, uniqueName);
  const writeStream = createWriteStream(filePath);

  let sizeBytes = 0;
  const byteCounter = new (require('stream').Transform)({
    transform(chunk: Buffer, _encoding: string, callback: (error?: Error | null, data?: Buffer) => void) {
      sizeBytes += chunk.length;
      this.push(chunk);
      callback();
    },
  });

  try {
    await pipeline(file.file.pipe(byteCounter), writeStream);
  } catch (err) {
    return reply.code(500).send({ status: 'error', error: 'File upload failed' });
  }

  const ext = file.filename.split('.').pop()?.toUpperCase() || 'BIN';
  const doc = await documentService.createDocument(
    {
      name: file.filename,
      type: ext,
      sizeBytes,
      folderId,
      isConfidential: false,
      fileUrl: `/api/v1/documents/download/${uniqueName}`,
    },
    request.user.id,
  );

  return reply.code(201).send({ status: 'success', data: doc });
}

export async function updateDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = documentParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: paramsParsed.error.flatten() });
  }
  const bodyParsed = updateDocumentBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: bodyParsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const updated = await documentService.updateDocument(paramsParsed.data.documentId, bodyParsed.data, request.user.id);
  if (!updated) return reply.code(404).send({ status: 'error', error: 'Document not found' });
  return reply.code(200).send({ status: 'success', data: updated });
}

const downloadParamsSchema = z.object({ uniqueName: z.string().min(1) });

export async function downloadDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = downloadParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  const filePath = join(UPLOADS_DIR, parsed.data.uniqueName);
  if (!existsSync(filePath)) {
    return reply.code(404).send({ status: 'error', error: 'File not found' });
  }
  const stream = createReadStream(filePath);
  return reply.type('application/octet-stream').send(stream);
}

export async function deleteDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = documentParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ status: 'error', error: 'Validation failed', details: parsed.error.flatten() });
  }
  if (!request.user?.id) return reply.code(401).send({ status: 'error', error: 'Unauthorized' });
  const deleted = await documentService.deleteDocument(parsed.data.documentId, request.user.id);
  if (!deleted) return reply.code(404).send({ status: 'error', error: 'Document not found' });
  return reply.code(200).send({ status: 'success', data: { id: deleted.id } });
}
