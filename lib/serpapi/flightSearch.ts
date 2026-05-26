export interface FlightPrice {
  price: number;
  currency: string;
  carrier: string | null;
  bookingUrl: string | null;
  rawResponse: unknown;
}

export interface FlightParams {
  origin: string;
  destination: string;
  departureDate: string;
  cabinClass: string;
  returnDate?: string;
}

const CABIN_CLASS_MAP: Record<string, number> = {
  ECONOMY: 1,
  PREMIUM_ECONOMY: 2,
  BUSINESS: 3,
  FIRST: 4,
};

export async function fetchCheapestPrice(params: FlightParams): Promise<FlightPrice | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY is not set');

  const isRoundTrip = Boolean(params.returnDate);

  const queryParams: Record<string, string> = {
    engine: 'google_flights',
    departure_id: params.origin,
    arrival_id: params.destination,
    outbound_date: params.departureDate,
    type: isRoundTrip ? '1' : '2',
    travel_class: String(CABIN_CLASS_MAP[params.cabinClass] ?? 1),
    currency: 'EUR',
    hl: 'en',
    api_key: apiKey,
  };

  if (isRoundTrip && params.returnDate) {
    queryParams.return_date = params.returnDate;
  }

  const query = new URLSearchParams(queryParams);
  const res = await fetch(`https://serpapi.com/search?${query}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpAPI error: ${res.status} ${text}`);
  }

  const data = await res.json();

  const cheapest = data.best_flights?.[0] ?? data.other_flights?.[0] ?? null;
  if (!cheapest) return null;

  const bookingUrl: string | null = data.search_metadata?.google_flights_url ?? null;

  return {
    price: cheapest.price,
    currency: 'EUR',
    carrier: cheapest.flights?.[0]?.airline ?? null,
    bookingUrl,
    rawResponse: cheapest,
  };
}
