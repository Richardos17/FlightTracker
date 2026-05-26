import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import PriceChart from '@/components/PriceChart';
import PricePrediction from '@/components/PricePrediction';

interface PriceRecord {
  id: string;
  fetched_at: string;
  price: number;
  currency: string;
  carrier: string | null;
  source: string | null;
  booking_url: string | null;
}

async function getFlight(id: string) {
  const { data } = await supabase
    .from('tracked_flights')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function getPriceHistory(id: string): Promise<PriceRecord[]> {
  const { data } = await supabase
    .from('price_history')
    .select('id, fetched_at, price, currency, carrier, source, booking_url')
    .eq('tracked_flight_id', id)
    .order('fetched_at', { ascending: true });
  return (data ?? []) as PriceRecord[];
}

function getLatestBySource(history: PriceRecord[]) {
  const latest: Record<string, PriceRecord> = {};
  for (const h of history) {
    const src = h.source ?? 'serpapi';
    if (!latest[src] || h.fetched_at > latest[src].fetched_at) {
      latest[src] = h;
    }
  }
  return latest;
}

const SOURCE_LABELS: Record<string, string> = {
  serpapi: 'Google Flights',
  kiwi: 'Kiwi',
};

const SOURCE_COLORS: Record<string, string> = {
  serpapi: 'indigo',
  kiwi: 'orange',
};

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [flight, history] = await Promise.all([getFlight(id), getPriceHistory(id)]);

  if (!flight) notFound();

  const latestBySource = getLatestBySource(history);
  const allLatest = Object.values(latestBySource);
  const bestPrice = allLatest.length > 0
    ? allLatest.reduce((min, p) => p.price < min.price ? p : min)
    : null;

  async function deleteFlight() {
    'use server';
    await supabase.from('tracked_flights').delete().eq('id', id);
    redirect('/');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← Back to dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-3xl font-bold text-slate-900">
              {flight.origin} → {flight.destination}
            </div>
            {flight.label && (
              <div className="text-slate-500 mt-1">{flight.label}</div>
            )}
            <div className="flex gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              {flight.return_date ? (
                <span>{flight.departure_date} → {flight.return_date}</span>
              ) : (
                <span>{flight.departure_date}</span>
              )}
              <span>&middot;</span>
              <span>{flight.cabin_class.replace('_', ' ')}</span>
              {flight.return_date && (
                <>
                  <span>&middot;</span>
                  <span className="text-indigo-400 font-medium">Round trip</span>
                </>
              )}
            </div>
          </div>
          <form action={deleteFlight}>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove flight
            </button>
          </form>
        </div>
      </div>

      {/* Current prices from each source */}
      {allLatest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {(['serpapi', 'kiwi'] as const).map((src) => {
            const record = latestBySource[src];
            if (!record) return null;
            const isBest = bestPrice?.source === src || (bestPrice && !bestPrice.source && src === 'serpapi');
            const color = SOURCE_COLORS[src];
            return (
              <div
                key={src}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 ${
                  isBest ? `border-${color}-300 ring-1 ring-${color}-200` : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    {SOURCE_LABELS[src]}
                  </span>
                  {isBest && (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Best price
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  €{record.price.toLocaleString()}
                </div>
                {record.carrier && (
                  <div className="text-xs text-slate-400">{record.carrier}</div>
                )}
                {record.booking_url && (
                  <a
                    href={record.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1 text-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                      src === 'kiwi'
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    Book on {SOURCE_LABELS[src]} →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Price history</h2>
        <PriceChart history={history} />
        <div className="mt-2 text-xs text-slate-400 text-right">
          {history.length} data point{history.length !== 1 ? 's' : ''} collected
        </div>
      </div>

      {/* Prediction */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Price prediction</h2>
        <PricePrediction history={history} />
      </div>
    </div>
  );
}
