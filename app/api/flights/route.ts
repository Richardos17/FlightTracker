import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { fetchCheapestPrice } from '@/lib/serpapi/flightSearch';
import { fetchCheapestPriceKiwi } from '@/lib/kiwi/flightSearch';

const addFlightSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cabin_class: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
  label: z.string().max(255).optional(),
});

export async function GET() {
  const { data, error } = await supabase.rpc('get_flights_with_latest_price');

  if (error) {
    // Fallback to manual query if RPC not set up yet
    const { data: flights, error: fErr } = await supabase
      .from('tracked_flights')
      .select('*')
      .order('created_at', { ascending: false });

    if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

    const results = await Promise.all(
      (flights ?? []).map(async (flight) => {
        const { data: ph } = await supabase
          .from('price_history')
          .select('price, currency, fetched_at, carrier')
          .eq('tracked_flight_id', flight.id)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single();
        return { ...flight, latest_price: ph ?? null };
      })
    );

    return NextResponse.json(results);
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = addFlightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { origin, destination, departure_date, return_date, cabin_class, label } = parsed.data;

  const { data: flight, error: insertErr } = await supabase
    .from('tracked_flights')
    .insert({ origin, destination, departure_date, return_date: return_date ?? null, cabin_class, label })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Seed first prices from both sources immediately (best-effort)
  try {
    const params = {
      origin,
      destination,
      departureDate: departure_date,
      cabinClass: cabin_class,
      returnDate: return_date,
    };
    const [serpResult, kiwiResult] = await Promise.allSettled([
      fetchCheapestPrice(params),
      fetchCheapestPriceKiwi(params),
    ]);

    const inserts: object[] = [];
    if (serpResult.status === 'fulfilled' && serpResult.value) {
      const p = serpResult.value;
      inserts.push({ tracked_flight_id: flight.id, price: p.price, currency: p.currency, carrier: p.carrier, source: 'serpapi', booking_url: p.bookingUrl, raw_response: p.rawResponse });
    }
    if (kiwiResult.status === 'fulfilled' && kiwiResult.value) {
      const p = kiwiResult.value;
      inserts.push({ tracked_flight_id: flight.id, price: p.price, currency: p.currency, carrier: p.carrier, source: 'kiwi', booking_url: p.bookingUrl, raw_response: p.rawResponse });
    }
    if (inserts.length > 0) await supabase.from('price_history').insert(inserts);
  } catch {
    // Price seed failed — the flight is still created, cron will populate later
  }

  return NextResponse.json(flight, { status: 201 });
}
