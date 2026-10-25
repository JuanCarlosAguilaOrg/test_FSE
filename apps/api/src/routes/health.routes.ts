import { Router } from 'express';
import { prisma } from '../db';

export const healthRouter = Router();
healthRouter.get('/', async (_req, res) => {
  let database: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'up';
  } catch {
    /* se reporta como down, sin detalles internos */
  }
  res.status(database === 'up' ? 200 : 503).json({
    status: database === 'up' ? 'ok' : 'degraded',
    api: 'up',
    database,
  });
});
