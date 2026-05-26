'use client';

import Link from 'next/link';
import SparkLine from './SparkLine';

interface PricePoint {
  price: number;
  fetched_at: string;
}

interface Flight {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  cabin_class: string;
  label?: string;
  latest_price?: {
    price: number;
    currency: string;
    fetched_at: string;
    carrier?: string;
  } | null;
  sparkline?: PricePoint[];
}

function getTrend(points: PricePoint[]): 'up' | 'down' | 'flat' {
  if (points.length < 2) return 'flat';
  const first = points[0].price;
  const last = points[points.length - 1].price;
  if (last > first * 1.01) return 'up';
  if (last < first * 0.99) return 'down';
  return 'flat';
}

function getDelta(points: PricePoint[], currentPrice: number) {
  if (points.length < 2) return null;
  const prev = points[points.length - 2].price;
  const diff = currentPrice - prev;
  const pct = ((diff / prev) * 100).toFixed(1);
  return { diff, pct };
}

export default function FlightCard({ flight }: { flight: Flight }) {
  const sparkline = flight.sparkline ?? [];
  const latestPrice = flight.latest_price;
  const trend = getTrend(sparkline);
  const delta = latestPrice ? getDelta(sparkline, latestPrice.price) : null;

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor =
    trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xl font-bold text-slate-900">
            {flight.origin} → {flight.destination}
          </div>
          {flight.label && (
            <div className="text-sm text-slate-500 mt-0.5">{flight.label}</div>
          )}
          <div className="text-xs text-slate-400 mt-1">
            {flight.return_date
              ? `${flight.departure_date} → ${flight.return_date}`
              : flight.departure_date}{' '}
            &middot; {flight.cabin_class.replace('_', ' ')}
            {flight.return_date && <span className="ml-1 text-indigo-400">Round trip</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {latestPrice ? (
            <>
              <div className="text-2xl font-bold text-slate-900">
                €{latestPrice.price.toLocaleString()}
              </div>
              {delta && (
                <div className={`text-sm font-medium ${trendColor}`}>
                  {trendArrow} {delta.diff > 0 ? '+' : ''}€{Math.abs(delta.diff).toFixed(0)} (
                  {delta.pct}%)
                </div>
              )}
              {latestPrice.carrier && (
                <div className="text-xs text-slate-400">{latestPrice.carrier}</div>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-400 italic">No price yet</div>
          )}
        </div>
      </div>

      {sparkline.length > 1 && <SparkLine data={sparkline} trend={trend} />}

      <div className="flex justify-end">
        <Link
          href={`/flights/${flight.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}
