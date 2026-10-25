import type { AttemptRecord, AttemptResult, ProgressSummary, PublicStep } from '../types/api';

export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
  }
}

const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor.', 0);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(err?.code ?? 'UNKNOWN', err?.message ?? 'Ocurrió un error inesperado.', res.status);
  }
  return body as T;
}

export const api = {
  current: () => request<PublicStep>('/learning/current'),
  progress: () => request<ProgressSummary>('/learning/progress'),
  attempts: () => request<{ attempts: AttemptRecord[] }>('/learning/attempts').then((r) => r.attempts),
  submit: (activityCode: string, selectedOption: string) =>
    request<AttemptResult>('/learning/attempts', {
      method: 'POST',
      body: JSON.stringify({ activityCode, selectedOption }),
    }),
  continueTheory: () =>
    request<{ step: PublicStep }>('/learning/theory/continue', { method: 'POST' }).then((r) => r.step),
};
