import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('price_history')
    .select('id, fetched_at, price, currency, carrier, source, booking_url')
    .eq('tracked_flight_id', id)
    .order('fetched_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
