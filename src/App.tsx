import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import LandlordDashboard from './pages/landlord/Dashboard'

function Gate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-ink/40">Loading…</div>
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/landlord"
            element={
              <Gate>
                <LandlordDashboard />
              </Gate>
            }
          />
          <Route path="*" element={<Navigate to="/landlord" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
