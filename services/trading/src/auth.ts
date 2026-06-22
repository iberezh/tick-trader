import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import bcrypt from 'bcryptjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createUser, findUserByEmail } from './db.js';

export const AUTH_COOKIE = 'tt_token';
// Compared against when the email is unknown, to keep login timing uniform.
const DUMMY_HASH = bcrypt.hashSync('tick-trader-dummy', 10);

const Credentials = Type.Object({
  email: Type.String({ format: 'email', minLength: 3, maxLength: 200 }),
  password: Type.String({ minLength: 8, maxLength: 200 }),
});

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
    request.account = { id, email }; // drop JWT iat/exp so handlers see only the account
  } catch {
    await reply.code(401).send({ error: 'unauthorized' });
    return;
  }
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production', // require HTTPS off localhost
  path: '/',
} as const;

export const authRoutes: FastifyPluginAsyncTypebox = (app) => {
  const issue = (reply: FastifyReply, account: Account): void => {
    const token = app.jwt.sign(account, { expiresIn: '7d' });
    reply.setCookie(AUTH_COOKIE, token, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7 });
  };

  app.post('/api/v1/auth/register', { schema: { body: Credentials } }, async (request, reply) => {
    const email = request.body.email.toLowerCase();
    if (await findUserByEmail(email)) {
      return reply.code(409).send({ error: 'email already registered' });
    }
    const account: Account = { id: randomUUID(), email };
    await createUser({ ...account, passwordHash: await bcrypt.hash(request.body.password, 10) });
    issue(reply, account);
    return reply.code(201).send(account);
  });

  app.post('/api/v1/auth/login', { schema: { body: Credentials } }, async (request, reply) => {
    const email = request.body.email.toLowerCase();
    const user = await findUserByEmail(email);
    const valid = await bcrypt.compare(request.body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) return reply.code(401).send({ error: 'invalid credentials' });
    const account: Account = { id: user.id, email: user.email };
    issue(reply, account);
    return account;
  });

  app.post('/api/v1/auth/logout', (_request, reply) => {
    // clear options must match the set options or some browsers keep the cookie
    reply.clearCookie(AUTH_COOKIE, COOKIE_OPTS);
    return { ok: true };
  });

  app.get('/api/v1/auth/me', { preHandler: requireAuth }, (request) => request.account);

  return Promise.resolve();
};
