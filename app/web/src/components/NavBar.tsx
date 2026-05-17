import { NavLink } from 'react-router-dom';

const links = [
  { to: '/map', label: 'Map' },
  { to: '/weather', label: 'Weather' },
  { to: '/notams', label: 'NOTAMs' },
  { to: '/airports', label: 'Airports' },
  { to: '/winds', label: 'Winds' },
  { to: '/route', label: 'Briefing' },
  { to: '/currency', label: 'Currency' },
  { to: '/dispatch', label: 'Dispatch' },
];

interface Props {
  dark: boolean;
  onToggle: () => void;
}

export default function NavBar({ dark, onToggle }: Props) {
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 max-w-5xl flex items-center h-14 gap-8">
        <div className="flex flex-col leading-tight">
          <span className="text-blue-500 dark:text-blue-400 font-bold text-lg tracking-tight">
            ✈ SkyOps
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-[10px] tracking-wide">
            powered by atechbroe
          </span>
        </div>

        <div className="flex gap-1 flex-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle light/dark mode"
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
