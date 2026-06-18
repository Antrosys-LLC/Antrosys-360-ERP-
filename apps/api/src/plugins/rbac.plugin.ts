import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { Permission } from '@antrosys/types';

declare module 'fastify' {
  interface FastifyInstance {
    requirePermission: (
      permission: Permission,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function rbacPluginFn(fastify: FastifyInstance) {
  fastify.decorate(
    'requirePermission',
    function (permission: Permission) {
      return async function (request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
          reply.code(401).send({ error: 'Unauthorized' });
          return;
        }

        if (!request.user.permissions.includes(permission)) {
          reply.code(403).send({ error: 'Insufficient permissions' });
          return;
        }
      };
    },
  );
}

export const rbacPlugin = fp(rbacPluginFn, {
  name: 'rbac-plugin',
  dependencies: ['auth-plugin'],
});
