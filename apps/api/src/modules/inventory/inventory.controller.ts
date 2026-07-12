import { FastifyRequest, FastifyReply } from 'fastify';
import {
  listItemsQuerySchema,
  itemParamsSchema,
  createItemBodySchema,
  updateItemBodySchema,
  listCategoriesQuerySchema,
  createCategoryBodySchema,
  dashboardQuerySchema,
} from './inventory.schema';
import * as inventoryService from './inventory.service';

export async function listItemsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listItemsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await inventoryService.listItems(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const item = await inventoryService.getItem(id);
  if (!item) {
    return reply.code(404).send({ error: 'Item not found' });
  }
  return reply.code(200).send({ status: 'success', data: item });
}

export async function createItemHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const parsed = createItemBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const item = await inventoryService.createItem(parsed.data, request.user.id);
  return reply.code(201).send({ status: 'success', data: item });
}

export async function updateItemHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { id } = request.params as { id: string };
  const parsed = updateItemBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const item = await inventoryService.updateItem(id, parsed.data, request.user.id);
  if (!item) {
    return reply.code(404).send({ error: 'Item not found' });
  }
  return reply.code(200).send({ status: 'success', data: item });
}

export async function deleteItemHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.id) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { id } = request.params as { id: string };
  const deleted = await inventoryService.deleteItem(id, request.user.id);
  if (!deleted) {
    return reply.code(404).send({ error: 'Item not found' });
  }
  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = dashboardQuerySchema.safeParse(request.query);
  const location = parsed.success ? parsed.data.location : undefined;

  const stats = await inventoryService.getDashboardStats(location);
  return reply.code(200).send({ status: 'success', data: stats });
}

export async function getReorderHandler(_request: FastifyRequest, reply: FastifyReply) {
  const recommendations = await inventoryService.getReorderRecommendations();
  return reply.code(200).send({ status: 'success', data: recommendations });
}

export async function listCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listCategoriesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await inventoryService.listCategories(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function createCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createCategoryBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const category = await inventoryService.createCategory(parsed.data);
  return reply.code(201).send({ status: 'success', data: category });
}