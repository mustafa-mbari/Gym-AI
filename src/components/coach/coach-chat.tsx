"use client";

import * as React from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CoachMessage } from "@/lib/coach";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How should I progress on my plan?",
  "Give me form tips for the squat",
  "I'm sore today — should I still train?",
  "What should I eat after a workout?",
];

export function CoachChat({ enabled }: { enabled: boolean }) {
  const [messages, setMessages] = React.useState<CoachMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const next = [...messages, { role: "user", content } as CoachMessage];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Coach is unavailable.");
      setMessages((m) => m.slice(0, -1)); // roll back the user bubble
      setInput(content);
    } finally {
      setPending(false);
    }
  }

  if (!enabled) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">AI Coach is available</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Add an <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code>{" "}
              to your environment to chat with a personal coach that knows your
              plan and goals. Optionally set{" "}
              <code className="rounded bg-muted px-1">ANTHROPIC_MODEL</code> to
              pick the model.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="size-7" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Ask JYM Coach</h2>
              <p className="text-sm text-muted-foreground">
                Your AI trainer knows your plan, goals and equipment.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-card px-3.5 py-2 text-sm transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && (
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4.5" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {pending && (
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4.5" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t bg-background pt-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach anything…"
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
