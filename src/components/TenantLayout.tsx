import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/tenant', label: 'Home', end: true, icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M3 11.5L12 4l9 7.5" stroke={active ? '#1F5BFF' : '#9099B5'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10" stroke={active ? '#1F5BFF' : '#9099B5'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) },
  { to: '/tenant/calendar', label: 'Calendar', end: false, icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <rect x="4" y="5.5" width="16" height="15" rx="2.5" stroke={active ? '#1F5BFF' : '#9099B5'} strokeWidth="2.2" />
        <path d="M8 3.5v4M16 3.5v4M4 10.5h16" stroke={active ? '#1F5BFF' : '#9099B5'} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ) },
  { to: '/tenant/discover', label: 'Discover', end: false, icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="11" cy="11" r="6.5" stroke={active ? '#1F5BFF' : '#9099B5'} strokeWidth="2.2" />
        <path d="M20 20l-4.5-4.5" stroke={active ? '#1F5BFF' : '#9099B5'} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ) },
]

/**
 * Mobile-only, by design. The tenant app is a phone product, full stop —
 * this layout doesn't grow a desktop variant the way the landlord side does.
 */
export default function TenantLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-paper">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-ink/10 bg-white/95 py-2 backdrop-blur">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            {({ isActive }) => (
              <>
                {tab.icon(isActive)}
                <span className={`text-[11px] font-semibold ${isActive ? 'text-brand-deep' : 'text-ink/40'}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
