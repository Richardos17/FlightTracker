import type { FlightParams, FlightPrice } from '@/lib/serpapi/flightSearch';

const CABIN_CLASS_MAP: Record<string, string> = {
  ECONOMY: 'M',
  PREMIUM_ECONOMY: 'W',
  BUSINESS: 'C',
  FIRST: 'F',
};

function toKiwiDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export async function fetchCheapestPriceKiwi(params: FlightParams): Promise<FlightPrice | null> {
  const apiKey = process.env.KIWI_API_KEY;
  if (!apiKey) throw new Error('KIWI_API_KEY is not set');

  const isRoundTrip = Boolean(params.returnDate);
  const kiwiDate = toKiwiDate(params.departureDate);

  const queryParams: Record<string, string> = {
    fly_from: params.origin,
    fly_to: params.destination,
    date_from: kiwiDate,
    date_to: kiwiDate,
    flight_type: isRoundTrip ? 'round' : 'oneway',
    adults: '1',
    curr: 'EUR',
    limit: '3',
    selected_cabins: CABIN_CLASS_MAP[params.cabinClass] ?? 'M',
  };

  if (isRoundTrip && params.returnDate) {
    const kiwiReturn = toKiwiDate(params.returnDate);
    queryParams.return_from = kiwiReturn;
    queryParams.return_to = kiwiReturn;
  }

  const query = new URLSearchParams(queryParams);
  const res = await fetch(`https://api.tequila.kiwi.com/v2/search?${query}`, {
    headers: { apikey: apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kiwi API error: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (!data.data || data.data.length === 0) return null;

  const cheapest = data.data[0];
  return {
    price: cheapest.price,
    currency: data.currency ?? 'EUR',
    carrier: cheapest.airlines?.[0] ?? null,
    bookingUrl: cheapest.deep_link ?? null,
    rawResponse: cheapest,
  };
}
