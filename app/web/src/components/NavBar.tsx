import { NavLink } from 'react-router-dom';

const links = [
  { to: '/weather', label: 'Weather' },
  { to: '/notams', label: 'NOTAMs' },
  { to: '/airports', label: 'Airports' },
];

export default function NavBar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 max-w-5xl flex items-center h-14 gap-8">
        <div className="flex flex-col leading-tight">
          <span className="text-blue-400 font-bold text-lg tracking-tight">
            ✈ SkyOps
          </span>
          <span className="text-slate-500 text-[10px] tracking-wide">
            powered by atechbroe
          </span>
        </div>
        <div className="flex gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
