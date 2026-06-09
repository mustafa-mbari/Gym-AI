/**
 * Deterministic motivation lines, in JYM Coach's voice. Selection is keyed by
 * (date, user) via a stable hash — the message rotates daily without
 * `Math.random`, so server and client always agree and tests stay stable.
 */
import { hashString } from "@/lib/dates";

export type MessageContext =
  | "training"
  | "rest"
  | "deload"
  | "ahead"
  | "behind"
  | "low_readiness"
  | "streak"
  | "milestone_near";

export const MESSAGE_POOLS: Record<MessageContext, readonly string[]> = {
  training: [
    "The hardest set is the one that gets you through the door. See you on the floor.",
    "You don't need a perfect session — you need this session. Make it count.",
    "Every rep today is a deposit in the body you're building.",
    "Strong people aren't born on good days. They're built on average ones like today.",
    "Plan's ready, weights are waiting. The only missing piece is you.",
    "Six months from now you'll wish you'd started today. Good news: you already did.",
    "Show up, warm up, and let momentum do the rest.",
  ],
  rest: [
    "Rest is where the growth happens — today the gains come from recovering well.",
    "A walk, some water, an early night: today's workout is taking care of yourself.",
    "Muscles are torn in the gym and built on the couch. Recover on purpose.",
    "No session today — but habits don't rest. Hit your steps and your protein.",
    "Recovery isn't the absence of training. It's the half of training nobody sees.",
    "Take the day. Your next session is better because of it.",
  ],
  deload: [
    "Lighter on purpose: deload weeks are how you keep progressing for years, not weeks.",
    "Back off the load, keep the habit. This week sets up your next jump.",
    "Easy week, sharp technique. Let your body catch up with your effort.",
    "Deload weeks separate people who train for months from people who train for life.",
    "Less weight, same commitment. Recovery is part of the program.",
    "This week is a running start for the next block. Stay light, stay moving.",
  ],
  ahead: [
    "You're ahead of schedule — proof that consistency compounds. Keep stacking days.",
    "Ahead of pace. Don't sprint now; protect the routine that got you here.",
    "The plan said slower. You said otherwise. Beautiful work — stay steady.",
    "Winning weeks like these are built from boring, repeated days. More of the same.",
    "Ahead of target — enjoy it for a minute, then get back to the process.",
  ],
  behind: [
    "A bit behind pace — that's information, not failure. Today is the correction.",
    "Progress isn't a straight line. One good day starts the comeback; make it today.",
    "Forget the gap. Win today, and let the weeks take care of themselves.",
    "Behind schedule just means the finish is worth more. Keep showing up.",
    "You don't need a heroic week. You need a normal one, starting now.",
  ],
  low_readiness: [
    "Rough day? Lower the bar, not the habit. Something light still counts.",
    "Tired days build discipline the way heavy days build muscle. Move gently.",
    "Listen to your body, but don't let it negotiate you to zero. Easy effort today.",
    "Today's goal is simple: do a little, recover a lot, come back stronger tomorrow.",
    "Energy comes back. Habits, once dropped, are harder to recover. Keep it light, keep it alive.",
  ],
  streak: [
    "Your streak is the real program. Protect it like a PR.",
    "Day after day after day — that's the whole secret, and you're living it.",
    "Streaks turn motivation into identity. You're becoming someone who just does this.",
    "The chain is getting long. Don't break it for anything trivial today.",
    "Consistency like yours is rare. Keep the streak breathing.",
  ],
  milestone_near: [
    "You're knocking on a milestone's door. A few more good days and it's yours.",
    "So close to the next milestone you can taste it. Finish the approach.",
    "Milestones aren't given at the end — they're earned on days like today. Almost there.",
    "One more push and you bank a milestone. Make this week count.",
    "The next checkpoint is in sight. Steady pace, eyes forward.",
  ],
};

/** Stable per-day, per-user pick from a context's pool. */
export function pickMessage(
  ctx: MessageContext,
  dateISO: string,
  profileId: string
): string {
  const pool = MESSAGE_POOLS[ctx];
  return pool[hashString(`${dateISO}:${profileId}:${ctx}`) % pool.length];
}
