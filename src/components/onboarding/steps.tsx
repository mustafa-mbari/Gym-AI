"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChoiceGroup, type ChoiceOption } from "@/components/onboarding/choice";
import {
  FieldShell,
  HeightField,
  LengthField,
  NumberField,
  SliderField,
  Stepper,
  WeightField,
} from "@/components/onboarding/fields";
import { useOnboardingStore } from "@/stores/onboarding-store";
import {
  DAILY_ACTIVITY_OPTIONS,
  DIET_TYPES,
  EQUIPMENT_TYPES,
  GENDERS,
  GOALS,
  GYM_ACCESS_OPTIONS,
  INJURY_OPTIONS,
  POPULAR_COUNTRIES,
  POPULAR_LANGUAGES,
  SLEEP_QUALITIES,
  TRAINING_EXPERIENCES,
  UNIT_SYSTEMS,
  WORK_TYPES,
} from "@/lib/constants";

type StepProps = { errors?: Record<string, string> };

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function StepPersonal({ errors }: StepProps) {
  const { data, update } = useOnboardingStore();
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label>Units</Label>
        <ChoiceGroup
          options={UNIT_SYSTEMS}
          value={data.unit_system}
          onChange={(v) => update({ unit_system: v })}
          columns={2}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell label="First name" error={errors?.first_name} htmlFor="fn">
          <Input
            id="fn"
            value={data.first_name}
            placeholder="Alex"
            onChange={(e) => update({ first_name: e.target.value })}
          />
        </FieldShell>
        <FieldShell label="Last name" htmlFor="ln">
          <Input
            id="ln"
            value={data.last_name ?? ""}
            placeholder="Carter"
            onChange={(e) => update({ last_name: e.target.value })}
          />
        </FieldShell>
      </div>

      <div className="grid gap-2">
        <Label>Gender</Label>
        <ChoiceGroup
          options={GENDERS}
          value={data.gender}
          onChange={(v) => update({ gender: v })}
          columns={2}
        />
        <Err msg={errors?.gender} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          label="Age"
          value={data.age}
          min={13}
          max={100}
          suffix="yrs"
          error={errors?.age}
          onChange={(v) => update({ age: v ?? 0 })}
        />
        <HeightField
          valueCm={data.height_cm}
          unit={data.unit_system}
          error={errors?.height_cm}
          onChange={(cm) => update({ height_cm: cm })}
        />
        <WeightField
          label="Current weight"
          valueKg={data.weight_kg}
          unit={data.unit_system}
          error={errors?.weight_kg}
          onChange={(kg) => update({ weight_kg: kg })}
        />
        <WeightField
          label="Target weight"
          valueKg={data.target_weight_kg}
          unit={data.unit_system}
          error={errors?.target_weight_kg}
          onChange={(kg) => update({ target_weight_kg: kg })}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell label="Country">
          <Select
            value={data.country || undefined}
            onValueChange={(v) => update({ country: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
        <FieldShell label="Language">
          <Select
            value={data.language}
            onValueChange={(v) => update({ language: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      </div>
    </div>
  );
}

export function StepFitness({ errors }: StepProps) {
  const { data, update } = useOnboardingStore();
  const showEquipment =
    data.gym_access === "home_gym" || data.gym_access === "bodyweight";
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Training experience</Label>
        <ChoiceGroup
          options={TRAINING_EXPERIENCES}
          value={data.training_experience}
          onChange={(v) => update({ training_experience: v })}
          columns={2}
        />
        <Err msg={errors?.training_experience} />
      </div>

      <div className="grid gap-2">
        <Label>Where will you train?</Label>
        <ChoiceGroup
          options={GYM_ACCESS_OPTIONS}
          value={data.gym_access}
          onChange={(v) => update({ gym_access: v })}
          columns={2}
        />
        <Err msg={errors?.gym_access} />
      </div>

      {showEquipment && (
        <div className="grid gap-2">
          <Label>What equipment do you have?</Label>
          <p className="text-sm text-muted-foreground">
            Select everything available — we&apos;ll only program what you own.
          </p>
          <ChoiceGroup
            options={EQUIPMENT_TYPES}
            value={data.available_equipment}
            onChange={(v) => update({ available_equipment: v })}
            multi
            columns={2}
          />
        </div>
      )}
    </div>
  );
}

export function StepGoals({ errors }: StepProps) {
  const { data, update } = useOnboardingStore();
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>What are your goals?</Label>
        <p className="text-sm text-muted-foreground">
          Pick up to 4. Your first choice shapes the program most.
        </p>
        <ChoiceGroup
          options={GOALS}
          value={data.goals}
          onChange={(v) => update({ goals: v })}
          multi
          columns={2}
        />
        <Err msg={errors?.goals} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Stepper
          label="Training days per week"
          value={data.available_days}
          min={2}
          max={6}
          suffix="days"
          onChange={(v) => update({ available_days: v })}
        />
        <SliderField
          label="Time per session"
          value={data.session_minutes}
          min={20}
          max={120}
          step={5}
          format={(v) => `${v} min`}
          onChange={(v) => update({ session_minutes: v })}
        />
      </div>
    </div>
  );
}

export function StepBody() {
  const { data, update } = useOnboardingStore();
  return (
    <div className="grid gap-5">
      <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        All optional — these refine your progress tracking. Skip anything you
        don&apos;t know.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          label="Body fat"
          value={data.body_fat_pct ?? null}
          suffix="%"
          step={0.1}
          placeholder="e.g. 18"
          onChange={(v) => update({ body_fat_pct: v })}
        />
        <LengthField
          label="Waist"
          valueCm={data.waist_cm ?? null}
          unit={data.unit_system}
          onChange={(v) => update({ waist_cm: v })}
        />
        <LengthField
          label="Chest"
          valueCm={data.chest_cm ?? null}
          unit={data.unit_system}
          onChange={(v) => update({ chest_cm: v })}
        />
        <LengthField
          label="Arms"
          valueCm={data.arms_cm ?? null}
          unit={data.unit_system}
          onChange={(v) => update({ arms_cm: v })}
        />
        <LengthField
          label="Legs"
          valueCm={data.legs_cm ?? null}
          unit={data.unit_system}
          onChange={(v) => update({ legs_cm: v })}
        />
        <LengthField
          label="Shoulders"
          valueCm={data.shoulders_cm ?? null}
          unit={data.unit_system}
          onChange={(v) => update({ shoulders_cm: v })}
        />
        <LengthField
          label="Neck"
          valueCm={data.neck_cm ?? null}
          unit={data.unit_system}
          onChange={(v) => update({ neck_cm: v })}
        />
      </div>
    </div>
  );
}

export function StepLifestyle({ errors }: StepProps) {
  const { data, update } = useOnboardingStore();
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Daily activity level</Label>
        <ChoiceGroup
          options={DAILY_ACTIVITY_OPTIONS}
          value={data.daily_activity}
          onChange={(v) => update({ daily_activity: v })}
          columns={2}
        />
        <Err msg={errors?.daily_activity} />
      </div>
      <div className="grid gap-2">
        <Label>Work type</Label>
        <ChoiceGroup
          options={WORK_TYPES}
          value={data.work_type}
          onChange={(v) => update({ work_type: v })}
          columns={3}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <SliderField
          label="Sleep per night"
          value={data.sleep_hours}
          min={3}
          max={12}
          step={0.5}
          format={(v) => `${v} h`}
          onChange={(v) => update({ sleep_hours: v })}
        />
        <div className="grid gap-2">
          <Label>Sleep quality</Label>
          <ChoiceGroup
            options={SLEEP_QUALITIES}
            value={data.sleep_quality}
            onChange={(v) => update({ sleep_quality: v })}
            columns={2}
          />
        </div>
      </div>
    </div>
  );
}

export function StepNutrition() {
  const { data, update } = useOnboardingStore();
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Diet type</Label>
        <ChoiceGroup
          options={DIET_TYPES}
          value={data.diet_type}
          onChange={(v) => update({ diet_type: v })}
          columns={2}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Stepper
          label="Meals per day"
          value={data.meals_per_day}
          min={1}
          max={8}
          suffix="meals"
          onChange={(v) => update({ meals_per_day: v })}
        />
        <SliderField
          label="Water intake"
          value={data.water_intake_l}
          min={0}
          max={6}
          step={0.25}
          format={(v) => `${v.toFixed(2).replace(/\.?0+$/, "")} L`}
          onChange={(v) => update({ water_intake_l: v })}
        />
      </div>
    </div>
  );
}

export function StepHealth() {
  const { data, update } = useOnboardingStore();
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Any injuries or problem areas?</Label>
        <p className="text-sm text-muted-foreground">
          We&apos;ll avoid aggravating movements and suggest safer alternatives.
        </p>
        <ChoiceGroup
          options={INJURY_OPTIONS as readonly ChoiceOption[]}
          value={data.injuries}
          onChange={(v) => update({ injuries: v })}
          multi
          columns={3}
        />
      </div>
      <FieldShell
        label="Medical conditions (optional)"
        hint="Anything we should keep in mind. This stays private."
        htmlFor="med"
      >
        <Textarea
          id="med"
          value={data.medical_conditions ?? ""}
          placeholder="e.g. controlled asthma, high blood pressure…"
          onChange={(e) => update({ medical_conditions: e.target.value })}
        />
      </FieldShell>
    </div>
  );
}
