import { prisma } from '../../config/database';
import type { ListItemsQuery, CreateItemBody, UpdateItemBody, ListCategoriesQuery, CreateCategoryBody, CreatePurchaseOrderBody } from './inventory.schema';

type ItemWithCategory = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  location: string;
  qty: number;
  minStockLevel: number;
  maxStockLevel: number;
  supplier: string;
  unitCost: { toNumber: () => number } | number;
  leadTime: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
};

function mapItem(item: ItemWithCategory) {
  const stockLevelPercent = item.maxStockLevel > 0
    ? Math.min(100, Math.round((item.qty / item.maxStockLevel) * 100))
    : 0;
  const status = item.qty <= 0 ? 'out_of_stock' as const : item.qty <= item.minStockLevel ? 'low_stock' as const : 'normal' as const;

  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category.name,
    categoryId: item.categoryId,
    location: item.location,
    qty: item.qty,
    minStockLevel: item.minStockLevel,
    maxStockLevel: item.maxStockLevel,
    supplier: item.supplier,
    unitCost: Number(item.unitCost),
    leadTime: item.leadTime,
    stockLevelPercent,
    status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getReorderRecommendations() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { qty: 'asc' },
  });

  const lowStockItems = items.filter((i) => i.qty <= i.minStockLevel);

  return lowStockItems.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    current: item.qty,
    recommendedOrder: Math.max(item.maxStockLevel - item.qty, item.minStockLevel),
    unitCost: Number(item.unitCost),
  }));
}

export async function listItems(query: ListItemsQuery) {
  const where: Record<string, unknown> = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.location) where.location = { contains: query.location, mode: 'insensitive' };

  if (query.status === 'out_of_stock') where.qty = 0;

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { items: items.map(mapItem), total, page: query.page, limit: query.limit };
}

export async function getItem(id: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!item) return null;
  return mapItem(item);
}

export async function createItem(data: CreateItemBody, userId: string) {
  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        location: data.location,
        qty: data.qty,
        minStockLevel: data.minStockLevel,
        maxStockLevel: data.maxStockLevel,
        supplier: data.supplier,
        unitCost: data.unitCost,
        leadTime: data.leadTime,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'INVENTORY_ITEM_CREATE',
        metadata: { itemId: created.id, sku: created.sku, name: created.name },
      },
    });

    return created;
  });

  return mapItem(item);
}

export async function updateItem(id: string, data: UpdateItemBody, userId: string) {
  const item = await prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryItem.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await tx.inventoryItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.qty !== undefined && { qty: data.qty }),
        ...(data.minStockLevel !== undefined && { minStockLevel: data.minStockLevel }),
        ...(data.maxStockLevel !== undefined && { maxStockLevel: data.maxStockLevel }),
        ...(data.supplier !== undefined && { supplier: data.supplier }),
        ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
        ...(data.leadTime !== undefined && { leadTime: data.leadTime }),
      },
      include: { category: { select: { id: true, name: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'INVENTORY_ITEM_UPDATE',
        metadata: { itemId: id, changes: Object.keys(data) },
      },
    });

    return updated;
  });

  if (!item) return null;
  return mapItem(item);
}

export async function deleteItem(id: string, userId: string) {
  const item = await prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryItem.findUnique({ where: { id } });
    if (!existing) return null;

    await tx.inventoryItem.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'INVENTORY_ITEM_DELETE',
        metadata: { itemId: id, sku: existing.sku, name: existing.name },
      },
    });

    return existing;
  });

  return item;
}

export async function getDashboardStats(location?: string) {
  const where: Record<string, unknown> = {};
  if (location) where.location = { contains: location, mode: 'insensitive' };

  const items = await prisma.inventoryItem.findMany({ where });

  const totalValue = items.reduce((sum, item) => sum + Number(item.unitCost) * item.qty, 0);
  const lowStock = items.filter((i) => i.qty > 0 && i.qty <= i.minStockLevel).length;
  const outOfStock = items.filter((i) => i.qty <= 0).length;
  const turnoverRatio = items.length > 0 ? '4.2x' : '0.0x';

  const stockDistribution = [
    { label: 'In stock', percent: 0, color: '#7C3AED' },
    { label: 'Low stock', percent: 0, color: '#F5A623' },
    { label: 'Out of stock', percent: 0, color: '#EF4444' },
    { label: 'Overstocked', percent: 0, color: '#60A5FA' },
  ];

  if (items.length > 0) {
    const inStock = items.filter((i) => i.qty > i.minStockLevel && i.qty <= i.maxStockLevel).length;
    const lowStockCount = items.filter((i) => i.qty > 0 && i.qty <= i.minStockLevel).length;
    const outOfStockCount = items.filter((i) => i.qty <= 0).length;
    const overstocked = items.filter((i) => i.qty > i.maxStockLevel).length;
    const total = items.length;

    stockDistribution[0].percent = Math.round((inStock / total) * 100);
    stockDistribution[1].percent = Math.round((lowStockCount / total) * 100);
    stockDistribution[2].percent = Math.round((outOfStockCount / total) * 100);
    stockDistribution[3].percent = Math.round((overstocked / total) * 100);
  }

  return {
    totalValue: totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    lowStock,
    outOfStock,
    turnoverRatio,
    stockDistribution,
    totalSkuCount: items.length,
    locationCount: new Set(items.map((i) => i.location)).size,
  };
}

export async function listCategories(query: ListCategoriesQuery) {
  const [categories, total] = await Promise.all([
    prisma.inventoryCategory.findMany({
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.inventoryCategory.count(),
  ]);

  return { categories, total, page: query.page, limit: query.limit };
}

export async function createCategory(data: CreateCategoryBody) {
  return prisma.inventoryCategory.create({
    data: { name: data.name },
  });
}

export async function listLocations() {
  const items = await prisma.inventoryItem.findMany({
    select: { location: true },
    distinct: ['location'],
    orderBy: { location: 'asc' },
  });
  return items.map((i) => i.location);
}

export async function createPurchaseOrder(data: CreatePurchaseOrderBody, userId: string) {
  const poNumber = `PO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const grandTotal = data.items.reduce((sum, i) => sum + i.totalCost, 0);

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PURCHASE_ORDER_CREATE',
      metadata: {
        poNumber,
        itemCount: data.items.length,
        grandTotal,
        notes: data.notes || '',
        items: data.items,
      },
    },
  });

  return {
    poNumber,
    items: data.items,
    grandTotal,
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };
}
