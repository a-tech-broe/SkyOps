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
}

export default function AirportsScreen() {
  const [icao, setIcao] = useState('');
  const [airport, setAirport] = useState<AirportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const id = icao.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError('');
    setAirport(null);
    try {
      const res = await api.airports(id);
      if (!res) throw new Error(`${id} not found`);
      setAirport(res as AirportData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="ICAO"
          placeholderTextColor="#475569"
          value={icao}
          onChangeText={(t) => setIcao(t.toUpperCase())}
          maxLength={4}
          autoCapitalize="characters"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
          <Text style={s.btnText}>Lookup</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />}
      {error ? <Text style={s.error}>{error}</Text> : null}

      {airport && (
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.icao}>{airport.icaoId}</Text>
            {airport.iataId ? <Text style={s.iata}>{airport.iataId}</Text> : null}
          </View>
          <Text style={s.name}>{airport.name}</Text>
          <Text style={s.location}>{[airport.state, airport.country].filter(Boolean).join(', ')}</Text>

          <View style={s.grid}>
            <StatBox label="Elevation" value={`${airport.elev} ft`} />
            <StatBox label="Lat" value={`${airport.lat?.toFixed(4)}°`} />
            <StatBox label="Lon" value={`${airport.lon?.toFixed(4)}°`} />
            {airport.rwyLen ? <StatBox label="Longest Rwy" value={`${airport.rwyLen} ft`} /> : null}
          </View>

          {airport.rwyDir ? (
            <View>
              <Text style={s.sectionLabel}>Runways</Text>
              <Text style={s.rwy}>{airport.rwyDir}</Text>
            </View>
          ) : null}
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
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  icao: { color: '#f1f5f9', fontSize: 28, fontWeight: '800', fontFamily: 'monospace' },
  iata: { color: '#475569', fontSize: 14, fontFamily: 'monospace' },
  name: { color: '#cbd5e1', fontSize: 16, fontWeight: '600' },
  location: { color: '#64748b', fontSize: 13 },
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
  sectionLabel: { color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  rwy: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 },
});
