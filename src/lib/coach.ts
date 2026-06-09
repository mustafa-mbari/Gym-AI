import { readinessScore } from "@/lib/adapt/signals";
import type {
  AdaptationState,
  DailyCheckin,
  Journey,
  Profile,
  WeeklyReview,
  WorkoutPlan,
} from "@/types";

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

/** Live companion context: today's check-in, this week's adaptation, journey. */
export interface CoachContext {
  todayCheckin?: DailyCheckin | null;
  adaptation?: AdaptationState | null;
  journey?: Journey | null;
  lastWeeklyReview?: WeeklyReview | null;
}

function contextLines(context: CoachContext): string[] {
  const lines: string[] = [];

  const c = context.todayCheckin;
  if (c) {
    lines.push(
      "",
      "TODAY'S CHECK-IN:",
      `- Feeling ${c.feel}; energy ${c.energy}/10, sleep ${c.sleep}/10, soreness ${c.soreness}/10 (readiness ${readinessScore(c)}/100)${c.mood ? `; mood: ${c.mood}` : ""}`
    );
  }

  const a = context.adaptation;
  if (a && a.reasons.length) {
    lines.push("", "THIS WEEK'S PLAN ADAPTATION:");
    for (const r of a.reasons) lines.push(`- ${r}`);
  }

  const j = context.journey;
  if (j) {
    const pace =
      j.pace.status === "no_data"
        ? "not enough data for a pace yet"
        : j.pace.deltaWeeks != null && Math.abs(j.pace.deltaWeeks) >= 1
          ? `${Math.abs(j.pace.deltaWeeks)} week(s) ${j.pace.deltaWeeks > 0 ? "ahead of" : "behind"} plan`
          : j.pace.status.replace("_", " ");
    lines.push(
      "",
      "JOURNEY:",
      `- ${j.progressPct}% toward the goal; pace: ${pace}${j.etaISO ? `; projected finish ${j.etaISO}` : ""}; success probability ${j.successProbability}%`
    );
    if (j.risks.length) lines.push(`- Risks: ${j.risks.join(" / ")}`);
  }

  const w = context.lastWeeklyReview;
  if (w) {
    lines.push(
      "",
      "LAST WEEK:",
      `- ${w.sessionsCompleted}/${w.sessionsPlanned} sessions${w.weightChangeKg != null ? `, weight ${w.weightChangeKg > 0 ? "+" : ""}${w.weightChangeKg} kg` : ""}, ${w.checkinDays}/7 check-ins; decision: ${w.decision.replace("_", " ")}`
    );
  }

  return lines;
}

/**
 * Build a grounding system prompt from the member's profile + active plan,
 * plus (optionally) their live companion context.
 */
export function buildCoachSystem(
  profile: Profile | null,
  plan: WorkoutPlan | null,
  context?: CoachContext
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

  if (context) {
    lines.push(...contextLines(context));
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
