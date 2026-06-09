"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  label: string;
  value: number;
}

/**
 * A compact, theme-aware area chart used for weight, body-fat and measurement
 * trends. Colors come from the chart CSS variables so it adapts to dark mode.
 */
export function AreaTrend({
  data,
  color = "var(--color-chart-1)",
  goal,
  suffix = "",
  height = 240,
  domainPadding = 2,
}: {
  data: TrendPoint[];
  color?: string;
  goal?: number | null;
  suffix?: string;
  height?: number;
  domainPadding?: number;
}) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values, goal ?? Infinity);
  const max = Math.max(...values, goal ?? -Infinity);
  const gradientId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No data yet — log an entry to see your trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          minTickGap={20}
        />
        <YAxis
          domain={[
            Math.floor(min - domainPadding),
            Math.ceil(max + domainPadding),
          ]}
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-border)" }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
          formatter={(v) => [`${v}${suffix}`, ""]}
        />
        {goal != null && (
          <ReferenceLine
            y={goal}
            stroke="var(--color-primary)"
            strokeDasharray="5 4"
            label={{
              value: `Goal ${goal}${suffix}`,
              position: "insideTopRight",
              fill: "var(--color-primary)",
              fontSize: 11,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
