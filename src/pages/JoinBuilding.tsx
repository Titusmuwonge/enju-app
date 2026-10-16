import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function JoinBuilding() {
  const { session } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function join() {
    if (!session?.user) return
    setLoading(true)
    setError(null)

    const { data: fence } = await supabase
      .from('fences')
      .select('id, name')
      .eq('block_id_code', code.trim().toUpperCase())
      .maybeSingle()

    if (!fence) {
      setLoading(false)
      setError("That code doesn't match a building yet. Check it with your landlord.")
      return
    }

    const { data: vacantUnit } = await supabase
      .from('units')
      .select('id')
      .eq('fence_id', fence.id)
      .eq('status', 'vacant')
      .limit(1)
      .maybeSingle()

    if (!vacantUnit) {
      setLoading(false)
      setError('No open unit found for this building yet. Ask your landlord to add yours.')
      return
    }

    const { error: tenancyError } = await supabase.from('tenancies').insert({
      unit_id: vacantUnit.id,
      tenant_id: session.user.id,
    })

    if (tenancyError) {
      setLoading(false)
      setError(tenancyError.message)
      return
    }

    await supabase.from('units').update({ status: 'occupied' }).eq('id', vacantUnit.id)

    // BASE_URL keeps this correct under a subpath host like GitHub Pages.
    window.location.href = `${import.meta.env.BASE_URL}tenant`
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand to-brand-deep p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="mb-1 text-lg font-bold text-ink">Find your building</h1>
        <p className="mb-5 text-sm text-ink/60">
          Your landlord or caretaker has a short code for your building. Enter it here.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 7KXQP"
          className="mb-4 w-full rounded-xl border border-ink/15 px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-brand"
        />
        <button
          onClick={join}
          disabled={loading || code.trim().length < 3}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
        >
          {loading ? 'Joining…' : 'Join building'}
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
