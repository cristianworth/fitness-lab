export type Nutrients = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};
export type Exercise = { id: string; name: string; muscleGroup: string; bodyweight: boolean };
export type RoutineItem = { exerciseId: string; sets: number; reps: number };
export type Routine = { id: string; name: string; description: string; exercises: RoutineItem[] };
export type WorkoutSet = {
  id: string;
  reps: number | null;
  weight: number | null;
  completed: boolean;
};
export type SessionExercise = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  bodyweight: boolean;
  plannedSets: number;
  plannedReps: number;
  sets: WorkoutSet[];
};
export type Session = {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: string;
  completedAt: string | null;
  day: string;
  exercises: SessionExercise[];
};
export type Food = { id: string; name: string; unit: 'g' | 'ml'; nutrients: Nutrients };
export type Meal = {
  id: string;
  day: string;
  mealType: string;
  foodId: string;
  foodName: string;
  unit: 'g' | 'ml';
  nutrients: Nutrients;
  quantity: number;
};
export type AppState = {
  schemaVersion: 1;
  timezone: string;
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  foods: Food[];
  meals: Meal[];
};
export type Command =
  | { type: 'saveExercise'; exercise: Exercise }
  | { type: 'saveRoutine'; routine: Routine }
  | { type: 'startSession'; routineId: string; id: string; now: string }
  | { type: 'saveSet'; sessionId: string; exerciseIndex: number; set: WorkoutSet }
  | { type: 'addSet'; sessionId: string; exerciseIndex: number; id: string }
  | { type: 'finishSession'; sessionId: string; now: string }
  | { type: 'saveFood'; food: Food }
  | { type: 'addMeal'; id: string; day: string; mealType: string; foodId: string; quantity: number }
  | { type: 'editMeal'; id: string; day: string; mealType: string; quantity: number }
  | { type: 'deleteMeal'; id: string };
export type Dispatch = (command: Command) => Promise<boolean>;
export type PageProps = { state: AppState; dispatch: Dispatch; busy: boolean; day: string };
