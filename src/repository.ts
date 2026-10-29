import { openDB, type IDBPDatabase } from 'idb';
import { applyCommand, createInitialState, parseBackup, serializeBackup } from './domain';
import type { AppState, Command } from './types';

export type DataMode = 'personal' | 'demo';

const databaseNames: Record<DataMode, string> = {
  personal: 'fitness-lab',
  demo: 'fitness-lab-demo',
};
const databases: Partial<Record<DataMode, Promise<IDBPDatabase>>> = {};

function getDatabase(mode: DataMode): Promise<IDBPDatabase> {
  databases[mode] ??= openDB(databaseNames[mode], 1, {
    upgrade(db) {
      db.createObjectStore('state');
    },
    blocking() {
      void closeDatabase(mode);
    },
    terminated() {
      delete databases[mode];
    },
  }).catch((error: unknown) => {
    delete databases[mode];
    throw error;
  });
  return databases[mode];
}

function validate(state: unknown): AppState {
  return parseBackup(JSON.stringify(state));
}

async function fetchDemoState(): Promise<AppState> {
  let text: string;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}demo/fitness-lab-demo.json`);
    if (!response.ok)
      throw new Error(
        `Não foi possível carregar a demonstração (HTTP ${response.status}). Tente novamente.`,
      );
    text = await response.text();
  } catch (error) {
    throw new Error(
      'Não foi possível carregar a demonstração. Verifique a conexão e tente novamente.',
      { cause: error },
    );
  }
  try {
    const state = parseBackup(text);
    serializeBackup(state);
    return state;
  } catch (error) {
    throw new Error(
      `Os dados de demonstração são inválidos: ${error instanceof Error ? error.message : 'arquivo não reconhecido.'}`,
      { cause: error },
    );
  }
}

export async function loadState(mode: DataMode = 'personal'): Promise<AppState> {
  const db = await getDatabase(mode);
  const transaction = db.transaction('state', 'readonly');
  let records: unknown[];
  try {
    // getAll distinguishes a missing key from an existing record containing undefined.
    records = await transaction.store.getAll('current', 1);
    await transaction.done;
  } catch (error) {
    await transaction.done.catch(() => undefined);
    throw error;
  }
  if (records.length > 0) return validate(records[0]);
  if (mode === 'personal') return createInitialState();

  // Fetch before opening the write transaction so network waits cannot expire it or block other tabs.
  const seed = await fetchDemoState();
  const seedDatabase = await getDatabase('demo');
  const seedTransaction = seedDatabase.transaction('state', 'readwrite');
  try {
    const current: unknown[] = await seedTransaction.store.getAll('current', 1);
    const state = current.length === 0 ? seed : validate(current[0]);
    if (current.length === 0) await seedTransaction.store.put(state, 'current');
    await seedTransaction.done;
    return state;
  } catch (error) {
    try {
      seedTransaction.abort();
    } catch {
      /* The transaction may already have aborted. */
    }
    await seedTransaction.done.catch(() => undefined);
    throw error;
  }
}

export async function execute(command: Command, mode: DataMode = 'personal'): Promise<AppState> {
  if (mode === 'demo') await loadState('demo');
  const db = await getDatabase(mode);
  const transaction = db.transaction('state', 'readwrite');
  try {
    // IndexedDB serializes readwrite transactions on this store, including across tabs.
    const records: unknown[] = await transaction.store.getAll('current', 1);
    const state = records.length === 0 ? createInitialState() : validate(records[0]);
    const updated = applyCommand(state, command);
    serializeBackup(updated);
    await transaction.store.put(updated, 'current');
    await transaction.done;
    return updated;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      /* The transaction may already have aborted. */
    }
    await transaction.done.catch(() => undefined);
    throw error;
  }
}

export async function restoreState(
  input: AppState,
  mode: DataMode = 'personal',
): Promise<AppState> {
  const state = parseBackup(serializeBackup(input));
  const db = await getDatabase(mode);
  const transaction = db.transaction('state', 'readwrite');
  try {
    await transaction.store.put(state, 'current');
    await transaction.done;
    return state;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      /* The transaction may already have aborted. */
    }
    await transaction.done.catch(() => undefined);
    throw error;
  }
}

export async function restoreDemo(): Promise<AppState> {
  const seed = await fetchDemoState();
  return restoreState(seed, 'demo');
}

export async function closeDatabase(mode: DataMode = 'personal'): Promise<void> {
  const current = databases[mode];
  delete databases[mode];
  if (current) (await current).close();
}
