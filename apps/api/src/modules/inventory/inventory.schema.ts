import { z } from 'zod';

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['normal', 'low_stock', 'out_of_stock']).optional(),
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;

export const itemParamsSchema = z.object({
  id: z.string().min(1),
});

export type ItemParams = z.infer<typeof itemParamsSchema>;

export const createItemBodySchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  categoryId: z.string().min(1),
  location: z.string().min(1).max(200),
  qty: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(10),
  maxStockLevel: z.number().int().min(0).default(100),
  supplier: z.string().min(1).max(200),
  unitCost: z.number().positive(),
  leadTime: z.string().min(1).max(50),
});

export type CreateItemBody = z.infer<typeof createItemBodySchema>;

export const updateItemBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().min(1).max(50).optional(),
  categoryId: z.string().min(1).optional(),
  location: z.string().min(1).max(200).optional(),
  qty: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).optional(),
  supplier: z.string().min(1).max(200).optional(),
  unitCost: z.number().positive().optional(),
  leadTime: z.string().min(1).max(50).optional(),
});

export type UpdateItemBody = z.infer<typeof updateItemBodySchema>;

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const createCategoryBodySchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;

export const dashboardQuerySchema = z.object({
  location: z.string().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export const createPurchaseOrderBodySchema = z.object({
  items: z.array(z.object({
    itemId: z.string().min(1),
    itemName: z.string().min(1),
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
    unitCost: z.number().positive(),
    totalCost: z.number().positive(),
  })).min(1),
  notes: z.string().optional(),
});

export type CreatePurchaseOrderBody = z.infer<typeof createPurchaseOrderBodySchema>;
