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
import AdminLayout from './components/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminBuildings from './pages/admin/Buildings'
import AdminPayments from './pages/admin/Payments'

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
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/landlord" replace />
}

/** Extra gate for admin-only routes: a non-admin who wanders to /admin gets bounced home. */
function AdminGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            path="/admin"
            element={
              <Gate>
                <AdminGate>
                  <AdminLayout />
                </AdminGate>
              </Gate>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="buildings" element={<AdminBuildings />} />
            <Route path="payments" element={<AdminPayments />} />
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
