import { openDB, type IDBPDatabase } from 'idb';
import { applyCommand, createInitialState, parseBackup, serializeBackup } from './domain';
import type { AppState, Command } from './types';

let database: Promise<IDBPDatabase> | undefined;

function getDatabase(): Promise<IDBPDatabase> {
  database ??= openDB('fitness-lab', 1, {
    upgrade(db) { db.createObjectStore('state'); },
    blocking() { void closeDatabase(); },
    terminated() { database = undefined; },
  }).catch((error: unknown) => { database = undefined; throw error; });
  return database;
}

function validate(state: unknown): AppState {
  return parseBackup(JSON.stringify(state));
}

export async function loadState(): Promise<AppState> {
  const db = await getDatabase();
  const transaction = db.transaction('state', 'readonly');
  try {
    const stored: unknown = await transaction.store.get('current');
    await transaction.done;
    return stored === undefined ? createInitialState() : validate(stored);
  } catch (error) {
    await transaction.done.catch(() => undefined);
    throw error;
  }
}

export async function execute(command: Command): Promise<AppState> {
  const db = await getDatabase();
  const transaction = db.transaction('state', 'readwrite');
  try {
    // IndexedDB serializes readwrite transactions on this store, including across tabs.
    const stored: unknown = await transaction.store.get('current');
    const state = stored === undefined ? createInitialState() : validate(stored);
    const updated = applyCommand(state, command);
    await transaction.store.put(updated, 'current');
    await transaction.done;
    return updated;
  } catch (error) {
    try { transaction.abort(); } catch { /* The transaction may already have aborted. */ }
    await transaction.done.catch(() => undefined);
    throw error;
  }
}

export async function restoreState(input: AppState): Promise<AppState> {
  const state = parseBackup(serializeBackup(input));
  const db = await getDatabase();
  const transaction = db.transaction('state', 'readwrite');
  try {
    await transaction.store.put(state, 'current');
    await transaction.done;
    return state;
  } catch (error) {
    try { transaction.abort(); } catch { /* The transaction may already have aborted. */ }
    await transaction.done.catch(() => undefined);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  const current = database;
  database = undefined;
  if (current) (await current).close();
}
