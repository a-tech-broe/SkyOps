import { useState } from 'react';
import { api } from '../api/client';
import MetarDisplay, { MetarData } from '../components/MetarDisplay';
import TafDisplay, { TafData } from '../components/TafDisplay';

interface Pirep {
  rawOb: string;
  altitude: number;
  acType: string | null;
}

export default function WeatherPage() {
  const [icao, setIcao] = useState('');
  const [query, setQuery] = useState('');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [taf, setTaf] = useState<TafData | null>(null);
  const [pireps, setPireps] = useState<Pirep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = icao.trim().toUpperCase();
    if (!id || id.length < 3) return;

    setLoading(true);
    setError('');
    setMetar(null);
    setTaf(null);
    setPireps([]);
    setQuery(id);

    try {
      const [metarRes, tafRes, pirepRes] = await Promise.allSettled([
        api.weather.metar(id),
        api.weather.taf(id),
        api.weather.pireps(id),
      ]);

      if (metarRes.status === 'fulfilled') {
        const arr = metarRes.value as MetarData[];
        setMetar(arr[0] ?? null);
      }
      if (tafRes.status === 'fulfilled') {
        const arr = tafRes.value as TafData[];
        setTaf(arr[0] ?? null);
      }
      if (pirepRes.status === 'fulfilled') {
        setPireps(pirepRes.value as Pirep[]);
      }

      if (metarRes.status === 'rejected' && tafRes.status === 'rejected') {
        setError(`No weather data found for ${id}.`);
      }
    } catch {
      setError('Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weather Briefing</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">METAR · TAF · PIREPs</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          className="input w-40"
          placeholder="ICAO"
          maxLength={4}
          value={icao}
          onChange={(e) => setIcao(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Brief'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {metar && <MetarDisplay metar={metar} />}
      {taf && <TafDisplay taf={taf} />}

      {pireps.length > 0 && (
        <div className="card space-y-2">
          <h3 className="text-slate-700 dark:text-slate-300 font-semibold">
            PIREPs near {query} ({pireps.length})
          </h3>
          <div className="space-y-2">
            {pireps.map((p: Pirep, i: number) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-950 rounded p-2">
                <p className="text-slate-500 text-xs font-mono">
                  FL{p.altitude} · {p.acType ?? 'UNKN'}
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-xs font-mono mt-0.5">{p.rawOb}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
