const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  weather: {
    metar: (icao: string) => get(`/weather/metar/${icao}`),
    taf: (icao: string) => get(`/weather/taf/${icao}`),
    pireps: (icao: string) => get(`/weather/pireps/${icao}`),
    sigmets: () => get(`/weather/sigmets`),
  },
  notams: (icao: string) => get(`/notams/${icao}`),
  airports: (icao: string) => get(`/airports/${icao}`),
};
