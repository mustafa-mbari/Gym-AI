import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ChevronRight, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { MachineQR } from "@/components/equipment/machine-qr";
import { CATEGORY_ICON } from "@/components/equipment/equipment-card";
import { ExerciseInfoDialog } from "@/components/exercise/exercise-dialog";
import { EQUIPMENT, exercisesForEquipment, getEquipment } from "@/data";
import {
  categoryLabel,
  difficultyLabel,
  difficultyTone,
  equipmentTypeLabel,
  muscleLabel,
} from "@/lib/labels";

export function generateStaticParams() {
  return EQUIPMENT.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getEquipment(slug);
  return {
    title: item ? item.name : "Equipment",
    description: item?.description,
  };
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getEquipment(slug);
  if (!item) notFound();

  const related = exercisesForEquipment(item);

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/equipment">
          <ArrowLeft className="size-4" /> Equipment
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MediaPlaceholder
            seed={item.slug}
            icon={CATEGORY_ICON[item.category] ?? "Dumbbell"}
            className="aspect-[16/9] w-full rounded-2xl"
          />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant={difficultyTone(item.difficulty)}>
              {difficultyLabel(item.difficulty)}
            </Badge>
            <Badge variant="outline">{categoryLabel(item.category)}</Badge>
            <Badge variant="secondary">{equipmentTypeLabel(item.equipment_type)}</Badge>
            <span className="text-sm text-muted-foreground">
              by {item.manufacturer}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {item.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{item.description}</p>

          {/* Muscles */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">Primary muscles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.primary_muscles.map((m) => (
                  <Badge key={m} variant="success">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            {item.secondary_muscles.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Secondary muscles</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.secondary_muscles.map((m) => (
                    <Badge key={m} variant="secondary">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader className="flex-row items-center gap-2">
              <ListChecks className="size-5 text-primary" />
              <CardTitle>How to use it</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {item.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: QR + exercises */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <MachineQR slug={item.slug} />
            </CardContent>
          </Card>

          {related.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {related.map((ex) => (
                    <li key={ex.slug}>
                      <ExerciseInfoDialog
                        slug={ex.slug}
                        className="flex w-full items-center justify-between gap-2 py-2.5 text-left hover:text-primary"
                      >
                        <span className="font-medium">{ex.name}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </ExerciseInfoDialog>
                      <p className="-mt-1 pb-2 text-xs text-muted-foreground">
                        {muscleLabel(ex.muscle_groups[0])} · {ex.default_sets} ×{" "}
                        {ex.rep_range[0]}–{ex.rep_range[1]}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
