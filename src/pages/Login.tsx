import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState<'phone' | 'otp'>('phone')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendOtp() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStage('otp')
  }

  async function verifyOtp() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand to-brand-deep p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[#d7e3ff] shadow-md">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M3 11.5L12 4l9 7.5" stroke="#1F5BFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10" stroke="#1F5BFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-ink">Enju</span>
        </div>

        {stage === 'phone' ? (
          <>
            <h1 className="mb-1 text-lg font-bold text-ink">Welcome back</h1>
            <p className="mb-5 text-sm text-ink/60">Sign in with your phone number.</p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 7XX XXX XXX"
              className="mb-4 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={sendOtp}
              disabled={loading || !phone}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-bold text-ink">Enter the code</h1>
            <p className="mb-5 text-sm text-ink/60">We sent a code to {phone}.</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="mb-4 w-full rounded-xl border border-ink/15 px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-brand"
            />
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
