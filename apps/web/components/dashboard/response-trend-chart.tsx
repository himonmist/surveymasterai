"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TrendPoint } from "@/lib/analytics";

export function ResponseTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          tick={{ fontSize: 12, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
        <Tooltip
          labelFormatter={(value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          contentStyle={{ borderRadius: 8, borderColor: "#E5E7EB", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="responses" stroke="#7C3AED" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
