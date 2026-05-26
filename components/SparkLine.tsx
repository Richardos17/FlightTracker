'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface Props {
  data: { price: number }[];
  trend: 'up' | 'down' | 'flat';
}

export default function SparkLine({ data, trend }: Props) {
  const color = trend === 'up' ? '#ef4444' : trend === 'down' ? '#22c55e' : '#94a3b8';

  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <YAxis domain={['auto', 'auto']} hide />
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
