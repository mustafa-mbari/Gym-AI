import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import {
  buildCoachSystem,
  COACH_MODEL,
  isCoachEnabled,
  type CoachContext,
  type CoachMessage,
} from "@/lib/coach";
import { getCompanionData } from "@/lib/queries";
import { buildJourney } from "@/lib/journey";
import { latestCompletedWeeklyReview } from "@/lib/journey/reviews";

export async function POST(request: Request) {
  if (!isCoachEnabled) {
    return NextResponse.json(
      { error: "Coach is not configured. Add ANTHROPIC_API_KEY to enable it." },
      { status: 503 }
    );
  }

  let body: { messages?: CoachMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter(
      (m): m is CoachMessage =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-12) // keep the conversation bounded
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Send a message." }, { status: 400 });
  }

  const data = await getCompanionData();
  let context: CoachContext | undefined;
  if (data) {
    const { profile, plan, adaptation, checkins, sessions, measurements, todayISO } =
      data;
    context = {
      todayCheckin: checkins.find((c) => c.date === todayISO) ?? null,
      adaptation,
      journey: buildJourney({ todayISO, profile, measurements, sessions, checkins }),
      lastWeeklyReview: latestCompletedWeeklyReview({
        todayISO,
        profile,
        plan,
        checkins,
        sessions,
        measurements,
      }),
    };
  }

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 1024,
      system: buildCoachSystem(data?.profile ?? null, data?.plan ?? null, context),
      messages: history,
    });

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply: reply || "…" });
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Coach error (${err.status}). Please try again.`
        : "Coach is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
