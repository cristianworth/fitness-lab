import { useState } from 'react';
import { Check, ChevronDown, History as HistoryIcon } from 'lucide-react';
import type { PageProps } from '../types';

const number = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
const dateLabel = (day: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`));

export default function History({ state }: PageProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState('');
  const [metric, setMetric] = useState<'load' | 'volume'>('load');
  const sessions = state.sessions
    .filter((session) => session.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
  const exercises = [
    ...new Map(
      sessions.flatMap((session) =>
        session.exercises
          .filter((item) => item.sets.some((set) => set.completed))
          .map((item) => [item.exerciseId, item.name] as const),
      ),
    ).entries(),
  ];
  const selectedId = exerciseId || exercises[0]?.[0] || '';
  const progression = sessions
    .slice()
    .reverse()
    .flatMap((session) => {
      const sets = session.exercises
        .filter((item) => item.exerciseId === selectedId)
        .flatMap((item) => item.sets.filter((set) => set.completed));
      if (!sets.length) return [];
      const known = sets.filter((set) => set.weight !== null && set.reps !== null);
      return [
        {
          id: session.id,
          day: session.day,
          name: session.routineName,
          load: known.length ? Math.max(...known.map((set) => set.weight!)) : null,
          volume: known.length
            ? known.reduce((sum, set) => sum + set.weight! * set.reps!, 0)
            : null,
          incomplete: known.length !== sets.length,
        },
      ];
    });
  const highest = Math.max(1, ...progression.map((point) => point[metric] ?? 0));
  const totalSets = sessions.reduce(
    (sum, session) =>
      sum +
      session.exercises.reduce(
        (count, item) => count + item.sets.filter((set) => set.completed).length,
        0,
      ),
    0,
  );
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <h1>Evolução</h1>
          <p>Compare cargas e consulte os treinos concluídos.</p>
        </div>
      </header>
      <div className="stats-grid history-stats">
        <div className="stat-card">
          <span>Treinos concluídos</span>
          <strong>{sessions.length}</strong>
          <p>Desde o primeiro registro</p>
        </div>
        <div className="stat-card">
          <span>Séries realizadas</span>
          <strong>{totalSets}</strong>
          <p>Apenas séries concluídas</p>
        </div>
        <div className="stat-card">
          <span>Último treino</span>
          <strong className="date-stat">
            {sessions[0] ? dateLabel(sessions[0].day) : 'Ainda por vir'}
          </strong>
          <p>{sessions[0]?.routineName ?? 'Seu próximo passo começa em Treinos'}</p>
        </div>
      </div>
      {!sessions.length ? (
        <div className="empty-state">
          <HistoryIcon size={32} />
          <h2>Nenhum treino concluído</h2>
          <p>Conclua seu primeiro treino para acompanhar seus registros e sua evolução aqui.</p>
        </div>
      ) : (
        <>
          <section className="card">
            <div className="section-title">
              <div>
                <h2>Evolução por exercício</h2>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Exercício</span>
                <select value={selectedId} onChange={(e) => setExerciseId(e.target.value)}>
                  {exercises.map(([id, name]) => (
                    <option value={id} key={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>O que observar</span>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as 'load' | 'volume')}
                >
                  <option value="load">Maior carga externa (kg)</option>
                  <option value="volume">Volume de carga externa (kg × rep.)</option>
                </select>
              </label>
            </div>
            <p className="muted small">
              Somente séries feitas em treinos concluídos. Volume = carga externa × repetições. O
              peso do corpo não é estimado.
            </p>
            <div className="progression-list" aria-label="Evolução cronológica do exercício">
              {progression.map((point) => (
                <div className="progression-row" key={point.id}>
                  <div>
                    <strong>{dateLabel(point.day)}</strong>
                    <span>{point.name}</span>
                  </div>
                  <div className="microbar">
                    <span style={{ width: `${((point[metric] ?? 0) / highest) * 100}%` }} />
                  </div>
                  <strong>
                    {point[metric] === null ? '—' : number(point[metric]!)}{' '}
                    <small>
                      {metric === 'load' ? 'kg' : 'kg × rep.'}
                      {point.incomplete ? ' (parcial)' : ''}
                    </small>
                  </strong>
                </div>
              ))}
            </div>
            {progression.some((point) => point.incomplete) && (
              <p className="notice">
                Há séries com carga ou repetições desconhecidas. Valores parciais consideram apenas
                os registros conhecidos.
              </p>
            )}
          </section>
          <div className="section-title">
            <h2>Treinos concluídos</h2>
            <span className="muted small">Mais recentes primeiro</span>
          </div>
          <div className="page-stack compact">
            {sessions.map((session) => {
              const done = session.exercises.reduce(
                (sum, item) => sum + item.sets.filter((set) => set.completed).length,
                0,
              );
              const open = expanded === session.id;
              return (
                <article className="card history-card" key={session.id}>
                  <button
                    className="history-toggle"
                    onClick={() => setExpanded(open ? null : session.id)}
                    aria-expanded={open}
                    aria-controls={`session-${session.id}`}
                  >
                    <div className="history-check">
                      <Check size={21} />
                    </div>
                    <div className="grow">
                      <span className="eyebrow">{dateLabel(session.day)}</span>
                      <h2>{session.routineName}</h2>
                      <p>
                        {session.exercises.length} exercícios · {done} séries feitas
                      </p>
                    </div>
                    <ChevronDown size={21} className={open ? 'rotated' : ''} />
                  </button>
                  {open && (
                    <div className="session-details" id={`session-${session.id}`}>
                      <p className="muted small">
                        Concluído às{' '}
                        {new Intl.DateTimeFormat('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: state.timezone,
                        }).format(new Date(session.completedAt!))}
                        . Nomes e planejamento preservados desta sessão.
                      </p>
                      {session.exercises.map((item, index) => (
                        <div className="history-exercise" key={index}>
                          <h3>
                            {item.name}
                            <span>
                              {item.bodyweight ? 'Peso corporal · carga extra' : item.muscleGroup}
                            </span>
                          </h3>
                          <p className="planned-label">
                            Planejado: {item.plannedSets} séries × {item.plannedReps} repetições
                          </p>
                          <div className="table-scroll">
                            <table>
                              <thead>
                                <tr>
                                  <th>Série</th>
                                  <th>Repetições</th>
                                  <th>Carga externa</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.sets.map((set, i) => (
                                  <tr key={set.id}>
                                    <td>{i + 1}</td>
                                    <td>{set.reps === null ? '—' : set.reps}</td>
                                    <td>
                                      {set.weight === null ? '—' : `${number(set.weight)} kg`}
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${set.completed ? 'success-badge' : ''}`}
                                      >
                                        {set.completed ? 'Feita' : 'Não feita'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
