import { describe, expect, it } from 'vitest';
import { applyCommand, createInitialState, dailyNutrients, dayInTimezone, MAX_BACKUP_BYTES, mealNutrients, parseBackup, serializeBackup } from './domain';
import { stateAtBackupLimit } from './data/backup-fixture.test-helper';
import type { AppState, Command, Food, Meal } from './types';

const now = '2026-10-17T02:30:00.000Z';
const later = '2026-10-17T03:30:00.000Z';
const food: Food = { id: 'rice', name: 'Arroz', unit: 'g', nutrients: { calories: 130, protein: 2.5, carbs: 28, fat: null } };
const addMeal: Command = { type: 'addMeal', id: 'meal-1', day: '2026-10-16', mealType: 'Jantar', foodId: 'rice', quantity: 150 };

function prepared(bodyweight = false): AppState {
  let state = applyCommand(createInitialState(), { type: 'saveExercise', exercise: { id: 'squat', name: 'Agachamento', muscleGroup: 'Pernas', bodyweight } });
  state = applyCommand(state, { type: 'saveRoutine', routine: { id: 'routine', name: 'Treino A', description: '', exercises: [{ exerciseId: 'squat', sets: 2, reps: 10 }] } });
  return applyCommand(state, { type: 'saveFood', food });
}

function started(bodyweight = false): AppState {
  return applyCommand(prepared(bodyweight), { type: 'startSession', id: 'session', routineId: 'routine', now });
}

function completed(): AppState {
  let state = started();
  const set = state.sessions[0].exercises[0].sets[0];
  state = applyCommand(state, { type: 'saveSet', sessionId: 'session', exerciseIndex: 0, set: { ...set, reps: 8, weight: 20, completed: true } });
  return applyCommand(state, { type: 'finishSession', sessionId: 'session', now: later });
}

describe('workout commands', () => {
  it('starts empty with no demonstration data', () => {
    expect(createInitialState()).toEqual({ schemaVersion: 1, timezone: 'America/Sao_Paulo', exercises: [], routines: [], sessions: [], foods: [], meals: [] });
  });

  it('takes independent exercise and routine snapshots without mutating input', () => {
    const initial = prepared();
    const original = JSON.stringify(initial);
    let state = applyCommand(initial, { type: 'startSession', id: 'session', routineId: 'routine', now });
    state = applyCommand(state, { type: 'saveExercise', exercise: { id: 'squat', name: 'Novo nome', muscleGroup: 'Outro', bodyweight: true } });
    const originalSet = state.sessions[0].exercises[0].sets[0];
    state = applyCommand(state, { type: 'saveSet', sessionId: 'session', exerciseIndex: 0, set: { ...originalSet, reps: 8, weight: 20, completed: true } });
    state = applyCommand(state, { type: 'saveRoutine', routine: { id: 'routine', name: 'Treino B', description: '', exercises: [{ exerciseId: 'squat', sets: 3, reps: 20 }] } });
    expect(JSON.stringify(initial)).toBe(original);
    expect(state.sessions[0]).toMatchObject({ routineName: 'Treino A', day: '2026-10-16', exercises: [{ name: 'Agachamento', muscleGroup: 'Pernas', bodyweight: false, plannedSets: 2, plannedReps: 10, sets: [{ reps: 8, weight: 20 }, { reps: 10, weight: null }] }] });
  });

  it('prevents two active sessions and ignores a repeated start', () => {
    const state = started();
    expect(applyCommand(state, { type: 'startSession', id: 'session', routineId: 'routine', now })).toEqual(state);
    expect(() => applyCommand(state, { type: 'startSession', id: 'other', routineId: 'routine', now })).toThrow(/andamento/);
  });

  it('accepts zero external load for bodyweight, but requires completed reps and known load', () => {
    let state = started(true);
    const set = state.sessions[0].exercises[0].sets[0];
    expect(set.weight).toBe(0);
    expect(() => applyCommand(state, { type: 'finishSession', sessionId: 'session', now: later })).toThrow(/pelo menos/);
    for (const invalid of [{ ...set, reps: 0, completed: true }, { ...set, reps: null, completed: true }, { ...set, weight: null, completed: true }]) {
      expect(() => applyCommand(state, { type: 'saveSet', sessionId: 'session', exerciseIndex: 0, set: invalid })).toThrow(/concluída/);
    }
    state = applyCommand(state, { type: 'saveSet', sessionId: 'session', exerciseIndex: 0, set: { ...set, completed: true } });
    expect(applyCommand(state, { type: 'finishSession', sessionId: 'session', now: later }).sessions[0].completedAt).toBe(later);
  });

  it('allows unknown values in unfinished sets and makes added set IDs idempotent', () => {
    let state = started();
    const command: Command = { type: 'addSet', sessionId: 'session', exerciseIndex: 0, id: 'extra-set' };
    state = applyCommand(state, command);
    expect(state.sessions[0].exercises[0].sets.at(-1)).toEqual({ id: 'extra-set', reps: null, weight: null, completed: false });
    expect(applyCommand(state, command)).toEqual(state);
  });

  it('keeps finished sessions immutable and preserves the first completion on retries', () => {
    const state = completed();
    const set = state.sessions[0].exercises[0].sets[0];
    expect(applyCommand(state, { type: 'finishSession', sessionId: 'session', now: '2026-10-18T00:00:00.000Z' })).toEqual(state);
    expect(() => applyCommand(state, { type: 'saveSet', sessionId: 'session', exerciseIndex: 0, set: { ...set, reps: 20 } })).toThrow(/concluídos/);
    expect(() => applyCommand(state, { type: 'addSet', sessionId: 'session', exerciseIndex: 0, id: 'new' })).toThrow(/concluídos/);
    expect(applyCommand(state, { type: 'startSession', id: 'next-session', routineId: 'routine', now: later }).sessions).toHaveLength(2);
  });

  it('rejects completion before starting and changing nonexistent sets', () => {
    const state = completed();
    const active = { ...state, sessions: [{ ...state.sessions[0], completedAt: null }] };
    expect(() => applyCommand(active, { type: 'finishSession', sessionId: 'session', now: '2026-10-16T00:00:00.000Z' })).toThrow(/anterior/);
    expect(() => applyCommand(active, { type: 'saveSet', sessionId: 'session', exerciseIndex: 0, set: { id: 'missing', reps: 1, weight: 0, completed: true } })).toThrow(/não encontrada/);
  });
});

describe('meal snapshots and nutrients', () => {
  it('preserves food name, unit and nutrient snapshot through food edits and meal corrections', () => {
    let state = applyCommand(prepared(), addMeal);
    state = applyCommand(state, { type: 'saveFood', food: { ...food, name: 'Arroz novo', unit: 'ml', nutrients: { calories: 500, protein: 30, carbs: 50, fat: 10 } } });
    state = applyCommand(state, { type: 'editMeal', id: 'meal-1', day: '2026-10-17', mealType: 'Almoço', quantity: 200 });
    expect(state.meals[0]).toEqual({ id: 'meal-1', day: '2026-10-17', mealType: 'Almoço', quantity: 200, foodId: 'rice', foodName: 'Arroz', unit: 'g', nutrients: food.nutrients });
    expect(mealNutrients(state.meals[0])).toEqual({ calories: 260, protein: 5, carbs: 56, fat: null });
  });

  it('distinguishes unknown and zero, totals known contributions and signals partial information', () => {
    const meal = applyCommand(prepared(), addMeal).meals[0];
    const zero: Meal = { ...meal, id: 'zero', quantity: 100, nutrients: { calories: 0, protein: null, carbs: 0, fat: null } };
    expect(dailyNutrients([meal, zero])).toEqual({ totals: { calories: 195, protein: 3.75, carbs: 42, fat: null }, incomplete: true });
    expect(dailyNutrients([zero])).toEqual({ totals: { calories: 0, protein: null, carbs: 0, fat: null }, incomplete: true });
    expect(dailyNutrients([])).toEqual({ totals: { calories: null, protein: null, carbs: null, fat: null }, incomplete: false });
    expect(dailyNutrients([{ ...zero, nutrients: { calories: 0, protein: 0, carbs: 0, fat: 0 } }]).incomplete).toBe(false);
  });

  it('replays add and delete without duplicate consumption', () => {
    const state = applyCommand(prepared(), addMeal);
    expect(applyCommand(state, addMeal)).toEqual(state);
    const removed = applyCommand(state, { type: 'deleteMeal', id: 'meal-1' });
    expect(removed.meals).toHaveLength(0);
    expect(applyCommand(removed, { type: 'deleteMeal', id: 'meal-1' })).toEqual(removed);
  });

  it.each([0, -1, 100_001, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid quantity %s', (quantity) => {
    expect(() => applyCommand(prepared(), { ...addMeal, quantity } as Command)).toThrow();
  });
});

describe('dates and backup validation', () => {
  it('groups instants by São Paulo date at midnight and respects historical DST', () => {
    expect(dayInTimezone(now)).toBe('2026-10-16');
    expect(dayInTimezone(new Date('2026-10-17T03:00:00.000Z'))).toBe('2026-10-17');
    expect(dayInTimezone('2018-12-15T01:30:00.000Z')).toBe('2018-12-14');
    expect(dayInTimezone('2018-12-15T02:00:00.000Z')).toBe('2018-12-15');
    expect(() => dayInTimezone('invalid')).toThrow(/inválida/);
    expect(() => dayInTimezone(now, 'Invalid/Timezone')).toThrow(/Fuso/);
  });

  it('roundtrips all data including nulls without changing the original', () => {
    const state = applyCommand(completed(), addMeal);
    const original = JSON.stringify(state);
    expect(parseBackup(serializeBackup(state))).toEqual(state);
    expect(JSON.stringify(state)).toBe(original);
  });

  it('roundtrips compact Unicode JSON at the exact UTF-8 limit and rejects one extra byte', () => {
    const state = stateAtBackupLimit(MAX_BACKUP_BYTES);
    const serialized = serializeBackup(state);
    expect(serialized).toBe(JSON.stringify(state));
    expect(serialized.length).toBeLessThan(MAX_BACKUP_BYTES);
    expect(new TextEncoder().encode(serialized).byteLength).toBe(MAX_BACKUP_BYTES);
    expect(parseBackup(serialized)).toEqual(state);
    expect(() => parseBackup(`${serialized} `)).toThrow(/20 MiB/);
    state.foods[0].name = `é${'米'.repeat(119)}`;
    expect(() => serializeBackup(state)).toThrow(/20 MiB/);
  }, 15_000);

  it.each(['2026-02-29', '2026-02-30', '2026-13-01', '2026-1-01', '0000-01-01'])('rejects nonexistent or noncanonical diary date %s', (day) => {
    expect(() => applyCommand(prepared(), { ...addMeal, day } as Command)).toThrow(/data válida/);
  });

  it('accepts valid leap days without UTC conversion', () => {
    expect(applyCommand(prepared(), { ...addMeal, day: '2024-02-29' } as Command).meals[0].day).toBe('2024-02-29');
  });

  it('rejects unknown fields, versions, duplicates, broken references and invalid numeric data', () => {
    const state = prepared();
    const invalid: unknown[] = [
      { ...state, schemaVersion: 2 }, { ...state, unexpected: true }, { ...state, timezone: 'bad' },
      { ...state, exercises: [...state.exercises, state.exercises[0]] },
      { ...state, exercises: [] },
      { ...state, foods: [{ ...food, nutrients: { ...food.nutrients, calories: -1 } }] },
      { ...state, foods: [{ ...food, nutrients: { ...food.nutrients, calories: 10_001 } }] },
      { ...state, routines: [{ ...state.routines[0], exercises: [{ exerciseId: 'squat', sets: 31, reps: 10 }] }] },
      { ...state, routines: [{ ...state.routines[0], exercises: [{ exerciseId: 'squat', sets: 1, reps: 1_001 }] }] },
      { ...state, exercises: [{ ...state.exercises[0], bodyweight: 'true' }] },
      { ...state, foods: [{ ...food, id: ' rice' }] },
      { ...state, foods: [{ ...food, name: ' ' }] },
    ];
    for (const input of invalid) expect(() => parseBackup(JSON.stringify(input))).toThrow();
    expect(() => parseBackup('{')).toThrow(/JSON válido/);
  });

  it('rejects invalid session relationships and malformed completion', () => {
    const state = started();
    const session = state.sessions[0];
    const invalid = [
      { ...state, sessions: [session, { ...session, id: 'another' }] },
      { ...state, sessions: [{ ...session, day: '2026-10-17' }] },
      { ...state, sessions: [{ ...session, completedAt: later }] },
      { ...state, sessions: [{ ...session, routineId: 'missing' }] },
      { ...state, sessions: [{ ...session, startedAt: '2026-10-17T02:30:00Z' }] },
      { ...state, sessions: [{ ...session, exercises: [{ ...session.exercises[0], plannedSets: 0 }] }] },
      { ...state, sessions: [{ ...session, exercises: [{ ...session.exercises[0], plannedReps: 1_001 }] }] },
      { ...state, sessions: [{ ...session, exercises: [{ ...session.exercises[0], sets: [session.exercises[0].sets[0], session.exercises[0].sets[0]] }] }] },
    ];
    for (const input of invalid) expect(() => parseBackup(JSON.stringify(input))).toThrow();
  });
});
