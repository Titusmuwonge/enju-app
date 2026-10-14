import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import CompleteProfile from './pages/CompleteProfile'
import LandlordLayout from './components/LandlordLayout'
import LandlordDashboard from './pages/landlord/Dashboard'
import Fences from './pages/landlord/Fences'

function Gate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-ink/40">Loading…</div>
  }
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/complete-profile" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
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
          <Route path="*" element={<Navigate to="/landlord" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
