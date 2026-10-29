import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './domain';
import { closeDatabase, execute, loadState, restoreDemo, restoreState } from './repository';
import type { AppState, Command } from './types';

const demoState: AppState = {
  ...createInitialState(),
  exercises: [
    { id: 'demo-exercise', name: 'Exercício fictício', muscleGroup: 'Pernas', bodyweight: true },
  ],
  routines: [
    {
      id: 'demo-routine',
      name: 'Rotina fictícia',
      description: '',
      exercises: [{ exerciseId: 'demo-exercise', sets: 2, reps: 10 }],
    },
  ],
};
const personalCommand: Command = {
  type: 'saveExercise',
  exercise: {
    id: 'personal-exercise',
    name: 'Exercício pessoal',
    muscleGroup: 'Peito',
    bodyweight: false,
  },
};
const editDemo: Command = {
  type: 'saveExercise',
  exercise: { ...demoState.exercises[0], name: 'Demonstração editada' },
};

async function clearDatabases() {
  await Promise.all([closeDatabase(), closeDatabase('demo')]);
  await Promise.all([deleteDB('fitness-lab'), deleteDB('fitness-lab-demo')]);
}

function seedResponse() {
  return new Response(JSON.stringify(demoState), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

beforeEach(async () => {
  await clearDatabases();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => seedResponse()),
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await clearDatabases();
});

describe('isolated demo repository', () => {
  it('keeps personal defaults empty and all writes and restores isolated by database', async () => {
    expect(await loadState()).toEqual(createInitialState());
    expect(fetch).not.toHaveBeenCalled();
    const personal = await execute(personalCommand);
    expect(await loadState('demo')).toEqual(demoState);
    expect(fetch).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}demo/fitness-lab-demo.json`);
    const demo = await execute(editDemo, 'demo');
    expect(await loadState()).toEqual(personal);
    await restoreState(createInitialState());
    expect(await loadState('demo')).toEqual(demo);
    await restoreState({ ...createInitialState(), timezone: 'UTC' }, 'demo');
    expect(await loadState()).toEqual(createInitialState());
    expect((await loadState('demo')).timezone).toBe('UTC');
  });

  it('seeds once, preserves edits and does not reset an existing empty demo on reopening', async () => {
    await loadState('demo');
    const edited = await execute(editDemo, 'demo');
    expect(await loadState('demo')).toEqual(edited);
    await closeDatabase('demo');
    expect(await loadState('demo')).toEqual(edited);
    await restoreState(createInitialState(), 'demo');
    expect(await loadState('demo')).toEqual(createInitialState());
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('rechecks current inside the seed transaction and preserves an edit made while fetching', async () => {
    const waitingResponse = deferred<Response>();
    const fetchStarted = deferred<void>();
    vi.mocked(fetch).mockImplementationOnce(() => {
      fetchStarted.resolve();
      return waitingResponse.promise;
    });
    const firstLoad = loadState('demo');
    await fetchStarted.promise;
    expect(await loadState('demo')).toEqual(demoState);
    const edited = await execute(editDemo, 'demo');
    waitingResponse.resolve(seedResponse());
    expect(await firstLoad).toEqual(edited);
    await closeDatabase('demo');
    expect(await loadState('demo')).toEqual(edited);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('never replaces corruption with a seed and explicit reset repairs only the demo database', async () => {
    const personal = await execute(personalCommand);
    const db = await openDB('fitness-lab-demo', 1, {
      upgrade(database) {
        database.createObjectStore('state');
      },
    });
    const corrupt = { schemaVersion: 77 };
    await db.put('state', corrupt, 'current');
    await expect(loadState('demo')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
    expect(await db.get('state', 'current')).toEqual(corrupt);
    expect(await loadState()).toEqual(personal);
    expect(await restoreDemo()).toEqual(demoState);
    expect(await loadState()).toEqual(personal);
    db.close();
  });

  it('does not overwrite corruption created by another tab while a seed is being fetched', async () => {
    const waitingResponse = deferred<Response>();
    const fetchStarted = deferred<void>();
    vi.mocked(fetch).mockImplementationOnce(() => {
      fetchStarted.resolve();
      return waitingResponse.promise;
    });
    const firstLoad = loadState('demo');
    await fetchStarted.promise;
    const db = await openDB('fitness-lab-demo', 1);
    await db.put('state', { schemaVersion: 77 }, 'current');
    waitingResponse.resolve(seedResponse());
    await expect(firstLoad).rejects.toThrow();
    expect(await db.get('state', 'current')).toEqual({ schemaVersion: 77 });
    db.close();
  });

  it('treats an existing undefined record as corruption rather than a missing seed', async () => {
    const db = await openDB('fitness-lab-demo', 1, {
      upgrade(database) {
        database.createObjectStore('state');
      },
    });
    await db.put('state', undefined, 'current');
    await expect(loadState('demo')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
    expect(await db.getKey('state', 'current')).toBe('current');
    expect(await db.get('state', 'current')).toBeUndefined();
    db.close();
  });

  it('preserves an existing undefined personal record when a command is attempted', async () => {
    const demo = await loadState('demo');
    const db = await openDB('fitness-lab', 1, {
      upgrade(database) {
        database.createObjectStore('state');
      },
    });
    try {
      await db.put('state', undefined, 'current');
      await expect(execute(personalCommand)).rejects.toThrow();
      expect(await db.getKey('state', 'current')).toBe('current');
      expect(await db.get('state', 'current')).toBeUndefined();
      expect(await loadState('demo')).toEqual(demo);
    } finally {
      db.close();
    }
  });

  it('rejects undefined demo corruption committed between preload and command transaction', async () => {
    const personal = await execute(personalCommand);
    await loadState('demo');
    const otherConnection = await openDB('fitness-lab-demo', 1);
    const getAll = IDBObjectStore.prototype.getAll;
    let corruption: Promise<unknown> | undefined;
    const read = vi.spyOn(IDBObjectStore.prototype, 'getAll').mockImplementationOnce(function (
      this: IDBObjectStore,
      query,
      count,
    ) {
      const request = getAll.call(this, query, count);
      // Queue the other tab's write before execute opens its readwrite transaction.
      corruption = otherConnection.put('state', undefined, 'current');
      return request;
    });
    try {
      await expect(execute(editDemo, 'demo')).rejects.toThrow();
      await corruption;
      expect(read).toHaveBeenCalledTimes(2);
      expect(await otherConnection.getKey('state', 'current')).toBe('current');
      expect(await otherConnection.get('state', 'current')).toBeUndefined();
      expect(await loadState()).toEqual(personal);
      expect(fetch).toHaveBeenCalledOnce();
    } finally {
      read.mockRestore();
      otherConnection.close();
    }
  });

  it('propagates quota failure while seeding, leaves personal records intact and can retry', async () => {
    const personal = await execute(personalCommand);
    const quota = new DOMException('Storage quota exceeded', 'QuotaExceededError');
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw quota;
    });
    await expect(loadState('demo')).rejects.toBe(quota);
    const db = await openDB('fitness-lab-demo', 1);
    expect(await db.get('state', 'current')).toBeUndefined();
    db.close();
    expect(await loadState()).toEqual(personal);
    expect(await loadState('demo')).toEqual(demoState);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps both databases unchanged when reset cannot commit and resets only demo on retry', async () => {
    const personal = await execute(personalCommand);
    await loadState('demo');
    const edited = await execute(editDemo, 'demo');
    const quota = new DOMException('Storage quota exceeded', 'QuotaExceededError');
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw quota;
    });
    await expect(restoreDemo()).rejects.toBe(quota);
    await Promise.all([closeDatabase(), closeDatabase('demo')]);
    expect(await loadState()).toEqual(personal);
    expect(await loadState('demo')).toEqual(edited);
    expect(await restoreDemo()).toEqual(demoState);
    expect(await loadState()).toEqual(personal);
    expect(await loadState('demo')).toEqual(demoState);
  });

  it('retries an interrupted seed download without saving empty or partial records', async () => {
    const personal = await execute(personalCommand);
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(loadState('demo')).rejects.toThrow(/conexão.*tente novamente/);
    const db = await openDB('fitness-lab-demo', 1);
    expect(await db.get('state', 'current')).toBeUndefined();
    db.close();
    expect(await loadState()).toEqual(personal);
    expect(await loadState('demo')).toEqual(demoState);
  });

  it('does not replace demo edits when reset fetch fails, returns HTTP error or has invalid data', async () => {
    const personal = await execute(personalCommand);
    await loadState('demo');
    const edited = await execute(editDemo, 'demo');
    for (const response of [
      new Response('', { status: 503 }),
      new Response('{'),
      new Response(JSON.stringify({ ...demoState, schemaVersion: 77 })),
    ]) {
      vi.mocked(fetch).mockResolvedValueOnce(response);
      await expect(restoreDemo()).rejects.toThrow(/demonstração/);
      expect(await loadState('demo')).toEqual(edited);
      expect(await loadState()).toEqual(personal);
    }
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(restoreDemo()).rejects.toThrow(/conexão/);
    expect(await loadState('demo')).toEqual(edited);
  });

  it('initializes before a direct demo command and records new workouts at the real supplied instant', async () => {
    const startedAt = '2026-10-29T15:00:00.000Z';
    const state = await execute(
      { type: 'startSession', id: 'new-session', routineId: 'demo-routine', now: startedAt },
      'demo',
    );
    expect(state.sessions[0]).toMatchObject({ startedAt, day: '2026-10-29' });
    expect(await loadState()).toEqual(createInitialState());
  });

  it('propagates blocked storage without touching personal state and can recover', async () => {
    const personal = await execute(personalCommand);
    const denied = new DOMException('Storage denied', 'SecurityError');
    vi.spyOn(IDBFactory.prototype, 'open').mockImplementationOnce(() => {
      throw denied;
    });
    await expect(loadState('demo')).rejects.toBe(denied);
    expect(fetch).not.toHaveBeenCalled();
    expect(await loadState()).toEqual(personal);
    expect(await loadState('demo')).toEqual(demoState);
  });
});
