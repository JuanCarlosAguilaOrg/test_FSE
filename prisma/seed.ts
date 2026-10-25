import { PrismaClient } from '@prisma/client';
import { seedCourse } from './seedCourse';

const prisma = new PrismaClient();
seedCourse(prisma)
  .then(() => console.log('Seed completado (idempotente).'))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
