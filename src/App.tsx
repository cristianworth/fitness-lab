import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Database,
  Download,
  Dumbbell,
  Leaf,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Upload,
} from 'lucide-react';
import type { AppState, Command, PageProps } from './types';
import {
  createInitialState,
  dailyNutrients,
  dayInTimezone,
  MAX_BACKUP_BYTES,
  parseBackup,
  serializeBackup,
} from './domain';
import { execute, loadState, restoreState, restoreDemo, type DataMode } from './repository';
import { DEMO_DAY } from './demo';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import History from './pages/History';

type Page = 'today' | 'workouts' | 'nutrition' | 'history' | 'data';
const navigation = [
  { id: 'today' as const, label: 'Hoje', icon: LayoutDashboard },
  { id: 'workouts' as const, label: 'Treinos', icon: Dumbbell },
  { id: 'nutrition' as const, label: 'Alimentação', icon: Leaf },
  { id: 'history' as const, label: 'Evolução', icon: TrendingUp },
  { id: 'data' as const, label: 'Seus dados', icon: Database },
];
const number = (value: number | null, digits = 0) =>
  value === null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
const dateLabel = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function Today({ state, day, go }: { state: AppState; day: string; go: (page: Page) => void }) {
  const active = state.sessions.find((session) => !session.completedAt);
  const sessions = state.sessions.filter((session) => session.day === day && session.completedAt);
  const meals = state.meals.filter((meal) => meal.day === day);
  const nutrition = dailyNutrients(meals);
  const previewRoutine = state.routines[0];
  const previewExercises = active
    ? active.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.plannedSets,
        reps: exercise.plannedReps,
      }))
    : (previewRoutine?.exercises.map((item) => ({
        name: state.exercises.find((exercise) => exercise.id === item.exerciseId)!.name,
        sets: item.sets,
        reps: item.reps,
      })) ?? []);
  const sets = sessions
    .flatMap((session) => session.exercises.flatMap((exercise) => exercise.sets))
    .filter((set) => set.completed).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Hoje</h1>
          <p>Treino e alimentação, no mesmo diário.</p>
        </div>
        <span className="badge">
          <CalendarDays size={16} /> {dateLabel(day)}
        </span>
      </div>
      <section className="hero-card">
        <div className="hero-copy">
          <h2>{active ? 'Seu treino continua.' : 'Hora de treinar.'}</h2>
          <p>
            {active
              ? 'Suas séries estão salvas. Continue de onde parou.'
              : 'Escolha uma rotina. Anote a carga e as repetições de cada série.'}
          </p>
          <button className="button primary" onClick={() => go('workouts')}>
            {active
              ? 'Continuar treino'
              : state.routines.length
                ? 'Começar um treino'
                : 'Criar minha rotina'}
          </button>
        </div>
        <div className="training-preview">
          <p className="preview-label">{active ? 'Em andamento' : 'Na sua ficha'}</p>
          <h3>{active?.routineName ?? previewRoutine?.name ?? 'Sua primeira rotina'}</h3>
          {previewExercises.length ? (
            <>
              <ul className="preview-exercises">
                {previewExercises.slice(0, 4).map((exercise, index) => (
                  <li key={index}>
                    <span>{exercise.name}</span>
                    <strong aria-label={`${exercise.sets} séries de ${exercise.reps} repetições`}>
                      {exercise.sets} × {exercise.reps}
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="preview-label">
                Séries × repetições
                {previewExercises.length > 4
                  ? ` • mais ${previewExercises.length - 4} exercício(s) na rotina`
                  : ''}
              </p>
            </>
          ) : (
            <p>
              Cadastre os exercícios que você faz e organize as séries. Sua ficha aparecerá aqui.
            </p>
          )}
        </div>
      </section>
      <div className="section-title">
        <h2>Seu dia em números</h2>
        <span className="muted">Registros de hoje</span>
      </div>
      <section className="stats-grid" aria-label="Resumo do dia">
        <article className="stat-card">
          <span>Treinos concluídos</span>
          <strong>{sessions.length}</strong>
          <small>{sets} séries realizadas</small>
        </article>
        <article className="stat-card">
          <span>Energia registrada</span>
          <strong>
            {number(nutrition.totals.calories)} <small>kcal</small>
          </strong>
          <small>
            {nutrition.incomplete
              ? 'Total parcial · faltam informações'
              : meals.length
                ? 'Dos alimentos registrados'
                : 'Nenhuma refeição registrada'}
          </small>
        </article>
        <article className="stat-card">
          <span>Proteína registrada</span>
          <strong>
            {number(nutrition.totals.protein, 1)} <small>g</small>
          </strong>
          <small>
            {meals.length} {meals.length === 1 ? 'alimento registrado' : 'alimentos registrados'}
          </small>
        </article>
      </section>
      <div className="page-grid">
        <section className="card">
          <div className="section-title">
            <h2>Na sua rotina</h2>
            <button className="text-button" onClick={() => go('workouts')}>
              Ver treinos <ChevronRight size={16} />
            </button>
          </div>
          {state.routines.length ? (
            <div className="routine-preview-list">
              {state.routines.slice(0, 3).map((routine) => (
                <button className="routine-preview" key={routine.id} onClick={() => go('workouts')}>
                  <span>
                    <strong>{routine.name}</strong>
                    <small>
                      {routine.exercises.length} exercícios ·{' '}
                      {routine.exercises.reduce((sum, item) => sum + item.sets, 0)} séries
                      planejadas
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Dumbbell size={30} />
              <h3>Nenhuma rotina cadastrada</h3>
              <p>Cadastre seus exercícios e organize o próximo treino.</p>
              <button className="button secondary" onClick={() => go('workouts')}>
                Organizar treinos
              </button>
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-title">
            <h2>Alimentação de hoje</h2>
            <Leaf size={19} />
          </div>
          {meals.length ? (
            <>
              <div className="macro-summary">
                {(['protein', 'carbs', 'fat'] as const).map((key, index) => (
                  <div key={key}>
                    <span>{['Proteínas', 'Carboidratos', 'Gorduras'][index]}</span>
                    <strong>{number(nutrition.totals[key], 1)} g</strong>
                  </div>
                ))}
              </div>
              {nutrition.incomplete && (
                <p className="muted">Totais parciais: há nutrientes não informados.</p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Leaf size={30} />
              <h3>Nenhuma refeição registrada hoje</h3>
              <p>Registre alimentos e quantidades para acompanhar suas refeições.</p>
            </div>
          )}
          <button className="button secondary full-width" onClick={() => go('nutrition')}>
            Registrar alimentação
          </button>
        </section>
      </div>
      <p className="privacy-note">
        <ShieldCheck size={16} /> Seu espaço pessoal. Registros salvos neste navegador, sob seu
        controle.
      </p>
    </>
  );
}

function DataPage({
  state,
  busy,
  perform,
  notify,
  mode,
  resetRequested,
  onResetClose,
}: {
  state: AppState;
  busy: boolean;
  perform: (task: () => Promise<AppState>, message: string) => Promise<boolean>;
  notify: (text: string, error?: boolean) => void;
  mode: DataMode;
  resetRequested: boolean;
  onResetClose: () => void;
}) {
  const [candidate, setCandidate] = useState<AppState | null>(null);
  const [reading, setReading] = useState(false);
  const [persistent, setPersistent] = useState<string>('Verificando proteção do armazenamento…');
  useEffect(() => {
    navigator.storage
      ?.persisted?.()
      .then((value) =>
        setPersistent(
          value
            ? 'Armazenamento persistente concedido pelo navegador.'
            : 'Armazenamento padrão do navegador. Mantenha um backup.',
        ),
      )
      .catch(() => setPersistent('Não foi possível consultar a proteção do armazenamento.'));
  }, []);
  const exportData = async () => {
    try {
      const latest = await loadState(mode);
      const url = URL.createObjectURL(
        new Blob([serializeBackup(latest)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitness-lab-${mode === 'demo' ? 'demo-' : ''}backup-${dayInTimezone(new Date(), latest.timezone)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Backup exportado. Guarde o arquivo em um local seguro.');
    } catch {
      notify('Não foi possível exportar o backup. Tente novamente.', true);
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Seus dados</h1>
          <p>Exporte uma cópia ou restaure seus registros.</p>
        </div>
        <Database size={32} />
      </div>
      {mode === 'demo' && (
        <section className="card demo-reset">
          <h2>Exemplos da demonstração</h2>
          <p>
            Restaure o conjunto fictício original. Os registros do modo pessoal ficam preservados.
          </p>
          {resetRequested && (
            <div
              className="restore-confirm"
              role="region"
              aria-label="Confirmar restauração dos exemplos"
            >
              <h3>Descartar alterações da demonstração?</h3>
              <p>
                Isso substitui somente os dados da demo, incluindo treinos em andamento. Exporte um
                backup se quiser guardar sua experiência.
              </p>
              <div className="button-row">
                <button
                  className="button primary"
                  autoFocus
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await perform(
                        restoreDemo,
                        'Exemplos restaurados. Seus registros pessoais foram preservados.',
                      )
                    ) {
                      setCandidate(null);
                      onResetClose();
                    }
                  }}
                >
                  Restaurar dados fictícios
                </button>
                <button className="button secondary" disabled={busy} onClick={onResetClose}>
                  Cancelar restauração
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      <section className="card">
        <div className="section-title">
          <h2>Backup e recuperação</h2>
          <ShieldCheck size={22} />
        </div>
        <p>
          Seus registros ficam neste perfil de navegador. Limpar os dados do site ou usar outro
          endereço não transfere seu histórico. Exporte um backup regularmente.
        </p>
        <div className="backup-actions">
          <button className="button primary" disabled={busy || reading} onClick={exportData}>
            <Download size={18} /> Exportar backup
          </button>
          <label className="button secondary import-label">
            <Upload size={18} /> Importar backup
            <input
              aria-label="Selecionar arquivo de backup"
              type="file"
              accept=".json,application/json"
              disabled={busy || reading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                setCandidate(null);
                if (!file) return;
                setReading(true);
                try {
                  if (file.size > MAX_BACKUP_BYTES)
                    throw new Error('O backup deve ter no máximo 20 MiB.');
                  setCandidate(parseBackup(await file.text()));
                } catch (error) {
                  notify(
                    error instanceof Error ? error.message : 'Arquivo de backup inválido.',
                    true,
                  );
                } finally {
                  setReading(false);
                }
              }}
            />
          </label>
        </div>
        {reading && <p role="status">Validando arquivo…</p>}
        {candidate && (
          <div className="restore-confirm" role="region" aria-label="Confirmar restauração">
            <h3>Restaurar este backup?</h3>
            <p>
              O arquivo contém {candidate.sessions.length} treinos, {candidate.meals.length}{' '}
              registros de alimentação e {candidate.routines.length} rotinas.
            </p>
            <p>
              <strong>
                Isso substituirá os registros do modo {mode === 'demo' ? 'demonstração' : 'pessoal'}{' '}
                neste navegador.
              </strong>{' '}
              Exporte seus dados atuais antes de continuar.
            </p>
            <div className="button-row">
              <button
                className="button primary"
                disabled={busy}
                onClick={async () => {
                  if (
                    await perform(
                      () => restoreState(candidate, mode),
                      'Backup restaurado com sucesso.',
                    )
                  )
                    setCandidate(null);
                }}
              >
                Substituir dados e restaurar
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => setCandidate(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="page-grid">
        <section className="card">
          <h2>Armazenamento local</h2>
          <p>{persistent}</p>
          <button
            className="button secondary"
            onClick={async () => {
              try {
                const allowed = await navigator.storage?.persist?.();
                setPersistent(
                  allowed
                    ? 'Armazenamento persistente concedido pelo navegador.'
                    : 'O navegador não concedeu a proteção. Continue exportando backups.',
                );
              } catch {
                setPersistent(
                  'Proteção não disponível neste navegador. Continue exportando backups.',
                );
              }
            }}
          >
            Solicitar proteção dos dados
          </button>
          <p className="muted">
            Essa proteção reduz a remoção automática por falta de espaço. Ela não impede a limpeza
            manual dos dados.
          </p>
        </section>
        <section className="card">
          <h2>Sobre o Fitness Lab</h2>
          <dl className="about-list">
            <div>
              <dt>Versão</dt>
              <dd>{__APP_VERSION__}</dd>
            </div>
            <div>
              <dt>Fuso dos registros</dt>
              <dd>{state.timezone}</dd>
            </div>
            <div>
              <dt>Carga dos exercícios</dt>
              <dd>kg de carga externa</dd>
            </div>
            <div>
              <dt>Alimentação</dt>
              <dd>Valores por 100 g ou 100 ml</dd>
            </div>
          </dl>
          <p className="muted">
            Uso pessoal, sem conta ou sincronização. Nenhum registro é enviado a um servidor.
          </p>
        </section>
      </div>
    </>
  );
}

export default function App() {
  const [mode] = useState<DataMode>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'demo' ? 'demo' : 'personal',
  );
  const [resetRequested, setResetRequested] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [page, setPage] = useState<Page>('today');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [clock, setClock] = useState(Date.now());
  const lock = useRef(false);
  const generation = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((text: string, error = false) => {
    clearTimeout(toastTimer.current);
    setToast({ text, error });
    toastTimer.current = setTimeout(() => setToast(null), error ? 12000 : 4500);
  }, []);
  const refresh = useCallback(async () => {
    if (lock.current) return;
    const ticket = ++generation.current;
    try {
      const data = await loadState(mode);
      if (ticket === generation.current) {
        setState(data);
        setLoadError('');
      }
    } catch (error) {
      if (ticket === generation.current)
        setLoadError(
          error instanceof Error
            ? `${error.message} Verifique a conexão e se o navegador permite armazenamento local. Tente novamente; os registros existentes não foram substituídos.`
            : 'Não foi possível abrir os dados deste modo. Verifique se o navegador permite armazenamento local e tente novamente.',
        );
    }
  }, [mode]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => setClock(Date.now()), 30000);
    const onFocus = () => {
      setClock(Date.now());
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel(
        mode === 'demo' ? 'fitness-lab-demo-updates' : 'fitness-lab-updates',
      );
      channel.current.onmessage = () => {
        void refresh();
      };
    }
    return () => {
      clearInterval(timer);
      clearTimeout(toastTimer.current);
      window.removeEventListener('focus', onFocus);
      channel.current?.close();
      channel.current = null;
    };
  }, [refresh]);
  const perform = useCallback(
    async (task: () => Promise<AppState>, message: string): Promise<boolean> => {
      if (lock.current) return false;
      lock.current = true;
      ++generation.current;
      setBusy(true);
      try {
        const result = await task();
        setState(result);
        setLoadError('');
        channel.current?.postMessage('updated');
        notify(message);
        return true;
      } catch (error) {
        notify(
          error instanceof DOMException && error.name === 'QuotaExceededError'
            ? 'O navegador está sem espaço para salvar. Exporte seu backup e libere espaço antes de tentar novamente.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível salvar. Seus dados anteriores foram preservados.',
          true,
        );
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
        void refresh();
      }
    },
    [notify, refresh],
  );
  const dispatch = useCallback(
    (command: Command) =>
      perform(
        () => execute(command, mode),
        command.type === 'finishSession'
          ? 'Treino concluído. Cada série conta!'
          : 'Salvo no seu dispositivo.',
      ),
    [perform, mode],
  );
  const day = state
    ? mode === 'demo'
      ? DEMO_DAY
      : dayInTimezone(new Date(clock), state.timezone)
    : '';
  const switchMode = () => {
    if (lock.current) return;
    const destination = new URL(window.location.href);
    destination.hash = '';
    if (mode === 'personal') destination.searchParams.set('mode', 'demo');
    else destination.searchParams.delete('mode');
    window.location.assign(destination.href);
  };
  const props: PageProps | null = state ? { state, dispatch, busy, day } : null;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setPage('today');
          }}
        >
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}brand/fitness-lab-symbol.svg`}
            width="48"
            height="48"
            alt=""
          />
          <span>
            <span className="brand-name">Fitness Lab</span>
            <small>Diário de treino</small>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? 'active' : ''}`}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => setPage(item.id)}
            >
              <item.icon size={21} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="local-indicator" /> Salvo neste dispositivo
          <small>Fitness Lab · v{__APP_VERSION__}</small>
        </div>
      </aside>
      <main className="main-content" id="main">
        <a
          className="mobile-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setPage('today');
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}brand/fitness-lab-symbol.svg`}
            width="40"
            height="40"
            alt=""
          />
          <span>Fitness Lab</span>
        </a>
        <section
          className={`mode-banner ${mode === 'demo' ? 'demo-mode' : ''}`}
          aria-label="Modo de uso"
        >
          <div>
            <h2>{mode === 'demo' ? 'Demonstração · dados fictícios' : 'Modo pessoal'}</h2>
            <p>
              {mode === 'demo'
                ? 'Painel e alimentação em 17/10/2026. Novos treinos usam a data atual. Suas alterações ficam só neste navegador.'
                : 'Experimente treinos, refeições e evolução preenchidos em um espaço separado dos seus registros.'}
            </p>
          </div>
          <div className="button-row">
            <button
              className="button secondary"
              data-leave-workout
              disabled={busy}
              onClick={switchMode}
            >
              {mode === 'demo' ? 'Voltar ao modo pessoal' : 'Experimentar demonstração'}
            </button>
            {mode === 'demo' && (
              <button
                className="text-button"
                data-leave-workout
                disabled={busy}
                onClick={() => {
                  setPage('data');
                  setResetRequested(true);
                }}
              >
                Restaurar exemplos
              </button>
            )}
          </div>
        </section>
        {loadError ? (
          <>
            <div className="card error" role="alert">
              <h1>Não foi possível carregar os registros</h1>
              <p>{loadError}</p>
              <button className="button primary" onClick={() => void refresh()}>
                Tentar novamente
              </button>
              <p>
                Se o erro continuar e você tiver um backup, importe-o abaixo para recuperar seus
                registros.
              </p>
            </div>
            <DataPage
              state={state ?? createInitialState()}
              busy={busy}
              perform={perform}
              notify={notify}
              mode={mode}
              resetRequested={resetRequested}
              onResetClose={() => setResetRequested(false)}
            />
          </>
        ) : !state || !props ? (
          <div className="loading" role="status">
            Carregando registros…
          </div>
        ) : (
          <>
            {mode === 'demo' && page === 'today' && (
              <section className="demo-suggestions" aria-label="Sugestões para experimentar">
                <button className="button secondary" onClick={() => setPage('workouts')}>
                  Experimentar um treino
                </button>
                <button className="button secondary" onClick={() => setPage('history')}>
                  Explorar evolução
                </button>
                <button className="button secondary" onClick={() => setPage('nutrition')}>
                  Editar alimentação
                </button>
              </section>
            )}
            {page === 'today' && <Today state={state} day={day} go={setPage} />}
            {page === 'workouts' && <Workouts {...props} />}
            {page === 'nutrition' && <Nutrition {...props} />}
            {page === 'history' && (
              <History
                {...props}
                preferredExerciseId={mode === 'demo' ? 'demo-exercise-bench' : undefined}
              />
            )}
            {page === 'data' && (
              <DataPage
                state={state}
                busy={busy}
                perform={perform}
                notify={notify}
                mode={mode}
                resetRequested={resetRequested}
                onResetClose={() => setResetRequested(false)}
              />
            )}
          </>
        )}
      </main>
      {toast && (
        <div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
        >
          {!toast.error && <Check size={18} />}
          <span>{toast.text}</span>
          <button aria-label="Fechar mensagem" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
