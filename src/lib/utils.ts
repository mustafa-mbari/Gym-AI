import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes intelligently (conditional + de-duped). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
