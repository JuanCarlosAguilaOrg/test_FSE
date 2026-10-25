import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db';
import { seedCourse } from '../../../prisma/seedCourse';

const app = createApp();
const answer = (activityCode: string, selectedOption: string) =>
  request(app).post('/api/learning/attempts').send({ activityCode, selectedOption });
const current = () => request(app).get('/api/learning/current');
const cont = () => request(app).post('/api/learning/theory/continue');

beforeAll(async () => {
  if (!/_test(\?|$)/.test(process.env.DATABASE_URL ?? '')) throw new Error('Los tests exigen una base *_test');
  await seedCourse(prisma);
});
beforeEach(async () => {
  await prisma.$transaction([prisma.attempt.deleteMany(), prisma.topicCompletion.deleteMany()]);
  const first = await prisma.topic.findFirstOrThrow({ orderBy: { order: 'asc' } });
  await prisma.learningProgress.update({
    where: { id: 'main' },
    data: { state: 'MAIN', currentTopicId: first.id, version: 0 },
  });
});
afterAll(() => prisma.$disconnect());

describe('lectura', () => {
  it('current: empieza en MAIN/A1 y no expone la respuesta correcta', async () => {
    const res = await current();
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('MAIN');
    expect(res.body.activity.code).toBe('A1');
    expect(res.body.activity.options).toEqual([
      { key: 'a', text: '3' }, { key: 'b', text: '5' }, { key: 'c', text: '13' },
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/isCorrect|correct/i);
  });
  it('progress inicial: 0%', async () => {
    const res = await request(app).get('/api/learning/progress');
    expect(res.body).toMatchObject({ completedCount: 0, totalTopics: 3, percent: 0, courseCompleted: false });
  });
  it('attempts inicial vacío', async () => {
    const res = await request(app).get('/api/learning/attempts');
    expect(res.body).toEqual({ attempts: [] });
  });
});

describe('respuestas', () => {
  it('correcta: avanza al tema 2, persiste intento y finalización', async () => {
    const res = await answer('A1', 'b');
    expect(res.status).toBe(201);
    expect(res.body.attempt.isCorrect).toBe(true);
    expect(res.body.step).toMatchObject({ state: 'MAIN', topic: { code: 'LINEAR_EQUATIONS', position: 2 } });
    expect(await prisma.attempt.count()).toBe(1);
    expect(await prisma.topicCompletion.count()).toBe(1);
    const progress = await request(app).get('/api/learning/progress');
    expect(progress.body).toMatchObject({ completedCount: 1, percent: 33 });
  });
  it('incorrecta: va a THEORY, muestra teoría y no completa', async () => {
    const res = await answer('A1', 'a');
    expect(res.status).toBe(201);
    expect(res.body.attempt.isCorrect).toBe(false);
    expect(res.body.step.state).toBe('THEORY');
    expect(res.body.step.theory.content).toContain('x = 5');
    expect(res.body.step.activity).toBeUndefined();
    expect(await prisma.topicCompletion.count()).toBe(0);
  });
  it('opción inexistente: 400 INVALID_OPTION y no registra intento', async () => {
    const res = await answer('A1', 'z');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OPTION');
    expect(await prisma.attempt.count()).toBe(0);
  });
  it('actividad inexistente: 404', async () => {
    const res = await answer('X9', 'a');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ACTIVITY_NOT_FOUND');
  });
  it('actividad fuera de orden: 409', async () => {
    for (const code of ['A2', 'R1', 'A3']) {
      const res = await answer(code, 'a');
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ACTIVITY_NOT_CURRENT');
    }
    expect(await prisma.attempt.count()).toBe(0);
  });
  it('cuerpo inválido: 400 con formato de error', async () => {
    const res = await request(app).post('/api/learning/attempts').send({ activityCode: 'A1', isCorrect: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.error.message).toBe('string');
    const bad = await request(app).post('/api/learning/attempts').set('Content-Type', 'application/json').send('{x');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_JSON');
  });
  it('ruta desconocida: 404 con formato de error', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('teoría y refuerzo', () => {
  it('no se puede responder mientras la teoría es obligatoria', async () => {
    await answer('A1', 'a');
    for (const code of ['A1', 'R1']) {
      const res = await answer(code, 'a');
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('THEORY_REQUIRED');
    }
  });
  it('continuar desde un estado incorrecto: 409', async () => {
    const res = await cont();
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('THEORY_NOT_PENDING');
  });
  it('ciclo completo: refuerzo incorrecto vuelve a teoría; correcto completa el tema una vez', async () => {
    await answer('A1', 'a');
    expect((await cont()).body.step.state).toBe('REINFORCEMENT');
    expect((await answer('R1', 'b')).body.step.state).toBe('THEORY');
    await cont();
    const ok = await answer('R1', 'a');
    expect(ok.body.step).toMatchObject({ state: 'MAIN', topic: { code: 'LINEAR_EQUATIONS' } });
    expect(await prisma.topicCompletion.count()).toBe(1);
    expect(await prisma.attempt.count()).toBe(3);
  });
});

describe('finalización, persistencia y consistencia', () => {
  it('completa el curso y rechaza más respuestas', async () => {
    for (const [c, o] of [['A1', 'b'], ['A2', 'b'], ['A3', 'a']] as const) {
      expect((await answer(c, o)).status).toBe(201);
    }
    const step = await current();
    expect(step.body).toMatchObject({ state: 'COMPLETED', completed: true });
    const progress = await request(app).get('/api/learning/progress');
    expect(progress.body).toMatchObject({ completedCount: 3, percent: 100, courseCompleted: true });
    const again = await answer('A3', 'a');
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('COURSE_COMPLETED');
    expect((await cont()).status).toBe(409);
  });
  it('el historial y el progreso persisten entre consultas y entre instancias de la app', async () => {
    await answer('A1', 'a');
    const fresh = createApp(); // simula reinicio del servidor: el estado viene de PostgreSQL
    const res = await request(fresh).get('/api/learning/current');
    expect(res.body.state).toBe('THEORY');
    const attempts = await request(fresh).get('/api/learning/attempts');
    expect(attempts.body.attempts[0]).toMatchObject({ activityCode: 'A1', selectedOption: 'a', isCorrect: false });
  });
  it('intento, transición y progreso son consistentes', async () => {
    await answer('A1', 'b');
    const [attempts, completions, progress] = await Promise.all([
      prisma.attempt.findMany(), prisma.topicCompletion.findMany(), prisma.learningProgress.findUniqueOrThrow({ where: { id: 'main' } }),
    ]);
    expect(attempts).toHaveLength(1);
    expect(completions).toHaveLength(1);
    expect(attempts[0]?.topicId).toBe(completions[0]?.topicId);
    expect(progress).toMatchObject({ state: 'MAIN', version: 1 });
    expect(progress.currentTopicId).not.toBe(completions[0]?.topicId);
  });
  it('dos respuestas simultáneas: solo una se aplica', async () => {
    const results = await Promise.all([answer('A1', 'b'), answer('A1', 'b')]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.topicCompletion.count()).toBe(1);
    expect(await prisma.attempt.count()).toBe(1);
  });
  it('health distingue API y base de datos', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok', api: 'up', database: 'up' });
  });
});

describe('seed', () => {
  it('es idempotente', async () => {
    const counts = async () => [await prisma.topic.count(), await prisma.activity.count(), await prisma.activityOption.count()];
    const before = await counts();
    await seedCourse(prisma);
    await seedCourse(prisma);
    expect(await counts()).toEqual(before);
    expect(before).toEqual([3, 6, 18]);
  });
});
