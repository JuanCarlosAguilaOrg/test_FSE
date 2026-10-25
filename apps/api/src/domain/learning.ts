import { DomainError } from './errors';

export type LearningState = 'MAIN' | 'THEORY' | 'REINFORCEMENT' | 'COMPLETED';
export type ActivityKind = 'MAIN' | 'REINFORCEMENT';

/** topicIndex es 0-based dentro del recorrido ordenado. */
export interface Position {
  state: LearningState;
  topicIndex: number;
}

export type LearningEvent =
  | { type: 'ANSWER'; correct: boolean }
  | { type: 'CONTINUE_THEORY' };

export interface Transition {
  next: Position;
  /** Índice del tema que queda completado por esta transición, si aplica. */
  completedTopicIndex: number | null;
}

export const initialPosition = (): Position => ({ state: 'MAIN', topicIndex: 0 });

/**
 * Tipo de actividad que el estado autoriza responder.
 * Lanza error de dominio si en este estado no se puede responder.
 */
export function answerableKind(state: LearningState): ActivityKind {
  switch (state) {
    case 'MAIN':
    case 'REINFORCEMENT':
      return state;
    case 'THEORY':
      throw new DomainError('THEORY_REQUIRED', 'Debes revisar la teoría antes de continuar.');
    case 'COMPLETED':
      throw new DomainError('COURSE_COMPLETED', 'El curso ya fue completado.');
  }
}

/** Única fuente de verdad de las transiciones del recorrido. */
export function transition(pos: Position, event: LearningEvent, totalTopics: number): Transition {
  if (pos.topicIndex < 0 || pos.topicIndex >= totalTopics) {
    throw new DomainError('INVALID_TOPIC_INDEX', 'Tema fuera del recorrido.');
  }

  if (event.type === 'CONTINUE_THEORY') {
    if (pos.state === 'COMPLETED') {
      throw new DomainError('COURSE_COMPLETED', 'El curso ya fue completado.');
    }
    if (pos.state !== 'THEORY') {
      throw new DomainError('THEORY_NOT_PENDING', 'No hay teoría pendiente en el paso actual.');
    }
    return { next: { state: 'REINFORCEMENT', topicIndex: pos.topicIndex }, completedTopicIndex: null };
  }

  answerableKind(pos.state); // rechaza THEORY y COMPLETED

  if (!event.correct) {
    return { next: { state: 'THEORY', topicIndex: pos.topicIndex }, completedTopicIndex: null };
  }

  const isLast = pos.topicIndex === totalTopics - 1;
  return {
    next: isLast
      ? { state: 'COMPLETED', topicIndex: pos.topicIndex }
      : { state: 'MAIN', topicIndex: pos.topicIndex + 1 },
    completedTopicIndex: pos.topicIndex,
  };
}
