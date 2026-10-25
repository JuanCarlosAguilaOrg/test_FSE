import { prisma } from '../db';
import { AppError } from '../errors';
import {
  answerableKind,
  transition,
  type LearningState,
  type Position,
} from '../domain/learning';
import * as repo from '../repositories/learning.repository';

type Topics = Awaited<ReturnType<typeof repo.listTopics>>;

export interface PublicStep {
  state: LearningState;
  completed: boolean;
  topic: { code: string; title: string; position: number; total: number };
  activity?: {
    code: string;
    type: 'MAIN' | 'REINFORCEMENT';
    prompt: string;
    options: { key: string; text: string }[];
  };
  theory?: { content: string };
}

const internal = (message: string) => new AppError(500, 'INTERNAL_ERROR', message);
const conflict = () =>
  new AppError(409, 'CONCURRENT_UPDATE', 'El estado cambió; vuelve a consultar el paso actual.');

async function loadContext(db: repo.Db) {
  const progress = await repo.getProgress(db);
  const topics = await repo.listTopics(db);
  if (!progress || topics.length === 0) {
    throw new AppError(500, 'COURSE_NOT_SEEDED', 'El curso no está inicializado. Ejecuta el seed.');
  }
  const topicIndex = topics.findIndex((t) => t.id === progress.currentTopicId);
  if (topicIndex < 0) throw internal('Progreso inconsistente.');
  const pos: Position = { state: progress.state, topicIndex };
  return { progress, topics, pos };
}

async function buildStep(db: repo.Db, topics: Topics, pos: Position): Promise<PublicStep> {
  const topic = topics[pos.topicIndex];
  if (!topic) throw internal('Tema inexistente.');
  const step: PublicStep = {
    state: pos.state,
    completed: pos.state === 'COMPLETED',
    topic: { code: topic.code, title: topic.title, position: pos.topicIndex + 1, total: topics.length },
  };

  if (pos.state === 'MAIN' || pos.state === 'REINFORCEMENT') {
    const activity = await repo.findActivityForTopic(db, topic.id, pos.state);
    if (!activity) throw internal('Actividad faltante.');
    // Mapeo explícito: isCorrect nunca sale del servicio.
    step.activity = {
      code: activity.code,
      type: activity.type,
      prompt: activity.prompt,
      options: activity.options.map((o) => ({ key: o.key, text: o.text })),
    };
  } else if (pos.state === 'THEORY') {
    if (!topic.theory) throw internal('Teoría faltante.');
    step.theory = { content: topic.theory.content };
  }
  return step;
}

export async function getCurrentStep(): Promise<PublicStep> {
  return prisma.$transaction(async (tx) => {
    const { topics, pos } = await loadContext(tx);
    return buildStep(tx, topics, pos);
  });
}

export async function getProgressSummary() {
  return prisma.$transaction(async (tx) => {
    const { topics, pos } = await loadContext(tx);
    const completions = await repo.listCompletions(tx);
    const current = topics[pos.topicIndex];
    if (!current) throw internal('Tema inexistente.');
    const completedCount = completions.length;
    return {
      state: pos.state,
      currentTopic: { code: current.code, title: current.title, position: pos.topicIndex + 1 },
      completedTopics: completions.map((c) => ({
        code: c.topic.code,
        title: c.topic.title,
        completedAt: c.completedAt.toISOString(),
      })),
      completedCount,
      totalTopics: topics.length,
      percent: Math.round((completedCount / topics.length) * 100),
      courseCompleted: pos.state === 'COMPLETED',
    };
  });
}

export async function listAttempts() {
  const rows = await repo.listAttempts(prisma, 100);
  return rows.map((a) => ({
    id: a.id,
    activityCode: a.activity.code,
    activityType: a.activity.type,
    topicCode: a.topic.code,
    selectedOption: a.selectedOption,
    isCorrect: a.isCorrect,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function submitAttempt(input: { activityCode: string; selectedOption: string }) {
  return prisma.$transaction(async (tx) => {
    const { progress, topics, pos } = await loadContext(tx);

    const activity = await repo.findActivityByCode(tx, input.activityCode);
    if (!activity) throw new AppError(404, 'ACTIVITY_NOT_FOUND', 'La actividad no existe.');

    // Lanza error de dominio si THEORY o COMPLETED.
    const kind = answerableKind(pos.state);
    const topic = topics[pos.topicIndex];
    if (!topic) throw internal('Tema inexistente.');
    if (activity.topicId !== topic.id || activity.type !== kind) {
      throw new AppError(409, 'ACTIVITY_NOT_CURRENT', 'La actividad no corresponde al paso actual.');
    }

    const option = activity.options.find((o) => o.key === input.selectedOption);
    if (!option) throw new AppError(400, 'INVALID_OPTION', 'La opción no pertenece a la actividad.');

    const result = transition(pos, { type: 'ANSWER', correct: option.isCorrect }, topics.length);
    const nextTopic = topics[result.next.topicIndex];
    if (!nextTopic) throw internal('Transición inválida.');

    // 1) Guard optimista PRIMERO: si otra petición avanzó el estado, esta espera su
    //    commit, no encuentra la versión y aborta antes de escribir intento/finalización.
    const updated = await repo.updateProgressIfVersion(tx, progress.version, {
      state: result.next.state,
      currentTopicId: nextTopic.id,
    });
    if (updated === 0) throw conflict();

    // 2) Resto de escrituras en la misma transacción (todo o nada).
    const attempt = await repo.createAttempt(tx, {
      activityId: activity.id,
      topicId: topic.id,
      selectedOption: option.key,
      isCorrect: option.isCorrect,
    });
    if (result.completedTopicIndex !== null) await repo.createCompletion(tx, topic.id);

    return {
      attempt: {
        id: attempt.id,
        activityCode: activity.code,
        selectedOption: attempt.selectedOption,
        isCorrect: attempt.isCorrect,
        createdAt: attempt.createdAt.toISOString(),
      },
      step: await buildStep(tx, topics, result.next),
    };
  });
}

export async function continueTheory(): Promise<PublicStep> {
  return prisma.$transaction(async (tx) => {
    const { progress, topics, pos } = await loadContext(tx);
    const result = transition(pos, { type: 'CONTINUE_THEORY' }, topics.length);
    const topic = topics[result.next.topicIndex];
    if (!topic) throw internal('Transición inválida.');

    const updated = await repo.updateProgressIfVersion(tx, progress.version, {
      state: result.next.state,
      currentTopicId: topic.id,
    });
    if (updated === 0) throw conflict();
    return buildStep(tx, topics, result.next);
  });
}
