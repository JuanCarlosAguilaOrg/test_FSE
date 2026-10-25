import { PrismaClient } from '@prisma/client';
import './config'; // garantiza que .env esté cargado antes de instanciar Prisma

export const prisma = new PrismaClient();
