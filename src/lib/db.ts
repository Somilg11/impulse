import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Query logging leaks request bodies and headers into server logs, so keep it
// out of production.
const db =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;

export default db;
