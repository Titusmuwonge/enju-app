import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import type { Fence, Unit } from '../../types/database'

function randomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}

export default function Fences() {
  const { profile } = useAuth()
  const [fences, setFences] = useState<(Fence & { units: Unit[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewFence, setShowNewFence] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    void load()
  }, [profile?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('fences')
      .select('*, units(*)')
      .eq('owner_id', profile!.id)
      .order('created_at', { ascending: false })
    setFences((data as any) ?? [])
    setLoading(false)
  }

  async function createFence() {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('fences').insert({
      owner_id: profile!.id,
      name: name.trim(),
      address: address.trim() || null,
      block_id_code: randomCode(),
    })
    setSaving(false)
    if (error) {
      console.error(error)
      return
    }
    setName('')
    setAddress('')
    setShowNewFence(false)
    await load()
  }

  async function addUnit(fenceId: string) {
    const label = window.prompt('Unit label (e.g. Room 3, Unit B)')
    if (!label) return
    const rentStr = window.prompt('Monthly rent (UGX)')
    const rent = Number(rentStr)
    if (!rentStr || Number.isNaN(rent) || rent <= 0) return
    const { error } = await supabase.from('units').insert({
      fence_id: fenceId,
      label,
      monthly_rent: rent,
      status: 'vacant',
    })
    if (error) {
      console.error(error)
      return
    }
    await load()
  }

  return (
    <div className="min-h-full bg-paper p-4 md:p-10">
      <header className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-ink md:text-2xl">Buildings</h1>
          <p className="mt-1 text-sm text-ink/60">Each building gets its own block ID tenants use to join.</p>
        </div>
        <button
          onClick={() => setShowNewFence((v) => !v)}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-deep"
        >
          + Add building
        </button>
      </header>

      {showNewFence && (
        <div className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Building name"
              className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street / landmark"
              className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={createFence}
            disabled={saving || !name.trim()}
            className="mt-4 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create building'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-ink/50">Loading…</p>
      ) : fences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No buildings yet. Add your first one above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fences.map((fence) => (
            <div key={fence.id} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-ink">{fence.name}</p>
                  <p className="text-xs text-ink/50">{fence.address ?? 'No address set'}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-brand-deep">
                  {fence.block_id_code}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {fence.units.length === 0 ? (
                  <p className="text-xs text-ink/40">No units yet.</p>
                ) : (
                  fence.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-ink/80">{unit.label}</span>
                      <span className="text-ink/50">UGX {unit.monthly_rent.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => addUnit(fence.id)}
                className="mt-4 text-xs font-bold text-brand-deep hover:underline"
              >
                + Add unit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
