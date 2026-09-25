"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import type { QuestionAggregate } from "@/lib/analytics";

const BAR_COLOR = "#7C3AED";

export function QuestionChart({ aggregate }: { aggregate: QuestionAggregate }) {
  if (aggregate.optionCounts && aggregate.optionCounts.length > 0) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(120, aggregate.optionCounts.length * 36)}>
        <BarChart data={aggregate.optionCounts} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (aggregate.npsBreakdown) {
    const total = aggregate.npsBreakdown.promoters + aggregate.npsBreakdown.passives + aggregate.npsBreakdown.detractors;
    return (
      <div>
        <p className="text-3xl font-bold text-gray-900">{aggregate.npsScore}</p>
        <p className="text-xs text-gray-400">NPS score</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="bg-emerald-500" style={{ width: `${total ? (aggregate.npsBreakdown.promoters / total) * 100 : 0}%` }} />
          <div className="bg-amber-400" style={{ width: `${total ? (aggregate.npsBreakdown.passives / total) * 100 : 0}%` }} />
          <div className="bg-red-400" style={{ width: `${total ? (aggregate.npsBreakdown.detractors / total) * 100 : 0}%` }} />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span>🟢 {aggregate.npsBreakdown.promoters} Promoters</span>
          <span>🟡 {aggregate.npsBreakdown.passives} Passives</span>
          <span>🔴 {aggregate.npsBreakdown.detractors} Detractors</span>
        </div>
      </div>
    );
  }

  if (aggregate.average !== undefined) {
    return (
      <div className="flex gap-6">
        <div>
          <p className="text-3xl font-bold text-gray-900">{aggregate.average}</p>
          <p className="text-xs text-gray-400">Average</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{aggregate.min}</p>
          <p className="text-xs text-gray-400">Min</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{aggregate.max}</p>
          <p className="text-xs text-gray-400">Max</p>
        </div>
      </div>
    );
  }

  if (aggregate.topWords) {
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {aggregate.topWords.map((w) => (
            <span
              key={w.word}
              className="badge bg-brand-50 text-brand-700"
              style={{ fontSize: `${Math.min(16, 10 + w.count)}px` }}
            >
              {w.word} · {w.count}
            </span>
          ))}
        </div>
        {aggregate.sampleAnswers && aggregate.sampleAnswers.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-xs text-gray-500">
            {aggregate.sampleAnswers.map((a, i) => (
              <li key={i} className="rounded bg-gray-50 px-2 py-1">
                &ldquo;{a}&rdquo;
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return <p className="text-xs text-gray-400">No response data yet.</p>;
}
