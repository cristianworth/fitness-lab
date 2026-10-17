import type { AppState, Meal } from '../types';

// This fixture reaches the real byte limit using valid Unicode records, without test-only limits in production.
export function stateAtBackupLimit(limit: number): AppState {
  const food = {
    id: 'food',
    name: `a${'米'.repeat(119)}`,
    unit: 'g' as const,
    nutrients: { calories: 0, protein: null, carbs: null, fat: null },
  };
  const padding = { id: 'padding', name: 'P', muscleGroup: '', bodyweight: true };
  const state: AppState = {
    schemaVersion: 1,
    timezone: 'America/Sao_Paulo',
    exercises: [padding],
    routines: [],
    sessions: [],
    foods: [food],
    meals: [],
  };
  const meal: Meal = {
    id: 'meal-00000',
    day: '2026-10-17',
    mealType: '昼'.repeat(80),
    foodId: food.id,
    foodName: '米'.repeat(120),
    unit: 'g',
    nutrients: { ...food.nutrients },
    quantity: 100,
  };
  const byteLength = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
  const emptyBytes = byteLength(state);
  const recordBytes = byteLength(meal);
  const count = Math.floor((limit - emptyBytes + 1) / (recordBytes + 1));
  state.meals = Array.from({ length: count }, (_, index) => ({
    ...meal,
    id: `meal-${String(index).padStart(5, '0')}`,
  }));
  let remaining = limit - byteLength(state);
  const unicodeBytes = (bytes: number) =>
    '米'.repeat(Math.floor(bytes / 3)) + (bytes % 3 === 2 ? 'é' : bytes % 3 === 1 ? 'a' : '');
  const muscleBytes = Math.min(360, remaining);
  padding.muscleGroup = unicodeBytes(muscleBytes);
  remaining -= muscleBytes;
  const nameBytes = Math.min(357, remaining);
  padding.name += unicodeBytes(nameBytes);
  remaining -= nameBytes;
  if (remaining > 193) throw new Error('Fixture padding exceeds the identifier limit.');
  padding.id += 'a'.repeat(remaining);
  if (byteLength(state) !== limit) throw new Error('Fixture does not match the backup byte limit.');
  return state;
}
