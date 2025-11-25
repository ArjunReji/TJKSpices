"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Point = {
  auction_date: string;          // "YYYY-MM-DD"
  avg_price_per_kg: number | null;
};

export default function AuctionAvgPriceChart({ data }: { data: Point[] }) {
  const cleaned = data
    .filter((d) => d.avg_price_per_kg != null)
    .map((d) => ({
      ...d,
      // shorter label for X axis
      label: d.auction_date.slice(5), // "MM-DD"
    }));

  if (!cleaned.length) {
    return (
      <div className="text-sm text-slate-600">
        Not enough data to draw chart yet.
      </div>
    );
  }

  const values = cleaned.map((d) => d.avg_price_per_kg as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const domainMin = minVal - 200;
  const domainMax = maxVal + 200;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={cleaned}
          margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            angle={-35}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `₹${v}`}
            domain={[domainMin, domainMax]}
          />
          <Tooltip
            formatter={(value) => [`₹${value}`, "Avg Price"]}
            labelFormatter={(label, payload: any) => {
              const original = payload?.[0]?.payload?.auction_date;
              return original || label;
            }}
          />
          <Line
            type="monotone"
            dataKey="avg_price_per_kg"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
