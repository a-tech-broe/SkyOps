import { useState } from 'react';
import { api } from '../api/client';

interface AirportData {
  icaoId: string;
  iataId: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  elev: number;
  rwyDir: string;
  rwyLen: number;
  metar: string;
}

export default function AirportPage() {
  const [icao, setIcao] = useState('');
  const [airport, setAirport] = useState<AirportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = icao.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError('');
    setAirport(null);

    try {
      const res = await api.airports(id);
      if (!res) throw new Error(`Airport ${id} not found.`);
      setAirport(res as AirportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch airport.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Airport Info</h1>
        <p className="text-slate-400 text-sm mt-1">Location · Elevation · Runways</p>
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
          {loading ? 'Loading…' : 'Lookup'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {airport && (
        <div className="card space-y-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-bold font-mono text-white">{airport.icaoId}</h2>
              {airport.iataId && (
                <span className="text-slate-500 font-mono text-sm">{airport.iataId}</span>
              )}
            </div>
            <p className="text-slate-300 mt-0.5">{airport.name}</p>
            <p className="text-slate-500 text-sm">
              {airport.state && `${airport.state}, `}{airport.country}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Elevation" value={`${airport.elev} ft MSL`} />
            <Stat
              label="Coordinates"
              value={`${airport.lat?.toFixed(4)}° N, ${airport.lon?.toFixed(4)}°`}
            />
            {airport.rwyLen && (
              <Stat label="Longest Runway" value={`${airport.rwyLen} ft`} />
            )}
          </div>

          {airport.rwyDir && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Runways</p>
              <p className="text-slate-300 font-mono text-sm">{airport.rwyDir}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950 rounded-lg p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-slate-100 font-mono text-sm mt-1">{value}</p>
    </div>
  );
}
