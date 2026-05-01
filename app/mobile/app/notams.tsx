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

export default function NOTAMScreen() {
  const [icao, setIcao] = useState('');
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const id = icao.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError('');
    setItems([]);
    try {
      const res = await api.notams(id) as { items?: unknown[] };
      setItems(res.items ?? []);
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
          <Text style={s.btnText}>Fetch</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />}
      {error ? <Text style={s.error}>{error}</Text> : null}

      {items.map((item, i) => {
        const n = (item as { properties: { coreNOTAMData: { notam: { number: string; text: string; effectiveStart: string; effectiveEnd: string } } } }).properties?.coreNOTAMData?.notam;
        if (!n) return null;
        return (
          <View key={i} style={s.card}>
            <Text style={s.notamNum}>{n.number}</Text>
            <Text style={s.dates}>{n.effectiveStart} → {n.effectiveEnd}</Text>
            <Text style={s.text}>{n.text}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  notamNum: { color: '#60a5fa', fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  dates: { color: '#475569', fontFamily: 'monospace', fontSize: 11 },
  text: { color: '#cbd5e1', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
});
