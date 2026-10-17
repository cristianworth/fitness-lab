import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
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
import { execute, loadState, restoreState } from './repository';
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
  const sets = sessions
    .flatMap((session) => session.exercises.flatMap((exercise) => exercise.sets))
    .filter((set) => set.completed).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">UM DIA DE CADA VEZ</p>
          <h1>
            Seu ritmo.
            <br />
            Sua evolução.
          </h1>
          <p>Um espaço para cuidar da sua constância.</p>
        </div>
        <span className="badge">
          <CalendarDays size={16} /> {dateLabel(day)}
        </span>
      </div>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">{active ? 'TREINO EM ANDAMENTO' : 'SEU PRÓXIMO PASSO'}</span>
          <h2>{active ? active.routineName : 'O melhor treino é o que acontece.'}</h2>
          <p>
            {active
              ? 'Suas séries estão salvas. Continue de onde parou.'
              : 'Prepare sua rotina e registre cada série. O progresso começa no seu próximo movimento.'}
          </p>
          <button className="button primary" onClick={() => go('workouts')}>
            {active
              ? 'Continuar treino'
              : state.routines.length
                ? 'Começar um treino'
                : 'Criar minha rotina'}{' '}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-icon">
            <Dumbbell size={84} strokeWidth={1.3} />
          </div>
          <span className="hero-art-caption">MOVIMENTO É PROGRESSO</span>
        </div>
      </section>
      <div className="section-title">
        <h2>Seu dia em números</h2>
        <span className="muted">Registros de hoje</span>
      </div>
      <section className="stats-grid" aria-label="Resumo do dia">
        <article className="stat-card">
          <span className="stat-icon">
            <Dumbbell size={20} />
          </span>
          <span>Treinos concluídos</span>
          <strong>{sessions.length}</strong>
          <small>{sets} séries realizadas</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <Activity size={20} />
          </span>
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
          <span className="stat-icon">
            <Leaf size={20} />
          </span>
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
              {state.routines.slice(0, 3).map((routine, index) => (
                <button className="routine-preview" key={routine.id} onClick={() => go('workouts')}>
                  <span className="routine-number">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <strong>{routine.name}</strong>
                    <small>
                      {routine.exercises.length} exercícios ·{' '}
                      {routine.exercises.reduce((sum, item) => sum + item.sets, 0)} séries
                      planejadas
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Dumbbell size={30} />
              <h3>Uma rotina com a sua cara</h3>
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
              <h3>O que fez parte do seu dia?</h3>
              <p>Registre alimentos e quantidades para acompanhar suas refeições.</p>
            </div>
          )}
          <button className="button secondary full-width" onClick={() => go('nutrition')}>
            Registrar alimentação <ArrowRight size={16} />
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
}: {
  state: AppState;
  busy: boolean;
  perform: (task: () => Promise<AppState>, message: string) => Promise<boolean>;
  notify: (text: string, error?: boolean) => void;
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
      const latest = await loadState();
      const url = URL.createObjectURL(
        new Blob([serializeBackup(latest)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitness-lab-backup-${dayInTimezone(new Date(), latest.timezone)}.json`;
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
          <p className="eyebrow">VOCÊ NO CONTROLE</p>
          <h1>Seus dados</h1>
          <p>Um registro de constância merece ser bem cuidado.</p>
        </div>
        <Database size={32} />
      </div>
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
              <strong>Isso substituirá todos os registros atuais deste navegador.</strong> Exporte
              seus dados atuais antes de continuar.
            </p>
            <div className="button-row">
              <button
                className="button primary"
                disabled={busy}
                onClick={async () => {
                  if (
                    await perform(() => restoreState(candidate), 'Backup restaurado com sucesso.')
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
      const data = await loadState();
      if (ticket === generation.current) {
        setState(data);
        setLoadError('');
      }
    } catch {
      if (ticket === generation.current)
        setLoadError(
          'Não foi possível abrir seus dados. Verifique se o navegador permite armazenamento local e tente novamente.',
        );
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => setClock(Date.now()), 30000);
    const onFocus = () => {
      setClock(Date.now());
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('fitness-lab-updates');
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
        () => execute(command),
        command.type === 'finishSession'
          ? 'Treino concluído. Cada série conta!'
          : 'Salvo no seu dispositivo.',
      ),
    [perform],
  );
  const day = state ? dayInTimezone(new Date(clock), state.timezone) : '';
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
          <span className="brand-mark">
            <Activity size={23} />
          </span>
          <span>
            fitness<span className="brand-light">lab</span>
            <small>SEU ESPAÇO DE EVOLUÇÃO</small>
          </span>
        </a>
        <p className="nav-caption">SEU ACOMPANHAMENTO</p>
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
              {page === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="local-indicator" /> Salvo neste dispositivo
          <small>Fitness Lab · v{__APP_VERSION__}</small>
        </div>
      </aside>
      <main className="main-content" id="main">
        <header className="topbar">
          <span>
            <span className="topbar-dot" /> SEU LABORATÓRIO DE CONSTÂNCIA
          </span>
          <span className="profile-badge">FL</span>
        </header>
        {loadError ? (
          <>
            <div className="card error" role="alert">
              <h1>Vamos recuperar a conexão com seus dados</h1>
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
            />
          </>
        ) : !state || !props ? (
          <div className="loading" role="status">
            Abrindo seu espaço…
          </div>
        ) : (
          <>
            {page === 'today' && <Today state={state} day={day} go={setPage} />}
            {page === 'workouts' && <Workouts {...props} />}
            {page === 'nutrition' && <Nutrition {...props} />}
            {page === 'history' && <History {...props} />}
            {page === 'data' && (
              <DataPage state={state} busy={busy} perform={perform} notify={notify} />
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
