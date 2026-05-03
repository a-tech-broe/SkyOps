export interface Chart {
  code: string;
  name: string;
  pdfUrl: string;
}

// AIRAC cycle 01 effective dates per year (Jan start date)
const CYCLE_01_STARTS: Record<number, string> = {
  2024: '2024-01-18',
  2025: '2025-01-23',
  2026: '2026-01-22',
  2027: '2027-01-21',
  2028: '2028-01-20',
};

export function getCurrentCycle(): string {
  const now = new Date();
  const year = now.getFullYear();

  for (let y = year; y >= year - 1; y--) {
    const startStr = CYCLE_01_STARTS[y];
    if (!startStr) continue;
    const start = new Date(startStr);
    if (start > now) continue;
    const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const cycleNum = Math.floor(days / 28) + 1;
    return `${String(y).slice(-2)}${String(cycleNum).padStart(2, '0')}`;
  }
  return '2604';
}

let cachedCycle = '';
let cachedXml = '';
const chartCache = new Map<string, Chart[]>();

async function ensureXml(cycle: string): Promise<string> {
  if (cachedCycle === cycle && cachedXml) return cachedXml;
  const url = `https://aeronav.faa.gov/d-tpp/${cycle}/xml_data/d-TPP_Metafile.xml`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`d-TPP index unavailable (${res.status})`);
  cachedXml = await res.text();
  cachedCycle = cycle;
  chartCache.clear();
  return cachedXml;
}

function parseCharts(xml: string, icao: string, cycle: string): Chart[] {
  const airportRe = new RegExp(
    `<airport[^>]+icao_ident="${icao.toUpperCase()}"[^>]*>([\\s\\S]*?)<\\/airport>`,
    'i'
  );
  const airportMatch = xml.match(airportRe);
  if (!airportMatch) return [];

  const section = airportMatch[1];
  const charts: Chart[] = [];
  const recordRe = /<record>([\s\S]*?)<\/record>/gi;
  let m: RegExpExecArray | null;

  while ((m = recordRe.exec(section)) !== null) {
    const rec = m[1];
    const tag = (t: string) => {
      const tm = rec.match(new RegExp(`<${t}>([^<]*)<\\/${t}>`));
      return tm ? tm[1].trim() : '';
    };
    const code = tag('chart_code');
    const name = tag('chart_name');
    const pdf  = tag('pdf_name');
    if (code && name && pdf) {
      charts.push({ code, name, pdfUrl: `https://aeronav.faa.gov/d-tpp/${cycle}/${pdf}` });
    }
  }
  return charts;
}

export async function getAirportCharts(icao: string): Promise<Chart[]> {
  const upper = icao.toUpperCase();
  const cycle  = getCurrentCycle();
  const key    = `${cycle}:${upper}`;

  if (chartCache.has(key)) return chartCache.get(key)!;

  const xml    = await ensureXml(cycle);
  const charts = parseCharts(xml, upper, cycle);
  chartCache.set(key, charts);
  return charts;
}
