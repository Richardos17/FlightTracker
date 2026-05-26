export interface PricePoint {
  fetched_at: string;
  price: number;
}

export interface Prediction {
  predictedIn7Days: number;
  recommendation: 'BUY' | 'WAIT';
  slope: number;
}

export function predictPrice(history: PricePoint[]): Prediction | null {
  if (history.length < 3) return null;

  const t0 = new Date(history[0].fetched_at).getTime();
  const points = history.map((h) => ({
    x: (new Date(h.fetched_at).getTime() - t0) / 86_400_000,
    y: h.price,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const lastX = points[points.length - 1].x;
  const predictedIn7Days = Math.round((slope * (lastX + 7) + intercept) * 100) / 100;
  const currentPrice = history[history.length - 1].price;
  const recommendation = predictedIn7Days > currentPrice * 1.02 ? 'BUY' : 'WAIT';

  return { predictedIn7Days, recommendation, slope };
}
