import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import WeatherPage from './pages/WeatherPage';
import NOTAMPage from './pages/NOTAMPage';
import AirportPage from './pages/AirportPage';

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

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar dark={dark} onToggle={() => setDark((d) => !d)} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <Routes>
          <Route path="/" element={<Navigate to="/weather" replace />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/notams" element={<NOTAMPage />} />
          <Route path="/airports" element={<AirportPage />} />
        </Routes>
      </main>
    </div>
  );
}
