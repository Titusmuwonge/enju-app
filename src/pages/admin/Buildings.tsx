import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface FenceRow {
  id: string
  name: string
  blockIdCode: string
  ownerName: string
  unitCount: number
  tenantCount: number
}

export default function AdminBuildings() {
  const [rows, setRows] = useState<FenceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: fences } = await supabase
      .from('fences')
      .select(
        `id, name, block_id_code,
         owner:profiles!fences_owner_id_fkey ( full_name, phone ),
         units ( id, tenancies ( id, status ) )`
      )

    const mapped: FenceRow[] = (fences ?? []).map((f: any) => {
      const units: any[] = f.units ?? []
      const tenantCount = units.reduce(
        (sum, u) => sum + (u.tenancies ?? []).filter((t: any) => t.status === 'active').length,
        0
      )
      return {
        id: f.id,
        name: f.name,
        blockIdCode: f.block_id_code,
        ownerName: f.owner?.full_name ?? f.owner?.phone ?? 'Unknown',
        unitCount: units.length,
        tenantCount,
      }
    })
    setRows(mapped)
    setLoading(false)
  }

  return (
    <div className="min-h-full p-4 md:p-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl font-extrabold text-ink md:text-2xl">All buildings</h1>
        <p className="mt-1 text-sm text-ink/60">Every building on Enju, regardless of which landlord owns it.</p>
      </header>

      {loading ? (
        <p className="text-ink/50">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No buildings yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-ink/50">
                    Block {r.blockIdCode} · Owner: {r.ownerName}
                  </p>
                </div>
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/60">
                  {r.unitCount} units
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/60">{r.tenantCount} active tenants</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
