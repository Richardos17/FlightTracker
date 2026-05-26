import { NextResponse } from 'next/server';
import { searchAirports } from '@/lib/airports/search';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  if (q.length < 2) return NextResponse.json([]);

  try {
    return NextResponse.json(await searchAirports(q));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
