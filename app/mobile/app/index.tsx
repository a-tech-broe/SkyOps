import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { api } from '../src/api/client';

interface CloudLayer { cover: string; base: number }
interface MetarData {
  icaoId: string;
  name: string;
  temp: number;
  dewp: number;
  wdir: number | string;
  wspd: number;
  wgst: number | null;
  visib: string;
  altim: number;
  wxString: string | null;
  clouds: CloudLayer[];
  rawOb: string;
}

function getFlightRules(m: MetarData) {
  const vis = parseFloat(m.visib);
  const ceiling = m.clouds
    ?.filter((c) => ['BKN', 'OVC', 'OVX'].includes(c.cover))
    ?.reduce((min, c) => Math.min(min, c.base), Infinity) ?? Infinity;
  if (ceiling < 500 || vis < 1) return { label: 'LIFR', color: '#d946ef' };
  if (ceiling < 1000 || vis < 3) return { label: 'IFR', color: '#ef4444' };
  if (ceiling < 3000 || vis < 5) return { label: 'MVFR', color: '#3b82f6' };
  return { label: 'VFR', color: '#22c55e' };
}

export default function WeatherScreen() {
  const [icao, setIcao] = useState('');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const id = icao.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError('');
    setMetar(null);
    try {
      const res = await api.weather.metar(id) as MetarData[];
      setMetar(res[0] ?? null);
      if (!res[0]) setError(`No METAR found for ${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  const fr = metar ? getFlightRules(metar) : null;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="ICAO (e.g. KJFK)"
          placeholderTextColor="#475569"
          value={icao}
          onChangeText={(t) => setIcao(t.toUpperCase())}
          maxLength={4}
          autoCapitalize="characters"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
          <Text style={s.btnText}>Brief</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />}

      {error ? <Text style={s.error}>{error}</Text> : null}

      {metar && fr && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.icao}>{metar.icaoId}</Text>
            <Text style={[s.frBadge, { color: fr.color }]}>{fr.label}</Text>
          </View>
          <Text style={s.airportName}>{metar.name}</Text>

          <View style={s.grid}>
            <StatBox label="Wind" value={`${metar.wdir}° ${metar.wspd}KT${metar.wgst ? ` G${metar.wgst}` : ''}`} />
            <StatBox label="Visibility" value={`${metar.visib} SM`} />
            <StatBox label="Altimeter" value={`${metar.altim?.toFixed(2)}"`} />
            <StatBox label="Temp / Dew" value={`${metar.temp}° / ${metar.dewp}°C`} />
          </View>

          {metar.wxString ? (
            <Text style={s.wx}>{metar.wxString}</Text>
          ) : null}

          <Text style={s.rawLabel}>RAW</Text>
          <Text style={s.raw}>{metar.rawOb}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f1f5f9',
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#f87171', textAlign: 'center', marginTop: 16 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icao: { color: '#f1f5f9', fontSize: 28, fontWeight: '800', fontFamily: 'monospace' },
  frBadge: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  airportName: { color: '#94a3b8', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 10,
    minWidth: '47%',
    flex: 1,
  },
  statLabel: { color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', marginTop: 3 },
  wx: { color: '#fbbf24', fontFamily: 'monospace', fontSize: 13 },
  rawLabel: { color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  raw: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 11,
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 8,
    lineHeight: 16,
  },
});
