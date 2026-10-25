import { createApp } from './app';
import { config } from './config';
import { prisma } from './db';

const server = createApp().listen(config.port, () => {
  console.log(`API escuchando en el puerto ${config.port}`);
});

const shutdown = () => server.close(() => void prisma.$disconnect().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
