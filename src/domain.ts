import { z } from 'zod';
import type { AppState, Command, Meal, Nutrients, Session, WorkoutSet } from './types';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

const id = z
  .string()
  .min(1)
  .max(200)
  .refine((value) => value.trim() === value, 'Identificador inválido.');
const name = z
  .string()
  .min(1)
  .max(120)
  .refine((value) => value.trim().length > 0, 'Informe um nome.');
const text = z.string().max(2_000);
const mealType = z
  .string()
  .min(1)
  .max(80)
  .refine((value) => value.trim().length > 0, 'Informe a refeição.');
const count = (max: number) => z.number().finite().int().min(1).max(max);
const nonnegative = (max: number) => z.number().finite().min(0).max(max);
const quantity = z.number().finite().positive().max(100_000);
const nutrient = nonnegative(10_000).nullable();
const nutrientsSchema = z
  .object({ calories: nutrient, protein: nutrient, carbs: nutrient, fat: nutrient })
  .strict();
const unit = z.enum(['g', 'ml']);
const daySchema = z.string().refine(isDay, 'Informe uma data válida no formato AAAA-MM-DD.');
const instant = z.string().refine((value) => {
  const date = new Date(value);
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString() === value
  );
}, 'Informe um instante ISO UTC válido.');
const timezoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Fuso horário inválido.');
const exerciseSchema = z
  .object({ id, name, muscleGroup: z.string().max(120), bodyweight: z.boolean() })
  .strict();
const routineItemSchema = z
  .object({ exerciseId: id, sets: count(30), reps: count(1_000) })
  .strict();
const routineSchema = z
  .object({ id, name, description: text, exercises: z.array(routineItemSchema).min(1).max(50) })
  .strict();
const setSchema = z
  .object({
    id,
    reps: nonnegative(1_000).int().nullable(),
    weight: nonnegative(2_000).nullable(),
    completed: z.boolean(),
  })
  .strict()
  .refine(
    (set) => !set.completed || (set.reps !== null && set.reps > 0 && set.weight !== null),
    'Série concluída precisa de repetições maiores que zero e carga conhecida (zero é permitido).',
  );
const sessionExerciseSchema = z
  .object({
    exerciseId: id,
    name,
    muscleGroup: z.string().max(120),
    bodyweight: z.boolean(),
    plannedSets: count(30),
    plannedReps: count(1_000),
    sets: z.array(setSchema).min(1).max(100),
  })
  .strict();
const sessionSchema = z
  .object({
    id,
    routineId: id,
    routineName: name,
    startedAt: instant,
    completedAt: instant.nullable(),
    day: daySchema,
    exercises: z.array(sessionExerciseSchema).min(1).max(50),
  })
  .strict();
const foodSchema = z.object({ id, name, unit, nutrients: nutrientsSchema }).strict();
const mealSchema = z
  .object({
    id,
    day: daySchema,
    mealType,
    foodId: id,
    foodName: name,
    unit,
    nutrients: nutrientsSchema,
    quantity,
  })
  .strict();
const stateSchema = z
  .object({
    schemaVersion: z.literal(1),
    timezone: timezoneSchema,
    exercises: z.array(exerciseSchema).max(5_000),
    routines: z.array(routineSchema).max(2_000),
    sessions: z.array(sessionSchema).max(10_000),
    foods: z.array(foodSchema).max(10_000),
    meals: z.array(mealSchema).max(100_000),
  })
  .strict()
  .superRefine((state, context) => {
    const fail = (message: string) => context.addIssue({ code: 'custom', message });
    for (const collection of [
      state.exercises,
      state.routines,
      state.sessions,
      state.foods,
      state.meals,
    ]) {
      if (new Set(collection.map((item) => item.id)).size !== collection.length)
        fail('Existem identificadores duplicados.');
    }
    const exerciseIds = new Set(state.exercises.map((exercise) => exercise.id));
    const routineIds = new Set(state.routines.map((routine) => routine.id));
    const foodIds = new Set(state.foods.map((food) => food.id));
    for (const routine of state.routines) {
      if (routine.exercises.some((item) => !exerciseIds.has(item.exerciseId)))
        fail('Rotina referencia exercício inexistente.');
    }
    if (state.sessions.filter((session) => session.completedAt === null).length > 1)
      fail('Só pode existir um treino em andamento.');
    for (const session of state.sessions) {
      if (!routineIds.has(session.routineId)) fail('Treino referencia rotina inexistente.');
      if (session.exercises.some((item) => !exerciseIds.has(item.exerciseId)))
        fail('Treino referencia exercício inexistente.');
      const setIds = session.exercises.flatMap((item) => item.sets.map((set) => set.id));
      if (new Set(setIds).size !== setIds.length)
        fail('Existem identificadores de série duplicados no treino.');
      if (dayInTimezone(session.startedAt, state.timezone) !== session.day)
        fail('Dia do treino difere do início no fuso configurado.');
      if (session.completedAt !== null) {
        if (session.completedAt < session.startedAt)
          fail('Conclusão do treino não pode ser anterior ao início.');
        if (!session.exercises.some((item) => item.sets.some((set) => set.completed)))
          fail('Treino concluído precisa de pelo menos uma série feita.');
      }
    }
    if (state.meals.some((meal) => !foodIds.has(meal.foodId)))
      fail('Consumo referencia alimento inexistente.');
  });

const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('saveExercise'), exercise: exerciseSchema }).strict(),
  z.object({ type: z.literal('saveRoutine'), routine: routineSchema }).strict(),
  z.object({ type: z.literal('startSession'), routineId: id, id, now: instant }).strict(),
  z
    .object({
      type: z.literal('saveSet'),
      sessionId: id,
      exerciseIndex: nonnegative(49).int(),
      set: setSchema,
    })
    .strict(),
  z
    .object({ type: z.literal('addSet'), sessionId: id, exerciseIndex: nonnegative(49).int(), id })
    .strict(),
  z.object({ type: z.literal('finishSession'), sessionId: id, now: instant }).strict(),
  z.object({ type: z.literal('saveFood'), food: foodSchema }).strict(),
  z
    .object({ type: z.literal('addMeal'), id, day: daySchema, mealType, foodId: id, quantity })
    .strict(),
  z.object({ type: z.literal('editMeal'), id, day: daySchema, mealType, quantity }).strict(),
  z.object({ type: z.literal('deleteMeal'), id }).strict(),
]);

function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const location = issue.path.length ? ` em ${issue.path.join('.')}` : '';
  throw new Error(
    issue.code === 'custom'
      ? issue.message
      : `Dados inválidos${location}. Confira o formato e os limites dos campos.`,
  );
}

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    timezone: 'America/Sao_Paulo',
    exercises: [],
    routines: [],
    sessions: [],
    foods: [],
    meals: [],
  };
}

export function dayInTimezone(date: Date | string, timezone = 'America/Sao_Paulo'): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(parsed.getTime())) throw new Error('Data inválida.');
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(parsed);
  } catch {
    throw new Error('Fuso horário inválido.');
  }
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`;
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [...items, item];
}

function getSession(state: AppState, sessionId: string): Session {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error('Treino não encontrado.');
  return session;
}

function requireActive(session: Session): void {
  if (session.completedAt !== null) throw new Error('Treinos concluídos não podem ser alterados.');
}

export function applyCommand(input: AppState, inputCommand: Command): AppState {
  const state: AppState = parse(stateSchema, input);
  const command = parse(commandSchema, inputCommand);
  let next: AppState = state;
  switch (command.type) {
    case 'saveExercise':
      next = { ...state, exercises: upsert(state.exercises, command.exercise) };
      break;
    case 'saveRoutine':
      next = { ...state, routines: upsert(state.routines, command.routine) };
      break;
    case 'saveFood':
      next = { ...state, foods: upsert(state.foods, command.food) };
      break;
    case 'startSession': {
      if (state.sessions.some((session) => session.id === command.id)) return state;
      if (state.sessions.some((session) => session.completedAt === null))
        throw new Error('Já existe um treino em andamento. Continue ou conclua esse treino.');
      const routine = state.routines.find((item) => item.id === command.routineId);
      if (!routine) throw new Error('Rotina não encontrada.');
      const session: Session = {
        id: command.id,
        routineId: routine.id,
        routineName: routine.name,
        startedAt: command.now,
        completedAt: null,
        day: dayInTimezone(command.now, state.timezone),
        exercises: routine.exercises.map((item, exerciseIndex) => {
          const exercise = state.exercises.find((existing) => existing.id === item.exerciseId)!;
          return {
            exerciseId: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            bodyweight: exercise.bodyweight,
            plannedSets: item.sets,
            plannedReps: item.reps,
            sets: Array.from({ length: item.sets }, (_, setIndex): WorkoutSet => ({
              id: `planned:${exerciseIndex}:${setIndex}`,
              reps: item.reps,
              weight: exercise.bodyweight ? 0 : null,
              completed: false,
            })),
          };
        }),
      };
      next = { ...state, sessions: [...state.sessions, session] };
      break;
    }
    case 'saveSet':
    case 'addSet': {
      const session = getSession(state, command.sessionId);
      const exercise = session.exercises[command.exerciseIndex];
      if (!exercise) throw new Error('Exercício do treino não encontrado.');
      if (
        command.type === 'addSet' &&
        session.exercises.some((item) => item.sets.some((set) => set.id === command.id))
      )
        return state;
      requireActive(session);
      let sets: WorkoutSet[];
      if (command.type === 'saveSet') {
        if (!exercise.sets.some((set) => set.id === command.set.id))
          throw new Error('Série não encontrada.');
        sets = exercise.sets.map((set) => (set.id === command.set.id ? command.set : set));
      } else {
        sets = [
          ...exercise.sets,
          { id: command.id, reps: null, weight: exercise.bodyweight ? 0 : null, completed: false },
        ];
      }
      const updated = {
        ...session,
        exercises: session.exercises.map((item, index) =>
          index === command.exerciseIndex ? { ...item, sets } : item,
        ),
      };
      next = {
        ...state,
        sessions: state.sessions.map((item) => (item.id === session.id ? updated : item)),
      };
      break;
    }
    case 'finishSession': {
      const session = getSession(state, command.sessionId);
      if (session.completedAt !== null) return state;
      if (!session.exercises.some((exercise) => exercise.sets.some((set) => set.completed)))
        throw new Error('Conclua pelo menos uma série válida antes de finalizar o treino.');
      next = {
        ...state,
        sessions: state.sessions.map((item) =>
          item.id === session.id ? { ...item, completedAt: command.now } : item,
        ),
      };
      break;
    }
    case 'addMeal': {
      if (state.meals.some((meal) => meal.id === command.id)) return state;
      const food = state.foods.find((item) => item.id === command.foodId);
      if (!food) throw new Error('Alimento não encontrado.');
      const meal: Meal = {
        id: command.id,
        day: command.day,
        mealType: command.mealType,
        quantity: command.quantity,
        foodId: food.id,
        foodName: food.name,
        unit: food.unit,
        nutrients: { ...food.nutrients },
      };
      next = { ...state, meals: [...state.meals, meal] };
      break;
    }
    case 'editMeal': {
      if (!state.meals.some((meal) => meal.id === command.id))
        throw new Error('Consumo não encontrado.');
      next = {
        ...state,
        meals: state.meals.map((meal) =>
          meal.id === command.id
            ? {
                ...meal,
                day: command.day,
                mealType: command.mealType,
                quantity: command.quantity,
              }
            : meal,
        ),
      };
      break;
    }
    case 'deleteMeal':
      next = { ...state, meals: state.meals.filter((meal) => meal.id !== command.id) };
      break;
  }
  return parse(stateSchema, next);
}

const nutrientKeys = ['calories', 'protein', 'carbs', 'fat'] as const;

export function mealNutrients(meal: Meal): Nutrients {
  return Object.fromEntries(
    nutrientKeys.map((key) => [
      key,
      meal.nutrients[key] === null ? null : (meal.nutrients[key] * meal.quantity) / 100,
    ]),
  ) as Nutrients;
}

export function dailyNutrients(meals: Meal[]): { totals: Nutrients; incomplete: boolean } {
  const totals: Nutrients = { calories: null, protein: null, carbs: null, fat: null };
  let incomplete = false;
  for (const meal of meals) {
    const nutrients = mealNutrients(meal);
    for (const key of nutrientKeys) {
      if (nutrients[key] === null) incomplete = true;
      else totals[key] = (totals[key] ?? 0) + nutrients[key];
    }
  }
  return { totals, incomplete };
}

export function parseBackup(text: string): AppState {
  requireBackupSize(text);
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error('Backup inválido: o arquivo precisa conter JSON válido.');
  }
  return parse(stateSchema, input);
}

export function serializeBackup(state: AppState): string {
  const result = JSON.stringify(parse(stateSchema, state));
  requireBackupSize(result);
  return result;
}

function requireBackupSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error('Backup excede o limite de 20 MiB.');
}
