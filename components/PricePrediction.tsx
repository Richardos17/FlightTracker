'use client';

import { predictPrice, PricePoint } from '@/lib/prediction';

interface Props {
  history: PricePoint[];
}

export default function PricePrediction({ history }: Props) {
  const prediction = predictPrice(history);

  if (!prediction) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-500">
        Need at least 3 price data points for a prediction. Check back in a day or two.
      </div>
    );
  }

  const { predictedIn7Days, recommendation, slope } = prediction;
  const currentPrice = history[history.length - 1].price;
  const diff = predictedIn7Days - currentPrice;

  const isBuy = recommendation === 'BUY';

  return (
    <div
      className={`rounded-xl border p-5 ${
        isBuy
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            7-day price forecast
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${predictedIn7Days.toLocaleString()}
          </div>
          <div className={`text-sm mt-0.5 ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {diff >= 0 ? '+' : ''}${diff.toFixed(0)} vs. today
          </div>
        </div>

        <div
          className={`px-5 py-3 rounded-xl text-lg font-bold tracking-wide ${
            isBuy
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          }`}
        >
          {isBuy ? 'BUY NOW' : 'WAIT'}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Trend: {slope >= 0 ? '+' : ''}${slope.toFixed(2)}/day &middot; Based on linear trend only &mdash; prices vary with availability, season, and airline policy.
      </div>
    </div>
  );
}
