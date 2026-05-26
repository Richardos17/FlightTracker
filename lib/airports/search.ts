export interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
}

interface AirportRecord {
  iata: string;
  name: string;
  city: string;
  country: string;
}

const CSV_URL =
  'https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv';

let cache: AirportRecord[] | null = null;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let cur = '';
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

async function loadAirports(): Promise<AirportRecord[]> {
  if (cache) return cache;

  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch airport data: ${res.status}`);

  const text = await res.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',');

  const col = (name: string) => headers.indexOf(name);
  const iataIdx = col('iata_code');
  const nameIdx = col('name');
  const cityIdx = col('municipality');
  const countryIdx = col('iso_country');
  const typeIdx = col('type');

  const airports: AirportRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const iata = cols[iataIdx];
    const type = cols[typeIdx];
    if (!iata || iata.length !== 3) continue;
    if (!['large_airport', 'medium_airport'].includes(type)) continue;
    airports.push({
      iata,
      name: cols[nameIdx] ?? '',
      city: cols[cityIdx] ?? '',
      country: cols[countryIdx] ?? '',
    });
  }

  cache = airports;
  return airports;
}

export async function searchAirports(keyword: string): Promise<Airport[]> {
  if (keyword.length < 2) return [];
  const q = keyword.toLowerCase();

  const airports = await loadAirports();

  return airports
    .filter(
      (a) =>
        a.iata.toLowerCase().startsWith(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    )
    .slice(0, 6)
    .map((a) => ({
      iataCode: a.iata,
      name: a.name,
      cityName: a.city,
    }));
}
