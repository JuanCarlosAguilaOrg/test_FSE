import { ActivityForm } from './components/ActivityForm';
import { AttemptHistory, ProgressPanel } from './components/Panels';
import { useLearning } from './hooks/useLearning';
import type { LearningState } from './types/api';

const STATE_LABEL: Record<LearningState, string> = {
  MAIN: 'Actividad principal',
  THEORY: 'Teoría',
  REINFORCEMENT: 'Refuerzo',
  COMPLETED: 'Curso completado',
};

export default function App() {
  const { data, busy, feedback, reload, submit, continueTheory } = useLearning();

  return (
    <main>
      <h1>Recorrido de matemáticas</h1>

      {data.status === 'loading' && <p role="status">Cargando tu progreso…</p>}

      {data.status === 'error' && (
        <div role="alert" className="banner error">
          <p>{data.message}</p>
          <button type="button" onClick={() => void reload()}>Reintentar</button>
        </div>
      )}

      {data.status === 'ready' && (
        <>
          <ProgressPanel progress={data.progress} stateLabel={STATE_LABEL[data.step.state]} />

          {feedback && (
            <p role="status" className={`banner ${feedback.kind}`}>{feedback.text}</p>
          )}

          <section aria-labelledby="step-h">
            <h2 id="step-h">{data.step.topic.title}</h2>

            {data.step.activity && (
              <ActivityForm
                key={data.step.activity.code}
                activity={data.step.activity}
                busy={busy}
                onSubmit={(code, option) => void submit(code, option)}
              />
            )}

            {data.step.theory && (
              <div>
                <h3>Teoría</h3>
                <p className="theory">{data.step.theory.content}</p>
                <button type="button" disabled={busy} onClick={() => void continueTheory()}>
                  {busy ? 'Procesando…' : 'Continuar al refuerzo'}
                </button>
              </div>
            )}

            {data.step.completed && (
              <p className="banner success">
                ¡Felicidades! Completaste los {data.progress.totalTopics} temas ({data.progress.percent}%).
              </p>
            )}
          </section>

          <AttemptHistory attempts={data.attempts} />
        </>
      )}
    </main>
  );
}
