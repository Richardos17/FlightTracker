'use client';

import { useState, useEffect, useRef } from 'react';
import type { Airport } from '@/lib/airports/search';

interface Props {
  value: string;
  onChange: (iataCode: string, displayValue: string) => void;
  placeholder?: string;
  id?: string;
}

export default function AirportCombobox({ value, onChange, placeholder, id }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`);
        const data: Airport[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function select(airport: Airport) {
    const display = `${airport.iataCode} — ${airport.cityName}`;
    setQuery(display);
    setOpen(false);
    onChange(airport.iataCode, display);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 text-slate-400 text-xs">Searching...</div>
      )}
      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto text-sm">
          {results.map((airport) => (
            <li
              key={airport.iataCode}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between gap-2"
              onMouseDown={() => select(airport)}
            >
              <span className="font-semibold text-slate-800">{airport.iataCode}</span>
              <span className="text-slate-500 truncate">{airport.name}, {airport.cityName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
