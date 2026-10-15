import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import CompleteProfile from './pages/CompleteProfile'
import JoinBuilding from './pages/JoinBuilding'
import Receipt from './pages/Receipt'
import LandlordLayout from './components/LandlordLayout'
import LandlordDashboard from './pages/landlord/Dashboard'
import Fences from './pages/landlord/Fences'
import TenantLayout from './components/TenantLayout'
import TenantHome from './pages/tenant/Home'
import TenantCalendar from './pages/tenant/Calendar'
import TenantDiscover from './pages/tenant/Discover'

function Gate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-ink/40">Loading…</div>
  }
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/complete-profile" replace />
  return <>{children}</>
}

/** Sends a signed-in, profiled user to the part of the app that's theirs. */
function RoleHome() {
  const { profile } = useAuth()
  if (profile?.role === 'tenant') return <Navigate to="/tenant" replace />
  return <Navigate to="/landlord" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          <Route
            path="/join-building"
            element={
              <Gate>
                <JoinBuilding />
              </Gate>
            }
          />

          <Route
            path="/receipt/:paymentId"
            element={
              <Gate>
                <Receipt />
              </Gate>
            }
          />

          <Route
            path="/landlord"
            element={
              <Gate>
                <LandlordLayout />
              </Gate>
            }
          >
            <Route index element={<LandlordDashboard />} />
            <Route path="fences" element={<Fences />} />
          </Route>

          <Route
            path="/tenant"
            element={
              <Gate>
                <TenantLayout />
              </Gate>
            }
          >
            <Route index element={<TenantHome />} />
            <Route path="calendar" element={<TenantCalendar />} />
            <Route path="discover" element={<TenantDiscover />} />
          </Route>

          <Route
            path="/"
            element={
              <Gate>
                <RoleHome />
              </Gate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
