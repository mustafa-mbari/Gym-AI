"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Loader2, LogOut, Monitor, Moon, RefreshCw, Save, Sun } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChoiceGroup, type ChoiceOption } from "@/components/onboarding/choice";
import { SliderField, Stepper, WeightField } from "@/components/onboarding/fields";
import { clearDemoProfile, updateProfile } from "@/lib/profile-actions";
import { signOut } from "@/lib/auth-actions";
import {
  EQUIPMENT_TYPES,
  GOALS,
  GYM_ACCESS_OPTIONS,
  INJURY_OPTIONS,
  TRAINING_EXPERIENCES,
  UNIT_SYSTEMS,
} from "@/lib/constants";
import type { ProfileUpdate } from "@/lib/validations";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

export function SettingsForm({
  profile,
  email,
  demo,
}: {
  profile: Profile;
  email?: string | null;
  demo: boolean;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState<ProfileUpdate>({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    unit_system: profile.unit_system,
    weight_kg: profile.weight_kg ?? 80,
    target_weight_kg: profile.target_weight_kg ?? 75,
    gym_access: profile.gym_access ?? "full_gym",
    training_experience: profile.training_experience ?? "beginner",
    available_equipment: profile.available_equipment ?? [],
    available_days: profile.available_days ?? 3,
    session_minutes: profile.session_minutes ?? 60,
    goals: profile.goals ?? [],
    injuries: profile.injuries ?? [],
  });

  const set = <K extends keyof ProfileUpdate>(key: K, value: ProfileUpdate[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const showEquipment =
    form.gym_access === "home_gym" || form.gym_access === "bodyweight";

  async function save() {
    setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    if (res.ok) {
      toast.success(res.demo ? "Saved (demo mode)." : "Settings saved.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not save settings.");
    }
  }

  const THEMES = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "system", label: "System", Icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fn">First name</Label>
              <Input
                id="fn"
                value={form.first_name ?? ""}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ln">Last name</Label>
              <Input
                id="ln"
                value={form.last_name ?? ""}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Units</Label>
            <ChoiceGroup
              options={UNIT_SYSTEMS}
              value={form.unit_system ?? "metric"}
              onChange={(v) => set("unit_system", v)}
              columns={2}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <WeightField
              label="Current weight"
              valueKg={form.weight_kg ?? 80}
              unit={form.unit_system ?? "metric"}
              onChange={(kg) => set("weight_kg", kg)}
            />
            <WeightField
              label="Target weight"
              valueKg={form.target_weight_kg ?? 75}
              unit={form.unit_system ?? "metric"}
              onChange={(kg) => set("target_weight_kg", kg)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Training */}
      <Card>
        <CardHeader>
          <CardTitle>Training</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label>Experience</Label>
            <ChoiceGroup
              options={TRAINING_EXPERIENCES}
              value={form.training_experience ?? "beginner"}
              onChange={(v) => set("training_experience", v)}
              columns={2}
            />
          </div>
          <div className="grid gap-2">
            <Label>Gym access</Label>
            <ChoiceGroup
              options={GYM_ACCESS_OPTIONS}
              value={form.gym_access ?? "full_gym"}
              onChange={(v) => set("gym_access", v)}
              columns={2}
            />
          </div>
          {showEquipment && (
            <div className="grid gap-2">
              <Label>Available equipment</Label>
              <ChoiceGroup
                options={EQUIPMENT_TYPES}
                value={form.available_equipment ?? []}
                onChange={(v) => set("available_equipment", v)}
                multi
                columns={2}
              />
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Stepper
              label="Training days / week"
              value={form.available_days ?? 3}
              min={2}
              max={6}
              suffix="days"
              onChange={(v) => set("available_days", v)}
            />
            <SliderField
              label="Time per session"
              value={form.session_minutes ?? 60}
              min={20}
              max={120}
              step={5}
              format={(v) => `${v} min`}
              onChange={(v) => set("session_minutes", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals & health */}
      <Card>
        <CardHeader>
          <CardTitle>Goals &amp; health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label>Goals</Label>
            <ChoiceGroup
              options={GOALS}
              value={form.goals ?? []}
              onChange={(v) => set("goals", v)}
              multi
              columns={2}
            />
          </div>
          <div className="grid gap-2">
            <Label>Injuries / problem areas</Label>
            <ChoiceGroup
              options={INJURY_OPTIONS as readonly ChoiceOption[]}
              value={form.injuries ?? []}
              onChange={(v) => set("injuries", v)}
              multi
              columns={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors",
                  theme === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/40"
                )}
              >
                <t.Icon className="size-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {email && (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium">{email}</span>
            </p>
          )}
          <Separator />
          <div className="flex flex-wrap gap-3">
            {demo && (
              <Button
                variant="outline"
                onClick={() => {
                  void clearDemoProfile().then(() => {
                    toast.success("Demo data reset.");
                    router.push("/onboarding");
                  });
                }}
              >
                <RefreshCw className="size-4" /> Reset demo data
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
