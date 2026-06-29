import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  CreateDocumentBody,
  ListDocumentsQuery,
  UpdateDocumentBody,
  CreateFolderBody,
  UpdateFolderBody,
} from './documents.schema';

type MutationAction =
  | 'DOCUMENT_CREATE'
  | 'DOCUMENT_UPDATE'
  | 'DOCUMENT_DELETE'
  | 'FOLDER_CREATE'
  | 'FOLDER_UPDATE'
  | 'FOLDER_DELETE';

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: MutationAction,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: { userId, action, metadata },
  });
}

function buildDocumentInclude() {
  return {
    folder: { select: { id: true, name: true, parentId: true } },
    employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    client: { select: { id: true, name: true } },
    uploadedBy: { select: { id: true, email: true } },
  };
}

// ============================================================================
// FOLDERS
// ============================================================================

export async function listFolders() {
  const folders = await prisma.documentFolder.findMany({
    include: {
      children: {
        include: {
          children: { include: { children: true } },
        },
      },
      _count: { select: { documents: true } },
    },
    orderBy: { name: 'asc' },
  });

  return folders as unknown as Array<Record<string, unknown>>;
}

export async function getFolderById(folderId: string) {
  return prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: {
      children: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { documents: true } } },
      },
      _count: { select: { documents: true } },
    },
  });
}

export async function createFolder(payload: CreateFolderBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const folder = await tx.documentFolder.create({
      data: {
        name: payload.name,
        parentId: payload.parentId ?? null,
        isLocked: payload.isLocked,
      },
    });

    await writeAuditLog(tx, userId, 'FOLDER_CREATE', {
      folderId: folder.id,
      name: folder.name,
    });

    return folder;
  });
}

export async function updateFolder(folderId: string, payload: UpdateFolderBody, userId: string) {
  const current = await prisma.documentFolder.findUnique({ where: { id: folderId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.documentFolder.update({
      where: { id: folderId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.isLocked !== undefined ? { isLocked: payload.isLocked } : {}),
      },
    });

    await writeAuditLog(tx, userId, 'FOLDER_UPDATE', {
      folderId,
      name: updated.name,
    });

    return updated;
  });
}

export async function deleteFolder(folderId: string, userId: string) {
  const current = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: {
      children: { select: { id: true } },
      _count: { select: { documents: true } },
    },
  });
  if (!current) return null;
  if (current.children.length > 0 || current._count.documents > 0) {
    throw new Error('Cannot delete folder with sub-folders or documents');
  }

  await prisma.$transaction(async (tx) => {
    await tx.documentFolder.delete({ where: { id: folderId } });
    await writeAuditLog(tx, userId, 'FOLDER_DELETE', {
      folderId,
      name: current.name,
    });
  });

  return current;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export async function listDocuments(query: ListDocumentsQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.folderId) where.folderId = query.folderId;
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.clientId) where.clientId = query.clientId;
  if (query.fileType) where.fileType = query.fileType;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { fileName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const docDelegate = prisma.document as any;

  const [total, documents] = await prisma.$transaction([
    docDelegate.count({ where }),
    docDelegate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: buildDocumentInclude(),
    }),
  ]);

  return {
    items: documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDocumentById(documentId: string) {
  const docDelegate = prisma.document as any;
  return docDelegate.findUnique({
    where: { id: documentId },
    include: buildDocumentInclude(),
  });
}

export async function createDocument(payload: CreateDocumentBody, userId: string) {
  const docDelegate = prisma.document as any;

  return prisma.$transaction(async (tx) => {
    const doc = await docDelegate.create({
      data: {
        title: payload.title,
        fileName: payload.fileName,
        fileType: payload.fileType,
        fileSize: payload.fileSize,
        fileUrl: payload.fileUrl,
        thumbnailUrl: payload.thumbnailUrl ?? null,
        isConfidential: payload.isConfidential,
        description: payload.description ?? null,
        tags: payload.tags,
        folderId: payload.folderId,
        employeeId: payload.employeeId ?? null,
        clientId: payload.clientId ?? null,
        uploadedById: userId,
      },
      include: buildDocumentInclude(),
    });

    await writeAuditLog(tx, userId, 'DOCUMENT_CREATE', {
      documentId: doc.id,
      title: doc.title,
      folderId: payload.folderId,
    });

    return doc;
  });
}

export async function updateDocument(documentId: string, payload: UpdateDocumentBody, userId: string) {
  const docDelegate = prisma.document as any;
  const current = await docDelegate.findUnique({
    where: { id: documentId },
    select: { id: true },
  });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.isConfidential !== undefined) updateData.isConfidential = payload.isConfidential;
    if (payload.folderId !== undefined) updateData.folderId = payload.folderId;
    if (payload.employeeId !== undefined) updateData.employeeId = payload.employeeId;
    if (payload.clientId !== undefined) updateData.clientId = payload.clientId;

    const updated = await docDelegate.update({
      where: { id: documentId },
      data: updateData,
      include: buildDocumentInclude(),
    });

    await writeAuditLog(tx, userId, 'DOCUMENT_UPDATE', {
      documentId,
      title: updated.title,
    });

    return updated;
  });
}

export async function deleteDocument(documentId: string, userId: string) {
  const docDelegate = prisma.document as any;
  const current = await docDelegate.findUnique({
    where: { id: documentId },
    select: { id: true, title: true },
  });
  if (!current) return null;

  await prisma.$transaction(async (tx) => {
    await docDelegate.delete({ where: { id: documentId } });
    await writeAuditLog(tx, userId, 'DOCUMENT_DELETE', {
      documentId,
      title: current.title,
    });
  });

  return current;
}
