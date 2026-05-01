import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import WeatherPage from './pages/WeatherPage';
import NOTAMPage from './pages/NOTAMPage';
import AirportPage from './pages/AirportPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
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
