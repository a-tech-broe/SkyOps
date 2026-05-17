import { getDeviceId } from '../utils/deviceId';

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
  airports: {
    info: (icao: string) => get(`/airports/${icao}`),
    charts: (icao: string) => get(`/airports/${icao}/charts`),
    alternates: (icao: string, radiusNm = 50) =>
      get(`/airports/${icao}/alternates?radius=${radiusNm}`),
  },
  winds: (icao: string) => get(`/winds/${icao}`),
  map: {
    metars: (bbox: string) => get(`/map/metars?bbox=${bbox}`),
    sigmets: () => get(`/map/sigmets`),
    tfrs: () => get(`/map/tfrs`),
  },
  history: {
    get: (type: string) =>
      get<string[]>(`/history?deviceId=${getDeviceId()}&type=${type}`),
    record: (icao: string, type: string) => {
      fetch(`${BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId(), icao, type }),
      }).catch(() => {});
    },
  },
};
