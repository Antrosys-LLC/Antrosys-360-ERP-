import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../config/database';
import { z } from 'zod';

const notificationParamsSchema = z.object({
  id: z.string().cuid(),
});

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.verifyJwt);

  // Fetch user's latest 20 notifications
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: request.user.id, isRead: false },
    });

    return {
      status: 'success',
      data: {
        items: notifications,
        unreadCount,
      },
    };
  });

  // Mark single notification as read
  fastify.patch('/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const paramsParsed = notificationParamsSchema.safeParse(request.params);
    if (!paramsParsed.success) {
      return reply.code(400).send({ error: 'Invalid parameters', details: paramsParsed.error.flatten() });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: paramsParsed.data.id },
    });

    if (!notification || notification.userId !== request.user.id) {
      return reply.code(404).send({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: paramsParsed.data.id },
      data: { isRead: true },
    });

    return {
      status: 'success',
      data: updated,
    };
  });

  // Mark all notifications as read
  fastify.post('/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: { userId: request.user.id, isRead: false },
      data: { isRead: true },
    });

    return {
      status: 'success',
    };
  });
}
