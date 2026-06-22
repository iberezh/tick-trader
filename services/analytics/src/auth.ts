import type { FastifyReply, FastifyRequest } from 'fastify';

// Analytics only verifies the cookie the trading service issued (shared JWT_SECRET).
export const AUTH_COOKIE = 'tt_token';

interface Account {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    account: Account;
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: Account;
    user: Account;
  }
}

// preHandler: verify the JWT cookie and attach request.account; 401 otherwise.
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const { id, email } = await request.jwtVerify<Account>();
    request.account = { id, email };
  } catch {
    await reply.code(401).send({ error: 'unauthorized' });
    return;
  }
}
