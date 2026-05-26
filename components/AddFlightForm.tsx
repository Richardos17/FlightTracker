'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AirportCombobox from './AirportCombobox';

const CABIN_CLASSES = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
];

export default function AddFlightForm() {
  const router = useRouter();
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      setError('Origin, destination and departure date are required.');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination must be different.');
      return;
    }
    if (tripType === 'roundtrip' && !returnDate) {
      setError('Return date is required for round trips.');
      return;
    }
    if (tripType === 'roundtrip' && returnDate <= departureDate) {
      setError('Return date must be after departure date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departure_date: departureDate,
          return_date: tripType === 'roundtrip' ? returnDate : undefined,
          cabin_class: cabinClass,
          label: label || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Trip type toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTripType('oneway')}
          className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
            tripType === 'oneway'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          One-way
        </button>
        <button
          type="button"
          onClick={() => setTripType('roundtrip')}
          className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
            tripType === 'roundtrip'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Round trip
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="origin">
            From
          </label>
          <AirportCombobox
            id="origin"
            value=""
            onChange={(code) => setOrigin(code)}
            placeholder="e.g. JFK, London..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="destination">
            To
          </label>
          <AirportCombobox
            id="destination"
            value=""
            onChange={(code) => setDestination(code)}
            placeholder="e.g. LHR, Paris..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="date">
            Departure date
          </label>
          <input
            id="date"
            type="date"
            value={departureDate}
            onChange={(e) => {
              setDepartureDate(e.target.value);
              if (returnDate && e.target.value >= returnDate) setReturnDate('');
            }}
            min={new Date().toISOString().split('T')[0]}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {tripType === 'roundtrip' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="return-date">
              Return date
            </label>
            <input
              id="return-date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate ? departureDate : new Date().toISOString().split('T')[0]}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="cabin">
              Cabin class
            </label>
            <select
              id="cabin"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {CABIN_CLASSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tripType === 'roundtrip' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="cabin-rt">
            Cabin class
          </label>
          <select
            id="cabin-rt"
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            {CABIN_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="label">
          Label <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Summer vacation, Work trip..."
          maxLength={255}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Adding & fetching price...' : 'Track flight'}
        </button>
      </div>
    </form>
  );
}
