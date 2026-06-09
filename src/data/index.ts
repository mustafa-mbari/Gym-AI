import type { Equipment, Exercise } from "@/types";
import { EQUIPMENT } from "./equipment";
import { EXERCISES } from "./exercises";

export { EQUIPMENT, EXERCISES };

const exerciseBySlug = new Map(EXERCISES.map((e) => [e.slug, e]));
const equipmentBySlug = new Map(EQUIPMENT.map((e) => [e.slug, e]));

export const getExercise = (slug: string): Exercise | undefined =>
  exerciseBySlug.get(slug);

export const getEquipment = (slug: string): Equipment | undefined =>
  equipmentBySlug.get(slug);

/** Machines in the catalog that can perform a given exercise. */
export const equipmentForExercise = (slug: string): Equipment[] =>
  EQUIPMENT.filter((e) => e.exercises.includes(slug));

/** Exercises a given machine supports. */
export const exercisesForEquipment = (equipment: Equipment): Exercise[] =>
  equipment.exercises
    .map((s) => exerciseBySlug.get(s))
    .filter((e): e is Exercise => Boolean(e));
