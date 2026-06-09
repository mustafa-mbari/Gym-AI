import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { buildCoachSystem, COACH_MODEL, isCoachEnabled } from "@/lib/coach";
import { getCompanionData } from "@/lib/queries";
import { loadSchedule } from "@/lib/schedule-actions";
import { buildDailyBrief } from "@/lib/daily";
import { buildJourney } from "@/lib/journey";

/**
 * One personalised motivating sentence for the Today hub. Optional layer on
 * top of the deterministic message — returns `{ message: null }` whenever the
 * coach isn't configured so the client silently keeps the fallback.
 */
export async function GET() {
  if (!isCoachEnabled) {
    return NextResponse.json({ message: null });
  }

  const [data, schedule] = await Promise.all([
    getCompanionData(),
    loadSchedule(),
  ]);
  if (!data) return NextResponse.json({ message: null });

  const { profile, plan, adaptation, checkins, sessions, measurements, todayISO } =
    data;
  const journey = buildJourney({
    todayISO,
    profile,
    measurements,
    sessions,
    checkins,
  });
  const todayCheckin = checkins.find((c) => c.date === todayISO) ?? null;
  const brief = buildDailyBrief({
    todayISO,
    profile,
    plan,
    adaptation,
    journey,
    todayCheckin,
    checkins,
    sessions,
    schedule,
  });

  const system = [
    buildCoachSystem(profile, plan, { todayCheckin, adaptation, journey }),
    "",
    "TODAY'S BRIEF:",
    `- Objective: ${brief.objective}`,
    `- Workout: ${
      brief.workout.kind === "training"
        ? `${brief.workout.name} (${brief.workout.focus})`
        : brief.workout.kind
    }`,
    `- Check-in streak: ${brief.streak.checkinStreakDays} days`,
    "",
    "TASK: Reply with EXACTLY ONE short motivating sentence (max 25 words) for this member, grounded in the context above. No greeting, no emoji, no quotes — just the sentence.",
  ].join("\n");

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 100,
      system,
      messages: [{ role: "user", content: "My one-liner for today, coach?" }],
    });
    const message = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join(" ")
      .trim();
    return NextResponse.json({ message: message || null });
  } catch {
    return NextResponse.json({ message: null });
  }
}
