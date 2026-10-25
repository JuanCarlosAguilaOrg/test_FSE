import type { ActivityType } from '@prisma/client';

interface OptionSeed { key: string; text: string; correct?: true }
interface ActivitySeed { code: string; type: ActivityType; prompt: string; options: OptionSeed[] }
interface TopicSeed { code: string; title: string; order: number; theory: string; activities: ActivitySeed[] }

export const COURSE: TopicSeed[] = [
  {
    code: 'ALGEBRA_OPERATIONS',
    title: 'Operaciones algebraicas',
    order: 1,
    theory:
      'El objetivo es despejar x. Para aislar la variable, resta 4 en ambos lados:\n\nx + 4 - 4 = 9 - 4\n\nPor tanto:\n\nx = 5',
    activities: [
      { code: 'A1', type: 'MAIN', prompt: 'x + 4 = 9', options: [
        { key: 'a', text: '3' }, { key: 'b', text: '5', correct: true }, { key: 'c', text: '13' } ] },
      { code: 'R1', type: 'REINFORCEMENT', prompt: '3x = 12', options: [
        { key: 'a', text: '4', correct: true }, { key: 'b', text: '9' }, { key: 'c', text: '36' } ] },
    ],
  },
  {
    code: 'LINEAR_EQUATIONS',
    title: 'Ecuaciones lineales',
    order: 2,
    theory:
      'Una ecuación de varios pasos se resuelve realizando operaciones inversas en ambos lados.\n\nPrimero resta 3:\n\n2x = 8\n\nDespués divide entre 2:\n\nx = 4',
    activities: [
      { code: 'A2', type: 'MAIN', prompt: '2x + 3 = 11', options: [
        { key: 'a', text: '7' }, { key: 'b', text: '4', correct: true }, { key: 'c', text: '5' } ] },
      { code: 'R2', type: 'REINFORCEMENT', prompt: '5x - 7 = 8', options: [
        { key: 'a', text: '1' }, { key: 'b', text: '3', correct: true }, { key: 'c', text: '5' } ] },
    ],
  },
  {
    code: 'QUADRATIC_EQUATIONS',
    title: 'Ecuaciones cuadráticas',
    order: 3,
    theory:
      'Se puede factorizar la ecuación buscando dos números que multiplicados den 6 y sumados den -5.\n\nEsos números son -2 y -3. Por tanto:\n\n(x - 2)(x - 3) = 0\n\nLas soluciones son:\n\nx = 2 o x = 3.',
    activities: [
      { code: 'A3', type: 'MAIN', prompt: 'x² - 5x + 6 = 0', options: [
        { key: 'a', text: 'x = 2, x = 3', correct: true }, { key: 'b', text: 'x = 1, x = 6' }, { key: 'c', text: 'x = -2, x = -3' } ] },
      { code: 'R3', type: 'REINFORCEMENT', prompt: 'x² - 9 = 0', options: [
        { key: 'a', text: 'x = 3 únicamente' }, { key: 'b', text: 'x = -3, x = 3', correct: true }, { key: 'c', text: 'x = -9, x = 9' } ] },
    ],
  },
];
