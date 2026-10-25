import type { AttemptRecord, ProgressSummary } from '../types/api';

export function ProgressPanel({ progress, stateLabel }: { progress: ProgressSummary; stateLabel: string }) {
  return (
    <section aria-labelledby="progress-h">
      <h2 id="progress-h">Progreso</h2>
      <progress max={100} value={progress.percent} aria-label="Progreso del curso" />
      <p>
        {progress.completedCount} de {progress.totalTopics} temas completados ({progress.percent}%)
      </p>
      <p>
        Tema actual: <strong>{progress.currentTopic.title}</strong> ({progress.currentTopic.position} de {progress.totalTopics})
      </p>
      <p>Estado: <strong>{stateLabel}</strong></p>
    </section>
  );
}

export function AttemptHistory({ attempts }: { attempts: AttemptRecord[] }) {
  return (
    <section aria-labelledby="history-h">
      <h2 id="history-h">Historial de intentos</h2>
      {attempts.length === 0 ? (
        <p>Aún no hay intentos.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Fecha</th><th>Actividad</th><th>Opción</th><th>Resultado</th></tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>{a.activityCode}</td>
                <td>{a.selectedOption}</td>
                <td>{a.isCorrect ? 'Correcto' : 'Incorrecto'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
