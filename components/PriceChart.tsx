'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PricePoint {
  fetched_at: string;
  price: number;
  currency: string;
  source?: string | null;
}

interface MergedPoint {
  label: string;
  serpapi?: number;
  kiwi?: number;
}

interface Props {
  history: PricePoint[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mergeByHour(history: PricePoint[]): MergedPoint[] {
  const buckets = new Map<string, MergedPoint>();

  for (const h of history) {
    // Group by hour bucket so same-time fetches merge into one point
    const key = h.fetched_at.slice(0, 13);
    if (!buckets.has(key)) {
      buckets.set(key, { label: h.fetched_at });
    }
    const bucket = buckets.get(key)!;
    if (h.source === 'kiwi') bucket.kiwi = h.price;
    else bucket.serpapi = h.price;
  }

  return Array.from(buckets.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export default function PriceChart({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No price history yet. Check back after the first cron run.
      </div>
    );
  }

  const hasSerpApi = history.some((h) => !h.source || h.source === 'serpapi');
  const hasKiwi = history.some((h) => h.source === 'kiwi');
  const merged = mergeByHour(history);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={merged} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tickFormatter={formatDate}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `€${v}`}
        />
        <Tooltip
          formatter={(value, name) => [
            `€${Number(value).toLocaleString()}`,
            name === 'serpapi' ? 'Google Flights' : 'Kiwi',
          ]}
          labelFormatter={(label) => new Date(label).toLocaleString()}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
        />
        {(hasSerpApi || hasKiwi) && (
          <Legend
            formatter={(value) => (value === 'serpapi' ? 'Google Flights' : 'Kiwi')}
          />
        )}
        {hasSerpApi && (
          <Line
            type="monotone"
            dataKey="serpapi"
            name="serpapi"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: '#6366f1', r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        )}
        {hasKiwi && (
          <Line
            type="monotone"
            dataKey="kiwi"
            name="kiwi"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ fill: '#f97316', r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
