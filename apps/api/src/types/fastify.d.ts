import { Permission } from '@antrosys/types';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      role: string;
      permissions: Permission[];
    };
  }

  interface FastifyInstance {
    verifyJwt: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (
      permission: Permission,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
