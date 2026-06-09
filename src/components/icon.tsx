import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * Resolve a lucide icon by its PascalCase name (the string we store in
 * `constants.ts`). Falls back to a dumbbell when the name is missing/unknown,
 * so an icon typo can never crash a screen.
 */
export function Icon({
  name,
  ...props
}: { name?: string | null } & LucideProps) {
  const map = Icons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Cmp = (name && map[name]) || Icons.Dumbbell;
  return <Cmp {...props} />;
}
