import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Dumbbell, Pencil, Play, Plus, Save, X } from 'lucide-react';
import type { Command, Exercise, PageProps, Routine, RoutineItem, WorkoutSet } from '../types';

const blankExercise = (): Exercise => ({
  id: crypto.randomUUID(),
  name: '',
  muscleGroup: '',
  bodyweight: false,
});
const blankRoutine = (): Routine => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  exercises: [],
});
const numberValue = (value: string) => (value === '' ? null : Number(value));

function SetRow({
  set,
  index,
  bodyweight,
  disabled,
  save,
  onDirty,
}: {
  set: WorkoutSet;
  index: number;
  bodyweight: boolean;
  disabled: boolean;
  save: (set: WorkoutSet) => Promise<boolean>;
  onDirty: (dirty: boolean) => void;
}) {
  const [reps, setReps] = useState(set.reps?.toString() ?? '');
  const [weight, setWeight] = useState(set.weight?.toString() ?? '');
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const savedVersion = useRef(JSON.stringify(set));
  useEffect(() => {
    const incomingVersion = JSON.stringify(set);
    if (incomingVersion !== savedVersion.current) {
      if (dirty && !lock.current) setConflict(true);
      savedVersion.current = incomingVersion;
    }
    if (!dirty) {
      setReps(set.reps?.toString() ?? '');
      setWeight(set.weight?.toString() ?? '');
    }
  }, [set, dirty]);
  async function persist(completed: boolean) {
    if (lock.current || disabled || conflict) return;
    lock.current = true;
    setPending(true);
    try {
      if (await save({ ...set, reps: numberValue(reps), weight: numberValue(weight), completed })) {
        setDirty(false);
        onDirty(false);
      }
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <form
      className={`set-row ${set.completed ? 'is-completed' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        void persist(true);
      }}
    >
      <span className="set-number" aria-label={`Série ${index + 1}`}>
        {index + 1}
      </span>
      <label className="field">
        <span>Repetições</span>
        <input
          aria-label={`Repetições da série ${index + 1}`}
          type="number"
          min="1"
          max="1000"
          step="1"
          required
          value={reps}
          disabled={disabled || pending}
          onChange={(e) => {
            setReps(e.target.value);
            setDirty(true);
            onDirty(true);
          }}
          placeholder="—"
        />
      </label>
      <label className="field">
        <span>{bodyweight ? 'Carga extra (kg)' : 'Carga (kg)'}</span>
        <input
          aria-label={`Carga em kg da série ${index + 1}`}
          type="number"
          min="0"
          max="2000"
          step="any"
          required
          value={weight}
          disabled={disabled || pending}
          onChange={(e) => {
            setWeight(e.target.value);
            setDirty(true);
            onDirty(true);
          }}
          placeholder={bodyweight ? '0 sem carga extra' : '—'}
        />
      </label>
      <div className="set-actions">
        <button
          className={`button ${set.completed && !dirty ? 'completed-button' : 'primary'}`}
          disabled={disabled || pending || conflict}
          type="submit"
        >
          <Check size={17} />
          {set.completed && !dirty ? 'Feita' : 'Concluir'}
        </button>
        <button
          className="icon-button"
          type="button"
          disabled={disabled || pending || conflict}
          title="Salvar valores sem concluir a série"
          aria-label={`Salvar rascunho da série ${index + 1}`}
          onClick={() => void persist(false)}
        >
          <Save size={18} />
        </button>
      </div>
      {conflict ? (
        <div className="set-conflict notice" role="alert">
          <span>
            Esta série mudou em outra aba. Seus valores digitados foram preservados. Revise-os antes
            de carregar o registro salvo.
          </span>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setReps(set.reps?.toString() ?? '');
              setWeight(set.weight?.toString() ?? '');
              setDirty(false);
              setConflict(false);
              onDirty(false);
            }}
          >
            Carregar registro salvo
          </button>
        </div>
      ) : (
        dirty && <span className="set-unsaved">Alterações ainda não salvas</span>
      )}
    </form>
  );
}

export default function Workouts({ state, dispatch, busy }: PageProps) {
  const [tab, setTab] = useState<'sessions' | 'routines' | 'exercises'>('sessions');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [pending, setPending] = useState(false);
  const [unsaved, setUnsaved] = useState<Set<string>>(new Set());
  const [externalNotice, setExternalNotice] = useState('');
  const lock = useRef(false);
  const startId = useRef<{ routineId: string; id: string; now: string } | null>(null);
  const addIds = useRef<Record<string, string>>({});
  const active = state.sessions.find((session) => !session.completedAt);
  const previousActiveId = useRef(active?.id);
  const disabled = busy || pending;
  useEffect(() => {
    if (previousActiveId.current !== active?.id && unsaved.size > 0) {
      setUnsaved(new Set());
      setExternalNotice(
        'O treino foi encerrado ou substituído em outra aba. Seus rascunhos locais não salvos não foram incluídos. Confira o histórico antes de continuar.',
      );
    }
    previousActiveId.current = active?.id;
  }, [active?.id, unsaved.size]);
  useEffect(() => {
    if (!unsaved.size) return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventLoss);
    const protectNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('.nav-link, .brand, .mobile-brand, [data-leave-workout]')
      ) {
        event.preventDefault();
        event.stopPropagation();
        document
          .getElementById('unsaved-workout-notice')
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
    document.addEventListener('click', protectNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', preventLoss);
      document.removeEventListener('click', protectNavigation, true);
    };
  }, [unsaved.size]);
  async function execute(command: Command) {
    if (lock.current || busy) return false;
    lock.current = true;
    setPending(true);
    try {
      return await dispatch(command);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  async function start(routineId: string) {
    if (!startId.current || startId.current.routineId !== routineId)
      startId.current = { routineId, id: crypto.randomUUID(), now: new Date().toISOString() };
    if (await execute({ type: 'startSession', ...startId.current })) {
      startId.current = null;
      setTab('sessions');
    }
  }
  async function addSet(exerciseIndex: number) {
    if (!active) return;
    const key = `${active.id}:${exerciseIndex}`;
    const id = (addIds.current[key] ??= crypto.randomUUID());
    if (await execute({ type: 'addSet', sessionId: active.id, exerciseIndex, id }))
      delete addIds.current[key];
  }
  function updateItem(index: number, patch: Partial<RoutineItem>) {
    setRoutine(
      (current) =>
        current && {
          ...current,
          exercises: current.exercises.map((item, i) =>
            i === index ? { ...item, ...patch } : item,
          ),
        },
    );
  }
  return (
    <div className="page-stack">
      {externalNotice && (
        <div className="notice" role="alert">
          <span className="grow">{externalNotice}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar aviso de atualização externa"
            onClick={() => setExternalNotice('')}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <header className="page-heading">
        <div>
          <h1>Treinos</h1>
          <p>Organize as rotinas e registre suas séries.</p>
        </div>
      </header>
      <div className="tabs" aria-label="Áreas de treino">
        {(
          [
            ['sessions', 'Treinar'],
            ['routines', 'Rotinas'],
            ['exercises', 'Exercícios'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? 'tab active' : 'tab'}
            aria-pressed={tab === value}
            disabled={unsaved.size > 0 && value !== tab}
            onClick={() => setTab(value)}
          >
            {label}
            {value === 'sessions' && active && <span className="status-dot" />}
          </button>
        ))}
      </div>
      {tab === 'sessions' &&
        (active ? (
          <>
            <section className="active-banner">
              <div>
                <span className="badge light">
                  <span className="status-dot" /> Em andamento
                </span>
                <h2>{active.routineName}</h2>
                <p>
                  Iniciado às{' '}
                  {new Intl.DateTimeFormat('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: state.timezone,
                  }).format(new Date(active.startedAt))}{' '}
                  · Seus registros salvos ficam neste dispositivo.
                </p>
              </div>
              <div className="active-progress">
                <strong>
                  {active.exercises.reduce(
                    (sum, item) => sum + item.sets.filter((set) => set.completed).length,
                    0,
                  )}
                </strong>
                <span>séries feitas</span>
              </div>
            </section>
            <p className="muted small">
              Preencha cada série e toque em Concluir. O ícone de salvar guarda um rascunho. Vazio
              significa desconhecido; 0 kg indica nenhuma carga externa.
            </p>
            {active.exercises.map((item, exerciseIndex) => (
              <section className="card exercise-card" key={`${active.id}-${exerciseIndex}`}>
                <div className="section-title">
                  <div>
                    <p className="eyebrow">Exercício {exerciseIndex + 1}</p>
                    <h2>{item.name}</h2>
                    <p>
                      {item.muscleGroup}
                      {item.bodyweight ? ' · Peso corporal' : ' · Carga externa'}
                    </p>
                    <p className="planned-label">
                      Planejado: {item.plannedSets} séries × {item.plannedReps} repetições
                    </p>
                  </div>
                  <span className="badge">
                    {item.sets.filter((set) => set.completed).length}/{item.sets.length}
                  </span>
                </div>
                <div className="sets-list">
                  {item.sets.map((set, index) => (
                    <SetRow
                      onDirty={(dirty) =>
                        setUnsaved((current) => {
                          const next = new Set(current);
                          if (dirty) next.add(`${exerciseIndex}:${set.id}`);
                          else next.delete(`${exerciseIndex}:${set.id}`);
                          return next;
                        })
                      }
                      key={set.id}
                      set={set}
                      index={index}
                      bodyweight={item.bodyweight}
                      disabled={disabled}
                      save={(updated) =>
                        execute({
                          type: 'saveSet',
                          sessionId: active.id,
                          exerciseIndex,
                          set: updated,
                        })
                      }
                    />
                  ))}
                </div>
                <button
                  className="button text-button"
                  disabled={disabled}
                  onClick={() => void addSet(exerciseIndex)}
                >
                  <Plus size={17} />
                  Adicionar série
                </button>
              </section>
            ))}
            {unsaved.size > 0 && (
              <p id="unsaved-workout-notice" className="notice" role="status">
                Há séries com alterações não salvas. Salve o rascunho ou conclua cada série antes de
                sair ou finalizar.
              </p>
            )}
            <div className="finish-panel">
              <div>
                <strong>Terminou por hoje?</strong>
                <p>
                  Confira os registros antes de encerrar. Séries em rascunho não entram no histórico
                  de evolução.
                </p>
              </div>
              <button
                className="button primary"
                disabled={
                  disabled ||
                  unsaved.size > 0 ||
                  !active.exercises.some((item) => item.sets.some((set) => set.completed))
                }
                onClick={() =>
                  void execute({
                    type: 'finishSession',
                    sessionId: active.id,
                    now: new Date().toISOString(),
                  })
                }
              >
                <Check size={18} />
                Finalizar treino
              </button>
            </div>
          </>
        ) : (
          <>
            <section className="card intro-card">
              <div className="large-icon">
                <Dumbbell size={30} />
              </div>
              <h2>Prepare sua primeira rotina</h2>
              <p>
                Escolha uma rotina para começar. Cada sessão guarda uma cópia do seu planejamento.
              </p>
            </section>
            <div className="section-title">
              <h2>Escolha seu treino</h2>
              <button
                className="button secondary"
                onClick={() => {
                  setRoutine(blankRoutine());
                  setTab('routines');
                }}
              >
                <Plus size={17} />
                Nova rotina
              </button>
            </div>
            {state.routines.length === 0 ? (
              <div className="empty-state">
                <h3>Seu primeiro treino começa aqui</h3>
                <p>Cadastre exercícios e organize uma rotina na aba Rotinas.</p>
                <button
                  className="button primary"
                  onClick={() => {
                    setTab('exercises');
                    setExercise(blankExercise());
                  }}
                >
                  <Plus size={17} />
                  Cadastrar exercício
                </button>
              </div>
            ) : (
              <div className="routine-grid">
                {state.routines.map((item) => (
                  <article className="card routine-card" key={item.id}>
                    <div className="routine-symbol">
                      <Dumbbell size={24} />
                    </div>
                    <h2>{item.name}</h2>
                    <p>{item.description || 'Seu planejamento de treino'}</p>
                    <div className="routine-meta">
                      <span>{item.exercises.length} exercícios</span>
                      <span>
                        {item.exercises.reduce((sum, entry) => sum + entry.sets, 0)} séries
                      </span>
                    </div>
                    <button
                      className="button primary wide"
                      disabled={disabled}
                      onClick={() => void start(item.id)}
                    >
                      <Play size={17} />
                      Iniciar treino
                      <ChevronRight size={17} className="push-right" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        ))}
      {tab === 'exercises' && (
        <>
          <div className="section-title">
            <div>
              <h2>Biblioteca de exercícios</h2>
              <p>Os movimentos que fazem parte da sua rotina.</p>
            </div>
            <button
              className="button primary"
              disabled={disabled}
              onClick={() => setExercise(blankExercise())}
            >
              <Plus size={17} />
              Novo exercício
            </button>
          </div>
          {exercise && (
            <form
              className="card editor-card"
              onSubmit={async (event) => {
                event.preventDefault();
                if (await execute({ type: 'saveExercise', exercise })) setExercise(null);
              }}
            >
              <div className="section-title">
                <h2>
                  {state.exercises.some((item) => item.id === exercise.id)
                    ? 'Editar exercício'
                    : 'Novo exercício'}
                </h2>
                <button
                  className="icon-button"
                  aria-label="Fechar edição de exercício"
                  type="button"
                  onClick={() => setExercise(null)}
                  disabled={disabled}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Nome do exercício</span>
                  <input
                    required
                    maxLength={120}
                    value={exercise.name}
                    onChange={(e) => setExercise({ ...exercise, name: e.target.value })}
                    placeholder="Ex.: Agachamento"
                  />
                </label>
                <label className="field">
                  <span>Grupo muscular</span>
                  <input
                    required
                    maxLength={80}
                    value={exercise.muscleGroup}
                    onChange={(e) => setExercise({ ...exercise, muscleGroup: e.target.value })}
                    placeholder="Ex.: Pernas"
                  />
                </label>
              </div>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={exercise.bodyweight}
                  onChange={(e) => setExercise({ ...exercise, bodyweight: e.target.checked })}
                />
                <span>
                  Exercício com peso corporal
                  <small>A carga em kg representa apenas peso extra, quando houver.</small>
                </span>
              </label>
              <button className="button primary" disabled={disabled}>
                <Save size={17} />
                Salvar exercício
              </button>
            </form>
          )}
          {state.exercises.length === 0 ? (
            <div className="empty-state">
              <Dumbbell size={28} />
              <h3>Sua biblioteca está vazia</h3>
              <p>Adicione seu primeiro exercício para montar uma rotina.</p>
            </div>
          ) : (
            <div className="card list-card">
              {state.exercises.map((item) => (
                <div className="list-row" key={item.id}>
                  <div className="list-icon">
                    <Dumbbell size={20} />
                  </div>
                  <div className="grow">
                    <h3>{item.name}</h3>
                    <p>
                      {item.muscleGroup} · {item.bodyweight ? 'Peso corporal' : 'Carga externa'}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Editar ${item.name}`}
                    disabled={disabled}
                    onClick={() => setExercise({ ...item })}
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {tab === 'routines' && (
        <>
          <div className="section-title">
            <div>
              <h2>Suas rotinas</h2>
              <p>Uma estrutura simples para dar continuidade.</p>
            </div>
            <button
              className="button primary"
              disabled={disabled}
              onClick={() => setRoutine(blankRoutine())}
            >
              <Plus size={17} />
              Nova rotina
            </button>
          </div>
          {routine && (
            <form
              className="card editor-card"
              onSubmit={async (event) => {
                event.preventDefault();
                if (routine.exercises.length && (await execute({ type: 'saveRoutine', routine })))
                  setRoutine(null);
              }}
            >
              <div className="section-title">
                <h2>
                  {state.routines.some((item) => item.id === routine.id)
                    ? 'Editar rotina'
                    : 'Nova rotina'}
                </h2>
                <button
                  className="icon-button"
                  aria-label="Fechar edição de rotina"
                  type="button"
                  disabled={disabled}
                  onClick={() => setRoutine(null)}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Nome da rotina</span>
                  <input
                    required
                    maxLength={120}
                    value={routine.name}
                    onChange={(e) => setRoutine({ ...routine, name: e.target.value })}
                    placeholder="Ex.: Treino A — pernas"
                  />
                </label>
                <label className="field">
                  <span>Descrição (opcional)</span>
                  <input
                    maxLength={500}
                    value={routine.description}
                    onChange={(e) => setRoutine({ ...routine, description: e.target.value })}
                    placeholder="Um lembrete para você"
                  />
                </label>
              </div>
              <h3>Exercícios e planejamento</h3>
              <div className="routine-editor-list">
                {routine.exercises.map((item, index) => (
                  <div className="routine-editor-row" key={`${item.exerciseId}-${index}`}>
                    <span className="grow">
                      <strong>
                        {state.exercises.find((candidate) => candidate.id === item.exerciseId)
                          ?.name ?? 'Exercício'}
                      </strong>
                    </span>
                    <label className="field">
                      <span>Séries</span>
                      <input
                        type="number"
                        required
                        min="1"
                        max="30"
                        step="1"
                        value={item.sets || ''}
                        onChange={(e) => updateItem(index, { sets: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Repetições</span>
                      <input
                        type="number"
                        required
                        min="1"
                        max="1000"
                        step="1"
                        value={item.reps || ''}
                        onChange={(e) => updateItem(index, { reps: Number(e.target.value) })}
                      />
                    </label>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remover exercício ${index + 1} da rotina`}
                      onClick={() =>
                        setRoutine({
                          ...routine,
                          exercises: routine.exercises.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <label className="field">
                <span>Adicionar exercício</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value)
                      setRoutine({
                        ...routine,
                        exercises: [
                          ...routine.exercises,
                          { exerciseId: e.target.value, sets: 3, reps: 10 },
                        ],
                      });
                  }}
                >
                  <option value="">Selecione um exercício</option>
                  {state.exercises
                    .filter(
                      (item) => !routine.exercises.some((entry) => entry.exerciseId === item.id),
                    )
                    .map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </label>
              {state.exercises.length === 0 && (
                <p className="notice">
                  Cadastre um exercício na aba Exercícios antes de salvar sua rotina.
                </p>
              )}
              <button className="button primary" disabled={disabled || !routine.exercises.length}>
                <Save size={17} />
                Salvar rotina
              </button>
            </form>
          )}
          {state.routines.length === 0 ? (
            <div className="empty-state">
              <h3>Ainda sem rotinas</h3>
              <p>Agrupe exercícios, séries e repetições para facilitar o próximo treino.</p>
            </div>
          ) : (
            <div className="routine-grid">
              {state.routines.map((item) => (
                <article className="card routine-card" key={item.id}>
                  <div className="section-title">
                    <h2>{item.name}</h2>
                    <button
                      className="icon-button"
                      aria-label={`Editar ${item.name}`}
                      disabled={disabled}
                      onClick={() =>
                        setRoutine({
                          ...item,
                          exercises: item.exercises.map((entry) => ({ ...entry })),
                        })
                      }
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                  <p>{item.description || 'Sem descrição'}</p>
                  <ul className="routine-exercises">
                    {item.exercises.map((entry, index) => (
                      <li key={index}>
                        <span>
                          {state.exercises.find((candidate) => candidate.id === entry.exerciseId)
                            ?.name ?? 'Exercício'}
                        </span>
                        <small>
                          {entry.sets} × {entry.reps}
                        </small>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="button secondary wide"
                    disabled={disabled || !!active}
                    onClick={() => void start(item.id)}
                  >
                    <Play size={17} />
                    {active ? 'Há um treino em andamento' : 'Iniciar treino'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
