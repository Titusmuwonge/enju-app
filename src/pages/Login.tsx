import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendMagicLink() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
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

        {!sent ? (
          <>
            <h1 className="mb-1 text-lg font-bold text-ink">Welcome back</h1>
            <p className="mb-5 text-sm text-ink/60">
              Enter your email, we'll send a sign-in link. No password.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-4 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={sendMagicLink}
              disabled={loading || !email}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-bold text-ink">Check your email</h1>
            <p className="text-sm text-ink/60">
              We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>.
              Open it on this device to continue.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-xs font-semibold text-brand-deep hover:underline"
            >
              Use a different email
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
