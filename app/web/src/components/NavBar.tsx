import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const airportsDropdownLinks = [
  { to: '/map',      label: 'Map'     },
  { to: '/weather',  label: 'Weather' },
  { to: '/winds',    label: 'Winds'   },
];

const opsDropdownLinks = [
  { to: '/route',    label: 'Briefing' },
  { to: '/currency', label: 'Currency' },
  { to: '/dispatch', label: 'Dispatch' },
];

const AIRPORTS_PATHS = new Set(['/airports', '/map', '/weather', '/winds']);
const OPS_PATHS      = new Set(['/ops', '/route', '/currency', '/dispatch']);

const NAV_ITEM = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap';
const NAV_ACTIVE = 'bg-blue-600 text-white';
const NAV_IDLE = 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800';

interface Props {
  dark: boolean;
  onToggle: () => void;
}

export default function NavBar({ dark, onToggle }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const airportsActive = AIRPORTS_PATHS.has(location.pathname);
  const opsActive      = OPS_PATHS.has(location.pathname);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 max-w-7xl flex items-center h-14 gap-6">

        {/* Logo */}
        <div className="flex flex-col leading-tight flex-shrink-0">
          <span className="text-blue-500 dark:text-blue-400 font-bold text-lg tracking-tight">
            ✈ SkyOps
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-[10px] tracking-wide">
            powered by atechbroe
          </span>
        </div>

        {/* Nav links — only shown when logged in */}
        {user && (
          <div className="flex gap-1 flex-1 overflow-x-auto items-center">

            {/* Airports dropdown */}
            <div className="relative group">
              <NavLink
                to="/airports"
                className={`${NAV_ITEM} inline-flex items-center gap-1 ${airportsActive ? NAV_ACTIVE : NAV_IDLE}`}
              >
                Airports
                <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 8L1 3h10z"/>
                </svg>
              </NavLink>

              {/* Dropdown panel */}
              <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden min-w-[130px]">
                  {airportsDropdownLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Ops dropdown */}
            <div className="relative group">
              <NavLink
                to="/ops"
                className={`${NAV_ITEM} inline-flex items-center gap-1 ${opsActive ? NAV_ACTIVE : NAV_IDLE}`}
              >
                Ops
                <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 8L1 3h10z"/>
                </svg>
              </NavLink>

              <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden min-w-[130px]">
                  {opsDropdownLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* User email chip + logout */}
          {user && (
            <>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Log out
              </button>
            </>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle light/dark mode"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
