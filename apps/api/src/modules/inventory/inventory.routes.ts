import { FastifyInstance } from 'fastify';
import {
  listItemsHandler,
  getItemHandler,
  createItemHandler,
  updateItemHandler,
  deleteItemHandler,
  getDashboardHandler,
  getReorderHandler,
  listCategoriesHandler,
  createCategoryHandler,
} from './inventory.controller';

export async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // Dashboard
  fastify.get('/dashboard', {
    preHandler: [fastify.requirePermission('inventory:read')],
    handler: getDashboardHandler,
  });

  // Reorder recommendations
  fastify.get('/reorder', {
    preHandler: [fastify.requirePermission('inventory:read')],
    handler: getReorderHandler,
  });

  // Items CRUD
  fastify.get('/', {
    preHandler: [fastify.requirePermission('inventory:read')],
    handler: listItemsHandler,
  });

  fastify.get('/:id', {
    preHandler: [fastify.requirePermission('inventory:read')],
    handler: getItemHandler,
  });

  fastify.post('/', {
    preHandler: [fastify.requirePermission('inventory:write')],
    handler: createItemHandler,
  });

  fastify.put('/:id', {
    preHandler: [fastify.requirePermission('inventory:write')],
    handler: updateItemHandler,
  });

  fastify.delete('/:id', {
    preHandler: [fastify.requirePermission('inventory:write')],
    handler: deleteItemHandler,
  });

  // Categories
  fastify.get('/categories', {
    preHandler: [fastify.requirePermission('inventory:read')],
    handler: listCategoriesHandler,
  });

  fastify.post('/categories', {
    preHandler: [fastify.requirePermission('inventory:write')],
    handler: createCategoryHandler,
  });
}