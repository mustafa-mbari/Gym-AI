"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

/** Success-probability gauge for the journey header. */
export function ProbabilityDial({
  value,
  size = 140,
}: {
  value: number; // 5–95
  size?: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={[{ value }]}
          innerRadius="78%"
          outerRadius="100%"
          startAngle={225}
          endAngle={-45}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            dataKey="value"
            angleAxisId={0}
            cornerRadius={8}
            fill="var(--color-chart-1)"
            background={{ fill: "var(--color-muted)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{value}%</span>
        <span className="text-[11px] text-muted-foreground">success odds</span>
      </div>
    </div>
  );
}
