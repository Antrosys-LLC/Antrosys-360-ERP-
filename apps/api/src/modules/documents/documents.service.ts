import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type { CreateFolderBody, ListDocumentsQuery, UpdateDocumentBody } from './documents.schema';

type MutationAction = 'DOCUMENT_FOLDER_CREATE' | 'DOCUMENT_FOLDER_DELETE' | 'DOCUMENT_UPLOAD' | 'DOCUMENT_UPDATE' | 'DOCUMENT_DELETE';

async function writeAuditLog(tx: Prisma.TransactionClient, userId: string, action: MutationAction, metadata: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

type FolderWithChildren = {
  id: string; name: string; parentId: string | null; path: string; isLocked: boolean;
  _count: { documents: number }; children: FolderWithChildren[];
};

export async function listFolders() {
  const all = await prisma.documentFolder.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { documents: true } } },
  });
  const map = new Map<string, FolderWithChildren>();
  const roots: FolderWithChildren[] = [];
  for (const f of all) {
    map.set(f.id, { ...f, children: [] });
  }
  for (const f of map.values()) {
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(f);
    } else {
      roots.push(f);
    }
  }
  return roots;
}

export async function createFolder(payload: CreateFolderBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const folder = await tx.documentFolder.create({
      data: {
        name: payload.name,
        parentId: payload.parentId ?? null,
        path: payload.path ?? payload.name,
        isLocked: payload.isLocked,
      },
    });
    await writeAuditLog(tx, userId, 'DOCUMENT_FOLDER_CREATE', { folderId: folder.id, name: folder.name });
    return folder;
  });
}

export async function deleteFolder(folderId: string, userId: string) {
  const folder = await prisma.documentFolder.findUnique({ where: { id: folderId } });
  if (!folder) return null;

  return prisma.$transaction(async (tx) => {
    await tx.documentFolder.delete({ where: { id: folderId } });
    await writeAuditLog(tx, userId, 'DOCUMENT_FOLDER_DELETE', { folderId, name: folder.name });
    return folder;
  });
}

export async function listDocuments(query: ListDocumentsQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.folderId) where.folderId = query.folderId;
  if (query.type) where.type = query.type;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, documents] = await prisma.$transaction([
    prisma.document.count({ where: where as any }),
    prisma.document.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { folder: true },
    }),
  ]);

  const items = documents.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    size: formatSize(d.sizeBytes),
    isConfidential: d.isConfidential,
    updatedAt: formatRelativeTime(d.updatedAt),
    createdAt: d.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    location: d.folder.path,
    folderId: d.folderId,
    previewText: d.previewText || extractPreview(d.name),
  }));

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDocumentById(documentId: string) {
  const d = await prisma.document.findUnique({
    where: { id: documentId },
    include: { folder: true },
  });
  if (!d) return null;

  return {
    id: d.id,
    name: d.name,
    type: d.type,
    size: formatSize(d.sizeBytes),
    isConfidential: d.isConfidential,
    updatedAt: formatRelativeTime(d.updatedAt),
    createdAt: d.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdBy: 'System',
    modifiedAt: formatRelativeTime(d.updatedAt),
    modifiedBy: 'System',
    location: d.folder.path,
    folderId: d.folderId,
    previewText: d.previewText || extractPreview(d.name),
  };
}

export async function createDocument(
  data: {
    name: string;
    type: string;
    sizeBytes: number;
    folderId: string;
    isConfidential: boolean;
    fileUrl: string;
  },
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({ data: { ...data, createdByUserId: userId } });
    await writeAuditLog(tx, userId, 'DOCUMENT_UPLOAD', { documentId: doc.id, name: doc.name, folderId: data.folderId });
    return doc;
  });
}

export async function updateDocument(documentId: string, payload: UpdateDocumentBody, userId: string) {
  const current = await prisma.document.findUnique({ where: { id: documentId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.document.update({
      where: { id: documentId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.isConfidential !== undefined ? { isConfidential: payload.isConfidential } : {}),
        ...(payload.previewText !== undefined ? { previewText: payload.previewText } : {}),
      },
    });
    await writeAuditLog(tx, userId, 'DOCUMENT_UPDATE', { documentId });
    return updated;
  });
}

export async function deleteDocument(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return null;

  return prisma.$transaction(async (tx) => {
    await tx.document.delete({ where: { id: documentId } });
    await writeAuditLog(tx, userId, 'DOCUMENT_DELETE', { documentId, name: doc.name });
    return doc;
  });
}

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function extractPreview(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() || 'DOC';
  return `${ext} DOCUMENT. Standard system document reference for ${name}. Processed and indexed by Antrosys Document Vault.`;
}
