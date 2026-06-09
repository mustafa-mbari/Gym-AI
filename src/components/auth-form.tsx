"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  signInWithGoogle,
  signInWithPassword,
  signUp,
  type AuthState,
} from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  configured,
}: {
  mode: "login" | "signup";
  configured: boolean;
}) {
  const action = mode === "login" ? signInWithPassword : signUp;
  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(
    action,
    null
  );
  const [googlePending, startGoogle] = React.useTransition();

  function handleGoogle() {
    startGoogle(async () => {
      const res = await signInWithGoogle();
      if (res?.demo) toast.info(res.message ?? "Demo mode");
      else if (res?.error) toast.error(res.error);
    });
  }

  const continueHref = mode === "signup" ? "/onboarding" : "/dashboard";

  return (
    <div className="flex flex-col gap-5">
      {!configured && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
          <p className="font-medium">Demo mode</p>
          <p className="mt-1 text-muted-foreground">
            No backend is connected. You can still explore the entire app with
            sample data.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href={continueHref}>
              Continue to demo <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleGoogle}
        disabled={googlePending}
      >
        {googlePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              placeholder="Alex"
              autoComplete="given-name"
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 8 : undefined}
            required
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.message && !state.error && (
          <p className="rounded-md bg-primary/10 p-3 text-sm text-foreground">
            {state.message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New to JYM?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
