import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Role } from '../types/database'

export default function CompleteProfile() {
  const { session } = useAuth()
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('landlord')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!session?.user) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('profiles').insert({
      id: session.user.id,
      email: session.user.email,
      full_name: fullName.trim() || null,
      role,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    // Profile is picked up by AuthContext's listener on next render;
    // force a reload so the whole tree re-fetches cleanly. BASE_URL (not a bare '/') keeps
    // this correct under a subpath host like GitHub Pages — see Login.tsx for the same fix.
    window.location.href = import.meta.env.BASE_URL
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand to-brand-deep p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="mb-1 text-lg font-bold text-ink">One more step</h1>
        <p className="mb-5 text-sm text-ink/60">Tell us who you are so we can set up the right dashboard.</p>

        <label className="mb-1 block text-xs font-semibold text-ink/60">Your name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="mb-4 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-brand"
        />

        <label className="mb-1 block text-xs font-semibold text-ink/60">I am a</label>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {(['landlord', 'manager', 'tenant'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold capitalize ${
                role === r ? 'border-brand bg-brand/10 text-brand-deep' : 'border-ink/15 text-ink/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
