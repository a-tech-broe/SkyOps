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

interface Chart {
  code: string;
  name: string;
  pdfUrl: string;
}

interface ChartsResponse {
  cycle: string | null;
  charts: Chart[];
  international?: boolean;
}

type Tab = 'overview' | 'runways' | 'charts';

const CHART_ORDER: Record<string, number> = { APD: 0, IAP: 1, DP: 2, STAR: 3, MIN: 4, HOT: 5 };

function parseRunways(rwyDir: string): { id: string; heading: number }[] {
  // rwyDir is a comma-separated list like "18/36, 09/27"
  const runways: { id: string; heading: number }[] = [];
  if (!rwyDir) return runways;

  const pairs = rwyDir.split(',').map((s) => s.trim());
  for (const pair of pairs) {
    const ends = pair.split('/').map((s) => s.trim());
    for (const end of ends) {
      const num = parseInt(end.replace(/[LRC]/, ''), 10);
      if (!isNaN(num)) {
        runways.push({ id: end, heading: num * 10 });
      }
    }
  }
  return runways;
}

function parseMetarWind(metar: string): { dir: number; speed: number } | null {
  if (!metar) return null;
  // METAR wind group: dddssKT or dddssGggKT — dir may be VRB
  const m = metar.match(/\b(\d{3}|VRB)(\d{2,3})(?:G\d{2,3})?KT\b/);
  if (!m || m[1] === 'VRB') return null;
  return { dir: parseInt(m[1], 10), speed: parseInt(m[2], 10) };
}

function parseMetarFlightRules(metar: string): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  if (!metar) return 'VFR';

  // Visibility: "1/2SM", "1 1/2SM", "10SM", "M1/4SM"
  let vis = Infinity;
  const visFull = metar.match(/\bM?(\d+)SM\b/);
  const visFrac = metar.match(/\bM?(\d+)\/(\d+)SM\b/);
  const visMixed = metar.match(/\b(\d+)\s+(\d+)\/(\d+)SM\b/);
  if (visMixed) vis = parseInt(visMixed[1]) + parseInt(visMixed[2]) / parseInt(visMixed[3]);
  else if (visFrac) vis = parseInt(visFrac[1]) / parseInt(visFrac[2]);
  else if (visFull) vis = parseInt(visFull[1]);

  // Ceiling: lowest BKN/OVC/OVX layer in hundreds of feet
  let ceiling = Infinity;
  const ceilRe = /\b(BKN|OVC|OVX)(\d{3})\b/g;
  let cm: RegExpExecArray | null;
  while ((cm = ceilRe.exec(metar)) !== null) {
    ceiling = Math.min(ceiling, parseInt(cm[2], 10) * 100);
  }

  if (ceiling < 500 || vis < 1) return 'LIFR';
  if (ceiling < 1000 || vis < 3) return 'IFR';
  if (ceiling < 3000 || vis < 5) return 'MVFR';
  return 'VFR';
}

function headingDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function getActiveRunways(runways: { id: string; heading: number }[], windDir: number) {
  // Land into the wind — pick runway whose heading is closest to wind direction
  return runways
    .map((rwy) => ({ ...rwy, diff: headingDiff(rwy.heading, windDir) }))
    .sort((a, b) => a.diff - b.diff);
}

function groupCharts(charts: Chart[]): Record<string, Chart[]> {
  const groups: Record<string, Chart[]> = {};
  for (const chart of charts) {
    const key = chart.code || 'OTHER';
    if (!groups[key]) groups[key] = [];
    groups[key].push(chart);
  }
  return groups;
}

const CODE_LABELS: Record<string, string> = {
  APD: 'Airport Diagram',
  IAP: 'Instrument Approaches',
  DP: 'Departure Procedures (SIDs)',
  STAR: 'Arrival Procedures (STARs)',
  MIN: 'Takeoff Minimums',
  HOT: 'Airport Hot Spots',
};

export default function AirportPage() {
  const [icao, setIcao] = useState('');
  const [airport, setAirport] = useState<AirportData | null>(null);
  const [charts, setCharts] = useState<ChartsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [highlightIap, setHighlightIap] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = icao.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError('');
    setAirport(null);
    setCharts(null);
    setTab('overview');
    setHighlightIap(false);

    try {
      const [info, chartData] = await Promise.all([
        api.airports.info(id) as Promise<AirportData>,
        api.airports.charts(id) as Promise<ChartsResponse>,
      ]);
      if (!info) throw new Error(`Airport ${id} not found.`);
      setAirport(info);
      setCharts(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch airport.');
    } finally {
      setLoading(false);
    }
  }

  const wind = airport ? parseMetarWind(airport.metar ?? '') : null;
  const flightRules = airport ? parseMetarFlightRules(airport.metar ?? '') : null;
  const isIfr = flightRules === 'IFR' || flightRules === 'LIFR';
  const runways = airport ? parseRunways(airport.rwyDir ?? '') : [];
  const rankedRunways = wind ? getActiveRunways(runways, wind.dir) : runways.map((r) => ({ ...r, diff: null }));
  const hasApproaches = charts && !charts.international && charts.charts.some((c) => c.code === 'IAP');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Airport Info</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Location · Elevation · Runways · Charts
        </p>
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
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {airport && (
        <div className="card space-y-4">
          {/* Airport header */}
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {airport.icaoId}
              </h2>
              {airport.iataId && (
                <span className="text-slate-500 font-mono text-sm">{airport.iataId}</span>
              )}
            </div>
            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{airport.name}</p>
            <p className="text-slate-500 text-sm">
              {airport.state && `${airport.state}, `}
              {airport.country}
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
            {(['overview', 'runways', 'charts'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
                  tab === t
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                ].join(' ')}
              >
                {t}
                {t === 'charts' && charts && charts.charts.length > 0 && (
                  <span className="ml-1.5 text-xs bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 rounded-full px-1.5 py-0.5">
                    {charts.charts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Elevation" value={`${airport.elev} ft MSL`} />
                <Stat
                  label="Coordinates"
                  value={`${airport.lat?.toFixed(4)}° N, ${airport.lon?.toFixed(4)}°`}
                />
                {airport.rwyLen > 0 && (
                  <Stat label="Longest Runway" value={`${airport.rwyLen.toLocaleString()} ft`} />
                )}
              </div>

              {isIfr && hasApproaches && (
                <div className={[
                  'flex items-center justify-between gap-4 rounded-lg px-4 py-3 border',
                  flightRules === 'LIFR'
                    ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-300 dark:border-fuchsia-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
                ].join(' ')}>
                  <div className="flex items-center gap-3">
                    <span className={[
                      'text-xs font-bold tracking-widest px-2 py-0.5 rounded',
                      flightRules === 'LIFR'
                        ? 'bg-fuchsia-600 text-white'
                        : 'bg-red-600 text-white',
                    ].join(' ')}>
                      {flightRules}
                    </span>
                    <span className={[
                      'text-sm font-medium',
                      flightRules === 'LIFR'
                        ? 'text-fuchsia-700 dark:text-fuchsia-300'
                        : 'text-red-700 dark:text-red-300',
                    ].join(' ')}>
                      Instrument conditions — approach plates required
                    </span>
                  </div>
                  <button
                    onClick={() => { setTab('charts'); setHighlightIap(true); }}
                    className={[
                      'flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors',
                      flightRules === 'LIFR'
                        ? 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white',
                    ].join(' ')}
                  >
                    View Approaches →
                  </button>
                </div>
              )}

              {airport.metar && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current METAR</p>
                  <p className="text-slate-700 dark:text-slate-300 font-mono text-sm bg-slate-100 dark:bg-slate-950 rounded-lg p-3 break-all">
                    {airport.metar}
                  </p>
                </div>
              )}

              {wind && (
                <div className="flex items-center gap-3 text-sm">
                  <WindArrow dir={wind.dir} />
                  <span className="text-slate-700 dark:text-slate-300">
                    Wind{' '}
                    <span className="font-mono font-semibold">
                      {String(wind.dir).padStart(3, '0')}°
                    </span>{' '}
                    at{' '}
                    <span className="font-mono font-semibold">{wind.speed} kt</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Runways tab */}
          {tab === 'runways' && (
            <div className="space-y-3">
              {runways.length === 0 ? (
                <p className="text-slate-500 text-sm">No runway data available.</p>
              ) : (
                <>
                  {wind && (
                    <p className="text-xs text-slate-500">
                      Runways sorted by wind favor (
                      <span className="font-mono">
                        {String(wind.dir).padStart(3, '0')}°/{wind.speed} kt
                      </span>
                      ). Best option at top.
                    </p>
                  )}
                  <div className="space-y-2">
                    {rankedRunways.map((rwy, i) => {
                      const isBest = wind && i === 0;
                      const crosswind =
                        wind && rwy.diff != null
                          ? Math.round(Math.abs(Math.sin((rwy.diff * Math.PI) / 180) * wind.speed))
                          : null;
                      const headwind =
                        wind && rwy.diff != null
                          ? Math.round(Math.abs(Math.cos((rwy.diff * Math.PI) / 180) * wind.speed))
                          : null;

                      return (
                        <div
                          key={rwy.id}
                          className={[
                            'rounded-lg p-3 flex items-center justify-between gap-4',
                            isBest
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                              : 'bg-slate-100 dark:bg-slate-950',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-3">
                            {isBest && (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                Best
                              </span>
                            )}
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-lg">
                              RWY {rwy.id}
                            </span>
                            <span className="text-slate-500 text-sm font-mono">
                              HDG {String(rwy.heading).padStart(3, '0')}°
                            </span>
                          </div>
                          {wind && headwind !== null && crosswind !== null && (
                            <div className="flex gap-3 text-xs text-slate-500 font-mono">
                              <span>
                                <span className="text-slate-400">HW</span> {headwind} kt
                              </span>
                              <span>
                                <span className="text-slate-400">XW</span> {crosswind} kt
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!wind && (
                    <p className="text-xs text-slate-400 mt-2">
                      No wind data — look up METAR to see runway recommendations.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Charts tab */}
          {tab === 'charts' && (
            <div className="space-y-4">
              {charts?.international ? (
                <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-950 rounded-lg p-4">
                  FAA d-TPP charts are only available for US airports (K/P/A prefixes). For
                  international charts, consult your national AIP or Jeppesen.
                </div>
              ) : !charts || charts.charts.length === 0 ? (
                <p className="text-slate-500 text-sm">No charts found for current AIRAC cycle.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    AIRAC cycle{' '}
                    <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {charts.cycle}
                    </span>{' '}
                    · FAA d-TPP · Opens in new tab
                  </p>

                  {Object.entries(groupCharts(charts.charts))
                    .sort(([a], [b]) => (CHART_ORDER[a] ?? 99) - (CHART_ORDER[b] ?? 99))
                    .map(([code, items]) => (
                      <div
                        key={code}
                        className={[
                          'rounded-lg transition-colors',
                          highlightIap && code === 'IAP'
                            ? 'ring-2 ring-red-400 dark:ring-red-600 p-3 -mx-3'
                            : '',
                        ].join(' ')}
                      >
                        <p className={[
                          'text-xs uppercase tracking-wider mb-2',
                          highlightIap && code === 'IAP'
                            ? 'text-red-500 dark:text-red-400 font-semibold'
                            : 'text-slate-500',
                        ].join(' ')}>
                          {CODE_LABELS[code] ?? code}
                        </p>
                        <div className="space-y-1">
                          {items.map((chart) => (
                            <a
                              key={chart.pdfUrl}
                              href={chart.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-slate-100 dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors group"
                            >
                              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 font-mono">
                                {chart.name}
                              </span>
                              <svg
                                className="w-4 h-4 text-slate-400 group-hover:text-sky-500 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-100 dark:bg-slate-950 rounded-lg p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-slate-800 dark:text-slate-100 font-mono text-sm mt-1">{value}</p>
    </div>
  );
}

function WindArrow({ dir }: { dir: number }) {
  return (
    <div
      className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30"
      style={{ transform: `rotate(${dir}deg)` }}
      title={`Wind from ${dir}°`}
    >
      <svg
        className="w-4 h-4 text-sky-600 dark:text-sky-400"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L7 10h5v12h2V10h5L12 2z" />
      </svg>
    </div>
  );
}
