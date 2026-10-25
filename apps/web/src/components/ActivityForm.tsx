import { useState } from 'react';
import type { PublicStep } from '../types/api';

interface Props {
  activity: NonNullable<PublicStep['activity']>;
  busy: boolean;
  onSubmit: (activityCode: string, option: string) => void;
}

export function ActivityForm({ activity, busy, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const title = activity.type === 'MAIN' ? 'Actividad principal' : 'Actividad de refuerzo';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (selected && !busy) onSubmit(activity.code, selected);
      }}
    >
      <fieldset disabled={busy}>
        <legend>{title}: resuelve</legend>
        <p className="prompt">{activity.prompt}</p>
        {activity.options.map((o) => (
          <label key={o.key} className="option">
            <input
              type="radio"
              name={activity.code}
              value={o.key}
              checked={selected === o.key}
              onChange={() => setSelected(o.key)}
            />
            <span>{o.key}) {o.text}</span>
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={!selected || busy}>
        {busy ? 'Enviando…' : 'Enviar respuesta'}
      </button>
    </form>
  );
}
