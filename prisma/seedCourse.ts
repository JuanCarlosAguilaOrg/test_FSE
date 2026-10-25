import type { PrismaClient } from '@prisma/client';
import { COURSE } from './content';

export const PROGRESS_ID = 'main';

/** Idempotente: todo se hace con upsert sobre claves únicas estables. */
export async function seedCourse(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    let firstTopicId: number | null = null;

    for (const t of COURSE) {
      const topic = await tx.topic.upsert({
        where: { code: t.code },
        create: { code: t.code, title: t.title, order: t.order },
        update: { title: t.title, order: t.order },
      });
      if (t.order === 1) firstTopicId = topic.id;

      await tx.theoryContent.upsert({
        where: { topicId: topic.id },
        create: { topicId: topic.id, content: t.theory },
        update: { content: t.theory },
      });

      for (const a of t.activities) {
        const activity = await tx.activity.upsert({
          where: { code: a.code },
          create: { code: a.code, topicId: topic.id, type: a.type, prompt: a.prompt },
          update: { topicId: topic.id, type: a.type, prompt: a.prompt },
        });
        for (const o of a.options) {
          await tx.activityOption.upsert({
            where: { activityId_key: { activityId: activity.id, key: o.key } },
            create: { activityId: activity.id, key: o.key, text: o.text, isCorrect: o.correct === true },
            update: { text: o.text, isCorrect: o.correct === true },
          });
        }
      }
    }

    if (firstTopicId === null) throw new Error('El contenido no define el tema 1');

    // update vacío: re-ejecutar el seed jamás reinicia el progreso existente.
    await tx.learningProgress.upsert({
      where: { id: PROGRESS_ID },
      create: { id: PROGRESS_ID, state: 'MAIN', currentTopicId: firstTopicId },
      update: {},
    });
  });
}
