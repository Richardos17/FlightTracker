import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import FlightCard from '@/components/FlightCard';

interface Flight {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  cabin_class: string;
  label?: string;
  created_at: string;
  latest_price?: {
    price: number;
    currency: string;
    fetched_at: string;
    carrier?: string;
  } | null;
  sparkline: { price: number; fetched_at: string }[];
}

async function getFlightsWithPrices(): Promise<Flight[]> {
  const { data: flights, error } = await supabase
    .from('tracked_flights')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !flights) return [];

  return Promise.all(
    flights.map(async (flight) => {
      // Fetch last 4 records (2 sources × up to 2 recent checks) and take the cheapest
      const { data: recent } = await supabase
        .from('price_history')
        .select('price, currency, fetched_at, carrier, source')
        .eq('tracked_flight_id', flight.id)
        .order('fetched_at', { ascending: false })
        .limit(4);

      const latest = recent && recent.length > 0
        ? recent.reduce((min, p) => p.price < min.price ? p : min)
        : null;

      const { data: sparkData } = await supabase
        .from('price_history')
        .select('price, fetched_at')
        .eq('tracked_flight_id', flight.id)
        .order('fetched_at', { ascending: true })
        .limit(14);

      return {
        ...flight,
        latest_price: latest ?? null,
        sparkline: sparkData ?? [],
      };
    })
  );
}

export const revalidate = 120;

export default async function DashboardPage() {
  const flights = await getFlightsWithPrices();

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="text-5xl">✈️</div>
        <h1 className="text-2xl font-bold text-slate-800">No flights tracked yet</h1>
        <p className="text-slate-500 max-w-md">
          Add a flight to start tracking its price. Prices are checked automatically twice daily.
        </p>
        <Link
          href="/add"
          className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          Track your first flight
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tracked Flights</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {flights.length} flight{flights.length !== 1 ? 's' : ''} &middot; updated twice daily
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>
    </div>
  );
}
