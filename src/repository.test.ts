import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, MAX_BACKUP_BYTES, serializeBackup } from './domain';
import { stateAtBackupLimit } from './data/backup-fixture.test-helper';
import { closeDatabase, execute, loadState, restoreState } from './repository';
import type { AppState, Command } from './types';

async function clearDatabase() {
  await closeDatabase();
  await deleteDB('fitness-lab');
}

beforeEach(clearDatabase);
afterEach(clearDatabase);

const exercise: Command = { type: 'saveExercise', exercise: { id: 'pushup', name: 'Flexão', muscleGroup: 'Peito', bodyweight: true } };

describe('IndexedDB repository', () => {
  it('returns an empty state on first launch and persists committed changes after reopening', async () => {
    expect(await loadState()).toEqual(createInitialState());
    const saved = await execute(exercise);
    await closeDatabase();
    expect(await loadState()).toEqual(saved);
    expect(saved.exercises[0].name).toBe('Flexão');
  });

  it('serializes overlapping read-modify-write operations without lost updates', async () => {
    await Promise.all(Array.from({ length: 30 }, (_, index) => execute({
      type: 'saveExercise', exercise: { id: `exercise-${index}`, name: `Exercício ${index}`, muscleGroup: '', bodyweight: false },
    })));
    expect((await loadState()).exercises).toHaveLength(30);
    await closeDatabase();
    expect(new Set((await loadState()).exercises.map((item) => item.id)).size).toBe(30);
  });

  it('retains committed data after a failed command and can continue writing', async () => {
    const saved = await execute(exercise);
    await expect(execute({ type: 'startSession', routineId: 'missing', id: 'session', now: '2026-10-17T12:00:00.000Z' })).rejects.toThrow(/Rotina/);
    expect(await loadState()).toEqual(saved);
    await execute({ type: 'saveExercise', exercise: { ...saved.exercises[0], name: 'Flexão inclinada' } });
    expect((await loadState()).exercises[0].name).toBe('Flexão inclinada');
  });

  it('rejects a quota failure from the object store, preserves committed data and recovers', async () => {
    const saved = await execute(exercise);
    const quotaError = new DOMException('Storage quota exceeded', 'QuotaExceededError');
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => { throw quotaError; });
    try {
      await expect(execute({ type: 'saveExercise', exercise: { ...saved.exercises[0], name: 'Alteração sem espaço' } })).rejects.toBe(quotaError);
      expect(put).toHaveBeenCalledOnce();
      expect(await loadState()).toEqual(saved);
      await closeDatabase();
      expect(await loadState()).toEqual(saved);
      const recovered = await execute({ type: 'saveExercise', exercise: { ...saved.exercises[0], name: 'Flexão recuperada' } });
      await closeDatabase();
      expect(await loadState()).toEqual(recovered);
      expect(recovered.exercises[0].name).toBe('Flexão recuperada');
    } finally {
      put.mockRestore();
    }
  });

  it('does not duplicate a concurrent repeated meal request', async () => {
    await execute({ type: 'saveFood', food: { id: 'food', name: 'Água', unit: 'ml', nutrients: { calories: 0, protein: 0, carbs: 0, fat: 0 } } });
    const command: Command = { type: 'addMeal', id: 'meal', foodId: 'food', day: '2026-10-17', mealType: 'Lanche', quantity: 250 };
    await Promise.all([execute(command), execute(command), execute(command)]);
    expect((await loadState()).meals).toHaveLength(1);
  });

  it('allows one active workout when competing starts overlap', async () => {
    await execute(exercise);
    await execute({ type: 'saveRoutine', routine: { id: 'routine', name: 'Treino', description: '', exercises: [{ exerciseId: 'pushup', sets: 1, reps: 10 }] } });
    const results = await Promise.allSettled(['one', 'two'].map((id) => execute({ type: 'startSession', id, routineId: 'routine', now: '2026-10-17T12:00:00.000Z' })));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await loadState()).sessions).toHaveLength(1);
  });

  it('validates the entire replacement before overwriting current data', async () => {
    const saved = await execute(exercise);
    await expect(restoreState({ ...saved, schemaVersion: 9 } as unknown as AppState)).rejects.toThrow();
    expect(await loadState()).toEqual(saved);
    const restored = await restoreState({ ...createInitialState(), timezone: 'UTC' });
    await closeDatabase();
    expect(await loadState()).toEqual(restored);
    expect(restored.exercises).toHaveLength(0);
  });

  it('rejects corrupt stored state without replacing it with empty data', async () => {
    const db = await openDB('fitness-lab', 1, { upgrade(database) { database.createObjectStore('state'); } });
    await db.put('state', { schemaVersion: 3 }, 'current');
    db.close();
    await expect(loadState()).rejects.toThrow();
    await expect(execute(exercise)).rejects.toThrow();
    const reopened = await openDB('fitness-lab', 1);
    expect(await reopened.get('state', 'current')).toEqual({ schemaVersion: 3 });
    reopened.close();
  });

  it('rolls back a command that would exceed export bytes and reopens the accepted state', async () => {
    const state = stateAtBackupLimit(MAX_BACKUP_BYTES);
    await restoreState(state);
    await expect(execute({ type: 'saveFood', food: { ...state.foods[0], name: `é${'米'.repeat(119)}` } })).rejects.toThrow(/20 MiB/);
    await closeDatabase();
    const persisted = await loadState();
    expect(persisted.foods[0].name).toBe(state.foods[0].name);
    expect(serializeBackup(persisted)).toBe(JSON.stringify(state));
  }, 15_000);
});
