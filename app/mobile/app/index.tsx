import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CloudLayer { cover: string; base: number }
interface MetarData {
  icaoId: string; name: string; temp: number; dewp: number;
  wdir: number | string; wspd: number; wgst: number | null;
  visib: string; altim: number; wxString: string | null;
  clouds: CloudLayer[]; rawOb: string;
}
interface AirportData {
  icaoId: string; iataId: string; name: string; state: string; country: string;
  lat: number; lon: number; elev: number; rwyDir: string; rwyLen: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlightRules(m: MetarData) {
  const vis = parseFloat(m.visib);
  const ceiling = m.clouds
    ?.filter(c => ['BKN', 'OVC', 'OVX'].includes(c.cover))
    ?.reduce((min, c) => Math.min(min, c.base), Infinity) ?? Infinity;
  if (ceiling < 500 || vis < 1) return { label: 'LIFR', color: '#d946ef' };
  if (ceiling < 1000 || vis < 3) return { label: 'IFR', color: '#ef4444' };
  if (ceiling < 3000 || vis < 5) return { label: 'MVFR', color: '#3b82f6' };
  return { label: 'VFR', color: '#22c55e' };
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

// ─── Weather Panel ────────────────────────────────────────────────────────────

function WeatherPanel({ width }: { width: number }) {
  const [icao, setIcao] = useState('');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const id = icao.trim().toUpperCase();
    if (!id) return;
    setLoading(true); setError(''); setMetar(null);
    try {
      const res = await api.weather.metar(id) as MetarData[];
      setMetar(res[0] ?? null);
      if (!res[0]) setError(`No METAR found for ${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  }

  const fr = metar ? getFlightRules(metar) : null;

  return (
    <ScrollView
      style={[s.panel, { width }]}
      contentContainerStyle={s.panelInner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="ICAO (e.g. KJFK)"
          placeholderTextColor="#475569"
          value={icao}
          onChangeText={t => setIcao(t.toUpperCase())}
          maxLength={4}
          autoCapitalize="characters"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
          <Text style={s.btnText}>Brief</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />}
      {error ? <Text style={s.errorText}>{error}</Text> : null}

      {metar && fr && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.icaoText}>{metar.icaoId}</Text>
            <Text style={[s.frBadge, { color: fr.color }]}>{fr.label}</Text>
          </View>
          <Text style={s.airportName}>{metar.name}</Text>
          <View style={s.grid}>
            <StatBox label="Wind" value={`${metar.wdir}° ${metar.wspd}KT${metar.wgst ? ` G${metar.wgst}` : ''}`} />
            <StatBox label="Visibility" value={`${metar.visib} SM`} />
            <StatBox label="Altimeter" value={`${metar.altim?.toFixed(2)}"`} />
            <StatBox label="Temp / Dew" value={`${metar.temp}° / ${metar.dewp}°C`} />
          </View>
          {metar.wxString ? <Text style={s.wx}>{metar.wxString}</Text> : null}
          <Text style={s.rawLabel}>RAW</Text>
          <Text style={s.raw}>{metar.rawOb}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── NOTAMs Panel ─────────────────────────────────────────────────────────────

function NotamsPanel({ width }: { width: number }) {
  const [icao, setIcao] = useState('');
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const id = icao.trim().toUpperCase();
    if (!id) return;
    setLoading(true); setError(''); setItems([]);
    try {
      const res = await api.notams(id) as { items?: unknown[] };
      setItems(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <ScrollView
      style={[s.panel, { width }]}
      contentContainerStyle={s.panelInner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="ICAO"
          placeholderTextColor="#475569"
          value={icao}
          onChangeText={t => setIcao(t.toUpperCase())}
          maxLength={4}
          autoCapitalize="characters"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
          <Text style={s.btnText}>Fetch</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {items.map((item, i) => {
        const n = (item as {
          properties: { coreNOTAMData: { notam: { number: string; text: string; effectiveStart: string; effectiveEnd: string } } };
        }).properties?.coreNOTAMData?.notam;
        if (!n) return null;
        return (
          <View key={i} style={s.card}>
            <Text style={s.notamNum}>{n.number}</Text>
            <Text style={s.notamDates}>{n.effectiveStart} → {n.effectiveEnd}</Text>
            <Text style={s.notamText}>{n.text}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Airports Panel ───────────────────────────────────────────────────────────

function AirportsPanel({ width }: { width: number }) {
  const [icao, setIcao] = useState('');
  const [airport, setAirport] = useState<AirportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    const id = icao.trim().toUpperCase();
    if (!id) return;
    setLoading(true); setError(''); setAirport(null);
    try {
      const res = await api.airports(id);
      if (!res) throw new Error(`${id} not found`);
      setAirport(res as AirportData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <ScrollView
      style={[s.panel, { width }]}
      contentContainerStyle={s.panelInner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="ICAO"
          placeholderTextColor="#475569"
          value={icao}
          onChangeText={t => setIcao(t.toUpperCase())}
          maxLength={4}
          autoCapitalize="characters"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
          <Text style={s.btnText}>Lookup</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {airport && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.icaoText}>{airport.icaoId}</Text>
            {airport.iataId ? <Text style={s.iata}>{airport.iataId}</Text> : null}
          </View>
          <Text style={s.airportName}>{airport.name}</Text>
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

// ─── Root ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'weather',  label: 'Weather',  icon: 'partly-sunny' as const },
  { key: 'notams',   label: 'NOTAMs',   icon: 'warning'      as const },
  { key: 'airports', label: 'Airports', icon: 'airplane'     as const },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const tabBarRef = useRef<ScrollView>(null);

  function selectTab(index: number) {
    setActiveIndex(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  }

  function onPagerScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Logo — never moves ─────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <Ionicons name="airplane" size={20} color="#3b82f6" />
            <Text style={s.logoText}>
              SKY<Text style={s.logoAccent}>OPS</Text>
            </Text>
          </View>
        </View>

        {/* ── Tab strip — scrolls horizontally, never moves vertically ── */}
        <ScrollView
          ref={tabBarRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          style={s.tabBar}
          contentContainerStyle={s.tabBarInner}
        >
          {TABS.map((tab, i) => {
            const active = activeIndex === i;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.tabBtn, active && s.tabBtnActive]}
                onPress={() => selectTab(i)}
                activeOpacity={0.7}
              >
                <Ionicons name={tab.icon} size={15} color={active ? '#3b82f6' : '#64748b'} />
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active-tab underline indicator */}
        <View style={s.indicatorTrack}>
          <View
            style={[
              s.indicatorBar,
              { width: width / TABS.length, transform: [{ translateX: activeIndex * (width / TABS.length) }] },
            ]}
          />
        </View>

        {/* ── Pager — panels swipe left/right, page body stays static ── */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          decelerationRate="fast"
          onMomentumScrollEnd={onPagerScrollEnd}
          style={s.pager}
          // Prevent vertical gesture leakage into parent
          directionalLockEnabled
        >
          <WeatherPanel  width={width} />
          <NotamsPanel   width={width} />
          <AirportsPanel width={width} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  flex: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: MONO,
  },
  logoAccent: { color: '#3b82f6' },

  // Tab strip
  tabBar: {
    backgroundColor: '#0f172a',
    flexGrow: 0,
    flexShrink: 0,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: 'rgba(59,130,246,0.12)' },
  tabLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#3b82f6' },

  // Indicator line under active tab
  indicatorTrack: {
    height: 2,
    backgroundColor: '#1e293b',
  },
  indicatorBar: {
    height: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 1,
  },

  // Pager
  pager: { flex: 1 },

  // Each panel (full-width page inside the pager)
  panel: { flex: 1 },
  panelInner: { padding: 16, gap: 12, paddingBottom: 24 },

  // Search
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f1f5f9',
    fontFamily: MONO,
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
  errorText: { color: '#f87171', textAlign: 'center', marginTop: 16 },

  // Card
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icaoText: { color: '#f1f5f9', fontSize: 28, fontWeight: '800', fontFamily: MONO },
  frBadge: { fontSize: 14, fontWeight: '700', fontFamily: MONO },
  iata: { color: '#475569', fontSize: 14, fontFamily: MONO },
  airportName: { color: '#94a3b8', fontSize: 14 },
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
  statValue: { color: '#e2e8f0', fontSize: 13, fontFamily: MONO, marginTop: 3 },

  wx: { color: '#fbbf24', fontFamily: MONO, fontSize: 13 },
  rawLabel: { color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  raw: {
    color: '#64748b',
    fontFamily: MONO,
    fontSize: 11,
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 8,
    lineHeight: 16,
  },

  sectionLabel: { color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  rwy: { color: '#94a3b8', fontFamily: MONO, fontSize: 13 },

  notamNum: { color: '#60a5fa', fontFamily: MONO, fontSize: 13, fontWeight: '700' },
  notamDates: { color: '#475569', fontFamily: MONO, fontSize: 11 },
  notamText: { color: '#cbd5e1', fontFamily: MONO, fontSize: 12, lineHeight: 18 },
});
