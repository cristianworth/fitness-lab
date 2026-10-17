import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { serializeBackup } from '../src/domain.ts';

// Nutrients are transcribed from TACO 4th edition, per 100 g edible portion.
// Source identifiers and missing-value conventions are documented in docs/demo-data.md.
const foodRows = [
  [3, 'Arroz tipo 1, cozido', 128, 2.5, 28.1, 0.2],
  [561, 'Feijão carioca, cozido', 76, 4.8, 13.6, 0.5],
  [410, 'Frango, peito sem pele, grelhado', 159, 32, 0, 2.5],
  [488, 'Ovo inteiro, cozido 10 minutos', 146, 13.3, 0.6, 9.5],
  [7, 'Aveia em flocos, crua', 394, 13.9, 66.6, 8.5],
  [182, 'Banana prata, crua', 98, 1.3, 26, 0.1],
  [448, 'Iogurte natural', 51, 4.1, 1.9, 3],
  [458, 'Leite de vaca integral', null, null, null, null],
  [88, 'Batata-doce, cozida', 77, 0.6, 18.4, 0.1],
  [100, 'Brócolis, cozido', 25, 2.1, 4.4, 0.5],
  [260, 'Azeite de oliva extravirgem', 884, null, null, 100],
  [225, 'Mamão Formosa, cru', 45, 0.8, 11.6, 0.1],
];

// Each row explicitly describes fictional loads across twelve exposures.
const exerciseRows = [
  [
    'goblet',
    'Agachamento goblet',
    'Pernas',
    false,
    [16, 16, 16, 18, 18, 18, 16, 18, 18, 20, 20, 20],
  ],
  [
    'bench',
    'Supino reto com barra',
    'Peito',
    false,
    [30, 30, 30, 32.5, 32.5, 32.5, 30, 32.5, 32.5, 35, 35, 35],
  ],
  [
    'row',
    'Remada sentada na máquina',
    'Costas',
    false,
    [25, 25, 25, 27.5, 27.5, 27.5, 25, 27.5, 27.5, 30, 30, 30],
  ],
  [
    'rdl',
    'Levantamento romeno com barra',
    'Posterior de coxa',
    false,
    [30, 30, 30, 32.5, 32.5, 35, 30, 35, 35, 35, 37.5, 37.5],
  ],
  ['crunch', 'Abdominal no solo', 'Abdômen', true, Array(12).fill(0)],
  [
    'press',
    'Leg press na mesma máquina',
    'Pernas',
    false,
    [60, 60, 60, 65, 65, 65, 60, 60, 65, 65, 70, 70],
  ],
  [
    'dumbbell',
    'Supino com halteres (soma)',
    'Peito',
    false,
    [20, 20, 20, 22, 22, 22, 20, 20, 22, 22, 24, 24],
  ],
  [
    'pulldown',
    'Puxada frontal na máquina',
    'Costas',
    false,
    [25, 25, 25, 27.5, 27.5, 27.5, 25, 25, 27.5, 27.5, 30, 30],
  ],
  [
    'hip',
    'Elevação pélvica com barra',
    'Glúteos',
    false,
    [30, 30, 30, 32.5, 32.5, 35, 30, 30, 35, 35, 37.5, 37.5],
  ],
  ['calf', 'Panturrilha em pé sem carga', 'Panturrilhas', true, Array(12).fill(0)],
];

export function buildDemo() {
  const exercises = exerciseRows.map(([id, name, muscleGroup, bodyweight]) => ({
    id: `demo-exercise-${id}`,
    name,
    muscleGroup,
    bodyweight,
  }));
  const routines = ['A', 'B'].map((letter, index) => ({
    id: `demo-routine-${letter.toLowerCase()}`,
    name: `DEMO · Corpo inteiro ${letter}`,
    description:
      'Histórico fictício de 24/08 a 17/10/2026. Alternância A/B, 3 dias por semana. Exemplo de registro, não prescrição. 2–3 séries de 8–12 repetições; descanso simulado de 90–120 s. Barra inclui seu peso; dois halteres usam a soma; máquina usa o indicador da mesma máquina. Fontes e contexto: docs/demo-data.md.',
    exercises: exercises
      .slice(index * 5, index * 5 + 5)
      .map((exercise) => ({ exerciseId: exercise.id, sets: 3, reps: 10 })),
  }));
  const foods = foodRows.map(([id, name, calories, protein, carbs, fat]) => ({
    id: `demo-food-taco-${id}`,
    name: `${name} · TACO ${id}`,
    unit: 'g',
    nutrients: { calories, protein, carbs, fat },
  }));
  const sessions = [];
  const meals = [];
  const exposures = [0, 0];
  for (let offset = 0; offset < 55; offset++) {
    const day = new Date(Date.UTC(2026, 7, 24 + offset)).toISOString().slice(0, 10);
    const week = Math.floor(offset / 7);
    const weekday = offset % 7;
    if ([0, 2, 4].includes(weekday)) {
      const routineIndex = sessions.length % 2;
      const exposure = exposures[routineIndex]++;
      const routine = routines[routineIndex];
      const sessionId = `demo-session-${day}`;
      const setCount = week < 2 || week === 4 ? 2 : 3;
      // A lighter fifth week is a narrative choice, not a mandatory training rule.
      const baseReps = [9, 10, 12, 9, 10, 12, 10, 10, 12, 9, 10, 11][exposure];
      sessions.push({
        id: sessionId,
        routineId: routine.id,
        routineName: routine.name,
        startedAt: `${day}T21:00:00.000Z`,
        completedAt: `${day}T21:${setCount === 2 ? '40' : '55'}:00.000Z`,
        day,
        exercises: routine.exercises.map((item, index) => {
          const exerciseIndex = routineIndex * 5 + index;
          const exercise = exercises[exerciseIndex];
          return {
            exerciseId: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            bodyweight: exercise.bodyweight,
            plannedSets: setCount,
            plannedReps: baseReps,
            sets: Array.from({ length: setCount }, (_, setIndex) => {
              const skipped = offset === 23 && index === 4 && setIndex === 2;
              return {
                id: `${sessionId}-${index}-${setIndex}`,
                reps: skipped ? null : Math.max(8, baseReps - (setIndex === 2 ? 1 : 0)),
                weight: skipped ? null : exerciseRows[exerciseIndex][4][exposure],
                completed: !skipped,
              };
            }),
          };
        }),
      });
    }
    const variation = [0, 20, -10, 30, 10, -20, 0][weekday];
    const menu = [
      ['Café da manhã', 448, 170],
      ['Café da manhã', 7, 60],
      ['Café da manhã', 182, 100 + variation],
      ['Almoço', 3, 180 + variation],
      ['Almoço', 561, 140],
      ['Almoço', 410, 150],
      ['Almoço', 100, 100],
      ['Almoço', 260, 8],
      ['Lanche', 225, 180],
      ['Lanche', 448, 170],
      ['Lanche', 7, 30],
      ['Jantar', weekday % 2 ? 88 : 3, weekday % 2 ? 250 : 150],
      ['Jantar', 561, 100],
      ['Jantar', 488, weekday === 6 ? 150 : 100],
      ['Jantar', 100, 120],
      ['Jantar', 260, 5],
      ['Ceia', 182, 100],
    ];
    // The last day contains breakfast and lunch only; no future meals are implied.
    for (const [mealType, foodNumber, quantity] of offset === 54 ? menu.slice(0, 8) : menu) {
      const food = foods.find((item) => item.id === `demo-food-taco-${foodNumber}`);
      meals.push({
        id: `demo-meal-${day}-${meals.length}`,
        day,
        mealType: `${mealType} · DEMO`,
        foodId: food.id,
        foodName: food.name,
        unit: food.unit,
        nutrients: { ...food.nutrients },
        quantity,
      });
    }
  }
  return {
    schemaVersion: 1,
    timezone: 'America/Sao_Paulo',
    exercises,
    routines,
    sessions,
    foods,
    meals,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination = new URL('../public/demo/fitness-lab-demo.json', import.meta.url);
  const state = buildDemo();
  await mkdir(new URL('.', destination), { recursive: true });
  await writeFile(destination, serializeBackup(state) + '\n', 'utf8');
  console.log(
    `Demo generated: ${state.sessions.length} sessions, ${state.meals.length} food entries. ${fileURLToPath(destination)}`,
  );
}
