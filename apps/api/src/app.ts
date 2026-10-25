import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler, notFound } from './middleware/error';
import { healthRouter } from './routes/health.routes';
import { learningRouter } from './routes/learning.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api/health', healthRouter);
  app.use('/api/learning', learningRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
