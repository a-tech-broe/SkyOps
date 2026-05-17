import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import WeatherPage from './pages/WeatherPage';
import NOTAMPage from './pages/NOTAMPage';
import AirportPage from './pages/AirportPage';
import WindsAloftPage from './pages/WindsAloftPage';
import RouteBriefingPage from './pages/RouteBriefingPage';
import CurrencyPage from './pages/CurrencyPage';
import DispatchPage from './pages/DispatchPage';
import MapPage from './pages/MapPage';

export default function App() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const location = useLocation();
  const isMap = location.pathname === '/map';

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar dark={dark} onToggle={() => setDark((d) => !d)} />
      <main className={isMap ? 'flex-1 overflow-hidden' : 'flex-1 container mx-auto px-4 py-6 max-w-5xl'}>
        <Routes>
          <Route path="/" element={<Navigate to="/weather" replace />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/notams" element={<NOTAMPage />} />
          <Route path="/airports" element={<AirportPage />} />
          <Route path="/winds" element={<WindsAloftPage />} />
          <Route path="/route" element={<RouteBriefingPage />} />
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="/dispatch" element={<DispatchPage />} />
        </Routes>
      </main>
    </div>
  );
}
