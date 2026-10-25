import type { ActivityType, LearningState, Prisma, PrismaClient } from '@prisma/client';

export type Db = PrismaClient | Prisma.TransactionClient;
export const PROGRESS_ID = 'main';

const withOptions = { options: { orderBy: { key: 'asc' as const } } };

export const getProgress = (db: Db) => db.learningProgress.findUnique({ where: { id: PROGRESS_ID } });

export const listTopics = (db: Db) =>
  db.topic.findMany({ orderBy: { order: 'asc' }, include: { theory: true } });

export const findActivityByCode = (db: Db, code: string) =>
  db.activity.findUnique({ where: { code }, include: withOptions });

export const findActivityForTopic = (db: Db, topicId: number, type: ActivityType) =>
  db.activity.findUnique({ where: { topicId_type: { topicId, type } }, include: withOptions });

export const listCompletions = (db: Db) =>
  db.topicCompletion.findMany({ orderBy: { topic: { order: 'asc' } }, include: { topic: true } });

export const listAttempts = (db: Db, limit: number) =>
  db.attempt.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    include: { activity: true, topic: true },
  });

/** Escritura condicionada a la versión leída: devuelve 0 si el estado quedó obsoleto. */
export async function updateProgressIfVersion(
  db: Db,
  expectedVersion: number,
  next: { state: LearningState; currentTopicId: number },
): Promise<number> {
  const r = await db.learningProgress.updateMany({
    where: { id: PROGRESS_ID, version: expectedVersion },
    data: { ...next, version: { increment: 1 } },
  });
  return r.count;
}

export const createAttempt = (
  db: Db,
  data: { activityId: number; topicId: number; selectedOption: string; isCorrect: boolean },
) => db.attempt.create({ data });

export const createCompletion = (db: Db, topicId: number) =>
  db.topicCompletion.create({ data: { topicId } });
