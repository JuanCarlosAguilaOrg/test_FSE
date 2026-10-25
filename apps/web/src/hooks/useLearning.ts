import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import type { AttemptRecord, ProgressSummary, PublicStep } from '../types/api';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; step: PublicStep; progress: ProgressSummary; attempts: AttemptRecord[] };

export interface Feedback { kind: 'success' | 'error' | 'info'; text: string }

const messageOf = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.';

export function useLearning() {
  const [data, setData] = useState<Load>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Siempre reconstruye desde el servidor; nunca inventa un estado por defecto.
  const load = useCallback(async () => {
    try {
      const [step, progress, attempts] = await Promise.all([api.current(), api.progress(), api.attempts()]);
      setData({ status: 'ready', step, progress, attempts });
    } catch (e) {
      setData({ status: 'error', message: messageOf(e) });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (activityCode: string, option: string) => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await api.submit(activityCode, option);
      const next = result.step;
      setFeedback(
        result.attempt.isCorrect
          ? { kind: 'success', text: next.completed ? '¡Correcto! Terminaste el curso.' : '¡Correcto! Tema completado.' }
          : { kind: 'error', text: 'Respuesta incorrecta. Revisa la teoría antes de continuar.' },
      );
      await load();
    } catch (e) {
      setFeedback({ kind: 'error', text: messageOf(e) });
      if (e instanceof ApiError && e.status === 409) await load(); // re-sincroniza con el servidor
    } finally {
      setBusy(false);
    }
  }, [busy, load]);

  const continueTheory = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api.continueTheory();
      setFeedback({ kind: 'info', text: 'Ahora resuelve la actividad de refuerzo.' });
      await load();
    } catch (e) {
      setFeedback({ kind: 'error', text: messageOf(e) });
      if (e instanceof ApiError && e.status === 409) await load();
    } finally {
      setBusy(false);
    }
  }, [busy, load]);

  return { data, busy, feedback, reload: load, submit, continueTheory };
}
