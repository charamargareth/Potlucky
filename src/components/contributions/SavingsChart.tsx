"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrencyShort, formatDateShortID } from "@/lib/utils";
import type { Contribution } from "@/types/database";

export default function SavingsChart({
  contributions,
}: {
  contributions: Contribution[];
}) {
  // Urutkan ascending, lalu buat data kumulatif per tanggal unik
  const sorted = [...contributions].sort((a, b) =>
    a.contributed_on.localeCompare(b.contributed_on)
  );

  const byDate = new Map<string, number>();
  for (const c of sorted) {
    byDate.set(
      c.contributed_on,
      (byDate.get(c.contributed_on) ?? 0) + Number(c.amount)
    );
  }

  let cumulative = 0;
  const data = Array.from(byDate.entries()).map(([date, amount]) => {
    cumulative += amount;
    return { date, total: cumulative };
  });

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-ink-soft">
        Belum ada data untuk ditampilkan.
      </div>
    );
  }

  if (data.length === 1) {
    data.unshift({ date: data[0].date, total: 0 });
  }

  return (
    <div className="h-44 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B8A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FF6B8A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShortID}
            tick={{ fontSize: 11, fill: "#8A6670" }}
            axisLine={{ stroke: "#FFD9E0" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => formatCurrencyShort(v)}
            tick={{ fontSize: 11, fill: "#8A6670" }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => [formatCurrencyShort(Number(value)), "Total"]}
            labelFormatter={(label) => formatDateShortID(label as string)}
            contentStyle={{
              background: "#FBFDFB",
              border: "1px solid #FFD9E0",
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#FF6B8A"
            strokeWidth={2.5}
            fill="url(#savingsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
