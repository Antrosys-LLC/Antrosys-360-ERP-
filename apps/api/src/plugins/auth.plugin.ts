import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { Permission } from '@antrosys/types';
import { getEffectivePermissions } from '../modules/admin/module-access.service';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      role: string;
      permissions: Permission[];
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyJwt: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPluginFn(fastify: FastifyInstance) {
  fastify.decorate('verifyJwt', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await request.jwtVerify<{ id: string; role: string }>();
      const permissions = await getEffectivePermissions(payload.role);

      request.user = {
        id: payload.id,
        role: payload.role,
        permissions,
      };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export const authPlugin = fp(authPluginFn, {
  name: 'auth-plugin',
});
