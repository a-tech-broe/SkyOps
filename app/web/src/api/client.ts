import { getDeviceId } from '../utils/deviceId';

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('skyops_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      post<{ token: string; user: { id: string; email: string } }>('/auth/register', { email, password }),
    login: (email: string, password: string) =>
      post<{ token: string; user: { id: string; email: string } }>('/auth/login', { email, password }),
    me: () =>
      get<{ user: { id: string; email: string } }>('/auth/me'),
  },
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
  history: {
    get: (type: string) =>
      get<string[]>(`/history?deviceId=${getDeviceId()}&type=${type}`),
    record: (icao: string, type: string) => {
      request(`/history`, {
        method: 'POST',
        body: JSON.stringify({ deviceId: getDeviceId(), icao, type }),
      }).catch(() => {});
    },
  },
  map: {
    metars: (bbox: string) => get(`/map/metars?bbox=${bbox}`),
    sigmets: () => get(`/map/sigmets`),
    tfrs: () => get(`/map/tfrs`),
  },
};
