import type { Profile, WorkoutPlan } from "@/types";

/** The coach is enabled only when an Anthropic API key is present. */
export const isCoachEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

/**
 * Model used for the coach. Configurable via env so the deployer chooses the
 * cost/capability tradeoff; defaults to a fast, capable chat model.
 */
export const COACH_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

/** Build a grounding system prompt from the member's profile + active plan. */
export function buildCoachSystem(
  profile: Profile | null,
  plan: WorkoutPlan | null
): string {
  const lines: string[] = [
    "You are JYM Coach — a friendly, knowledgeable personal trainer inside the JYM fitness app.",
    "",
    "Coach the member using their real profile and plan below. Be specific, encouraging and practical.",
  ];

  if (profile) {
    lines.push(
      "",
      "MEMBER PROFILE:",
      `- Name: ${profile.first_name ?? "the member"}`,
      `- Goals: ${profile.goals.join(", ") || "general fitness"}`,
      `- Experience: ${profile.training_experience ?? "beginner"}`,
      `- Schedule: ${profile.available_days ?? 3} days/week, ~${profile.session_minutes ?? 60} min/session`,
      `- Training location: ${profile.gym_access ?? "full gym"}`
    );
    if (profile.injuries.length) {
      lines.push(`- Injuries to work around: ${profile.injuries.join(", ")}`);
    }
  }

  if (plan) {
    lines.push(
      "",
      "ACTIVE PLAN:",
      `- ${plan.name} (${plan.split_type.replace(/_/g, " ")}, ${plan.weeks}-week block)`,
      `- Days: ${plan.days.map((d) => `${d.name} (${d.focus})`).join("; ")}`
    );
  }

  lines.push(
    "",
    "GUIDELINES:",
    "- Keep answers concise — a short paragraph or a tight bulleted list.",
    "- Tie advice to their actual plan, goals and equipment when relevant.",
    "- Stay on topic: training, technique, programming, recovery, motivation and general nutrition.",
    "- You are not a medical professional. For pain, injury or medical concerns, recommend seeing a qualified professional — never diagnose or prescribe.",
    "- Be warm and motivating, never preachy."
  );

  return lines.join("\n");
}
