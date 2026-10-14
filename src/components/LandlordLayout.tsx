import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const navItems = [
  { to: '/landlord', label: 'Tenants', icon: '🏠', end: true },
  { to: '/landlord/fences', label: 'Buildings', icon: '🏢', end: false },
]

/**
 * Desktop: full sidebar + dense content area, the way someone working from a
 * desk expects an admin tool to behave.
 * Mobile: sidebar collapses into a bottom tab bar, content goes full width,
 * pages themselves switch to card layouts instead of tables below md.
 */
export default function LandlordLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-ink/10 bg-white p-5 md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-deep">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-extrabold text-ink">Enju</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive ? 'bg-brand/10 text-brand-deep' : 'text-ink/60 hover:bg-ink/5'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink/10 pt-4">
          <p className="truncate text-xs font-semibold text-ink/70">
            {profile?.full_name ?? profile?.phone}
          </p>
          <button onClick={() => void signOut()} className="mt-1 text-xs text-ink/40 hover:text-ink/70">
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-deep">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-base font-extrabold text-ink">Enju</span>
        </div>
        <button onClick={() => void signOut()} className="text-xs font-semibold text-ink/40">
          Sign out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="flex border-t border-ink/10 bg-white md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
                isActive ? 'text-brand-deep' : 'text-ink/40'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
