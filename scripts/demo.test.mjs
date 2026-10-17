import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildDemo } from './generate-demo.mjs';
import { parseBackup, serializeBackup, mealNutrients } from '../src/domain.ts';

describe('researched demonstration dataset', () => {
  it('ships the reproducible, importable dataset with valid references and dates', () => {
    const demo = buildDemo();
    expect(parseBackup(serializeBackup(demo))).toEqual(demo);
    expect(
      parseBackup(
        readFileSync(new URL('../public/demo/fitness-lab-demo.json', import.meta.url), 'utf8'),
      ),
    ).toEqual(demo);
    expect(demo.sessions).toHaveLength(24);
    expect(demo.sessions[0].day).toBe('2026-08-24');
    expect(demo.sessions.at(-1).day).toBe('2026-10-16');
    expect(new Set(demo.meals.map((meal) => meal.day)).size).toBe(55);
    expect(
      demo.sessions.every(
        (session) => session.completedAt && session.routineName.startsWith('DEMO'),
      ),
    ).toBe(true);
    expect(demo.meals.every((meal) => meal.mealType.endsWith('DEMO'))).toBe(true);
  });

  it('includes plateaus, a lighter week and gradual strength progression without estimating body composition', () => {
    const demo = buildDemo();
    const bench = demo.sessions.flatMap((session) =>
      session.exercises.filter((exercise) => exercise.exerciseId === 'demo-exercise-bench'),
    );
    const loads = bench.map((exercise) => exercise.sets[0].weight);
    expect(loads[0]).toBe(30);
    expect(loads.at(-1)).toBe(35);
    expect(loads.some((load, index) => index > 0 && load < loads[index - 1])).toBe(true);
    expect(loads.some((load, index) => index > 0 && load === loads[index - 1])).toBe(true);
    expect(
      demo.sessions
        .flatMap((session) => session.exercises.flatMap((exercise) => exercise.sets))
        .filter((set) => !set.completed),
    ).toHaveLength(1);
    expect(
      demo.sessions
        .flatMap((session) => session.exercises.filter((exercise) => exercise.bodyweight))
        .every((exercise) =>
          exercise.sets.filter((set) => set.completed).every((set) => set.weight === 0),
        ),
    ).toBe(true);
  });

  it('keeps TACO grams and unknown nutrients distinct from zero and scales serving nutrients', () => {
    const demo = buildDemo();
    expect(demo.foods.every((food) => food.unit === 'g')).toBe(true);
    expect(demo.foods.find((food) => food.id === 'demo-food-taco-458').nutrients).toEqual({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
    expect(
      demo.foods.find((food) => food.id === 'demo-food-taco-260').nutrients.protein,
    ).toBeNull();
    const chicken = demo.meals.find((meal) => meal.foodId === 'demo-food-taco-410');
    expect(mealNutrients(chicken)).toEqual({ calories: 238.5, protein: 48, carbs: 0, fat: 3.75 });
  });
});
