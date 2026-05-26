import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { fetchCheapestPrice } from '@/lib/serpapi/flightSearch';
import { fetchCheapestPriceKiwi } from '@/lib/kiwi/flightSearch';
import type { FlightParams } from '@/lib/serpapi/flightSearch';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: flights, error } = await supabase.from('tracked_flights').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; sources: string[]; errors: string[] }[] = [];

  for (const flight of flights ?? []) {
    const params: FlightParams = {
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.departure_date,
      cabinClass: flight.cabin_class,
      returnDate: flight.return_date ?? undefined,
    };

    const [serpResult, kiwiResult] = await Promise.allSettled([
      fetchCheapestPrice(params),
      fetchCheapestPriceKiwi(params),
    ]);

    const inserts: object[] = [];
    const sources: string[] = [];
    const errors: string[] = [];

    if (serpResult.status === 'fulfilled' && serpResult.value) {
      const p = serpResult.value;
      inserts.push({
        tracked_flight_id: flight.id,
        price: p.price,
        currency: p.currency,
        carrier: p.carrier,
        source: 'serpapi',
        booking_url: p.bookingUrl,
        raw_response: p.rawResponse,
      });
      sources.push('serpapi');
    } else if (serpResult.status === 'rejected') {
      errors.push(`serpapi: ${serpResult.reason}`);
    }

    if (kiwiResult.status === 'fulfilled' && kiwiResult.value) {
      const p = kiwiResult.value;
      inserts.push({
        tracked_flight_id: flight.id,
        price: p.price,
        currency: p.currency,
        carrier: p.carrier,
        source: 'kiwi',
        booking_url: p.bookingUrl,
        raw_response: p.rawResponse,
      });
      sources.push('kiwi');
    } else if (kiwiResult.status === 'rejected') {
      errors.push(`kiwi: ${kiwiResult.reason}`);
    }

    if (inserts.length > 0) {
      await supabase.from('price_history').insert(inserts);
    }

    results.push({ id: flight.id, sources, errors });
  }

  return NextResponse.json({ processed: results.length, results });
}
