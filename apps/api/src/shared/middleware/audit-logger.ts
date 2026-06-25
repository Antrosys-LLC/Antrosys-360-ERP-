import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../config/database';

// Paths that should be excluded from audit logging
const EXCLUDED_PATHS = ['/api/v1/auth/login', '/health'];

export async function auditLoggerHook(request: FastifyRequest, reply: FastifyReply) {
  // Skip excluded paths
  if (EXCLUDED_PATHS.some((path) => request.url.startsWith(path))) {
    return;
  }

  // Only log if user is authenticated
  if (!request.user?.id) {
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: `${request.method} ${request.url}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
        statusCode: reply.statusCode,
        metadata: {
          params: request.params,
          query: request.query,
        } as any,
      },
    });
  } catch (err) {
    // Don't fail the request if audit logging fails
    request.log.error({ err }, 'Failed to write audit log');
  }
}
