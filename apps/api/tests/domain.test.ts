import { describe, expect, it } from 'vitest';
import { DomainError } from '../src/domain/errors';
import { initialPosition, transition, type Position } from '../src/domain/learning';

const N = 3;
const at = (state: Position['state'], topicIndex: number): Position => ({ state, topicIndex });
const answer = (p: Position, correct: boolean) => transition(p, { type: 'ANSWER', correct }, N);
const cont = (p: Position) => transition(p, { type: 'CONTINUE_THEORY' }, N);
const codeOf = (fn: () => unknown) => {
  try { fn(); } catch (e) { return e instanceof DomainError ? e.code : 'OTHER'; }
  return 'NO_ERROR';
};

describe('dominio: máquina de estados', () => {
  it('inicia en MAIN del primer tema', () => {
    expect(initialPosition()).toEqual({ state: 'MAIN', topicIndex: 0 });
  });
  it('MAIN + correcta completa el tema y avanza', () => {
    expect(answer(at('MAIN', 0), true)).toEqual({ next: at('MAIN', 1), completedTopicIndex: 0 });
  });
  it('MAIN + incorrecta va a THEORY sin completar', () => {
    expect(answer(at('MAIN', 0), false)).toEqual({ next: at('THEORY', 0), completedTopicIndex: null });
  });
  it('THEORY + continuar va a REINFORCEMENT', () => {
    expect(cont(at('THEORY', 1)).next).toEqual(at('REINFORCEMENT', 1));
  });
  it('REINFORCEMENT + correcta completa y avanza', () => {
    expect(answer(at('REINFORCEMENT', 0), true)).toEqual({ next: at('MAIN', 1), completedTopicIndex: 0 });
  });
  it('REINFORCEMENT + incorrecta vuelve a THEORY', () => {
    expect(answer(at('REINFORCEMENT', 0), false).next).toEqual(at('THEORY', 0));
  });
  it('el ciclo teoría-refuerzo puede repetirse indefinidamente', () => {
    let p = answer(at('MAIN', 0), false).next;
    for (let i = 0; i < 5; i++) {
      p = cont(p).next;
      expect(p.state).toBe('REINFORCEMENT');
      p = answer(p, false).next;
      expect(p.state).toBe('THEORY');
    }
  });
  it('avanza del tema 1 al 2 y del 2 al 3', () => {
    expect(answer(at('MAIN', 0), true).next).toEqual(at('MAIN', 1));
    expect(answer(at('MAIN', 1), true).next).toEqual(at('MAIN', 2));
  });
  it('finaliza tras el último tema (desde MAIN y desde REINFORCEMENT)', () => {
    expect(answer(at('MAIN', 2), true)).toEqual({ next: at('COMPLETED', 2), completedTopicIndex: 2 });
    expect(answer(at('REINFORCEMENT', 2), true).next.state).toBe('COMPLETED');
  });
  it('prohíbe responder o continuar tras COMPLETED', () => {
    expect(codeOf(() => answer(at('COMPLETED', 2), true))).toBe('COURSE_COMPLETED');
    expect(codeOf(() => cont(at('COMPLETED', 2)))).toBe('COURSE_COMPLETED');
  });
  it('rechaza transiciones ilegales', () => {
    expect(codeOf(() => answer(at('THEORY', 0), true))).toBe('THEORY_REQUIRED');
    expect(codeOf(() => cont(at('MAIN', 0)))).toBe('THEORY_NOT_PENDING');
    expect(codeOf(() => cont(at('REINFORCEMENT', 0)))).toBe('THEORY_NOT_PENDING');
    expect(codeOf(() => answer(at('MAIN', 7), true))).toBe('INVALID_TOPIC_INDEX');
  });
});
