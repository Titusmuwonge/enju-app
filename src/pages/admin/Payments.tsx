import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import type { IntegrationProvider, IntegrationStatus } from '../../types/database'

interface IntegrationRow {
  id: string | null
  fenceId: string
  fenceName: string
  ownerName: string
  provider: IntegrationProvider
  status: IntegrationStatus
  merchantName: string
  shortCode: string
}

const PROVIDERS: IntegrationProvider[] = ['mtn_momo', 'airtel_money']
const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  mtn_momo: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
}

export default function AdminPayments() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<IntegrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [expandedFence, setExpandedFence] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: fences }, { data: integrations }] = await Promise.all([
      supabase.from('fences').select('id, name, owner:profiles!fences_owner_id_fkey ( full_name, phone )'),
      supabase.from('payment_integrations').select('*'),
    ])

    const mapped: IntegrationRow[] = []
    for (const f of fences ?? []) {
      const owner = (f as any).owner
      for (const provider of PROVIDERS) {
        const existing = (integrations ?? []).find((i) => i.fence_id === f.id && i.provider === provider)
        mapped.push({
          id: existing?.id ?? null,
          fenceId: f.id,
          fenceName: (f as any).name,
          ownerName: owner?.full_name ?? owner?.phone ?? 'Unknown',
          provider,
          status: existing?.status ?? 'not_configured',
          merchantName: existing?.public_config?.merchant_name ?? '',
          shortCode: existing?.public_config?.short_code ?? '',
        })
      }
    }
    setRows(mapped)
    setLoading(false)
  }

  async function save(row: IntegrationRow, patch: Partial<IntegrationRow>) {
    const key = `${row.fenceId}:${row.provider}`
    setSavingKey(key)
    const next = { ...row, ...patch }

    const { error } = await supabase.from('payment_integrations').upsert(
      {
        id: row.id ?? undefined,
        fence_id: row.fenceId,
        provider: row.provider,
        status: next.status,
        public_config: { merchant_name: next.merchantName, short_code: next.shortCode },
        configured_by: profile?.id,
      },
      { onConflict: 'fence_id,provider' }
    )

    if (!error) await load()
    setSavingKey(null)
  }

  const statusBadge = (status: IntegrationStatus) => {
    if (status === 'connected')
      return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Connected</span>
    if (status === 'disabled')
      return <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/50">Disabled</span>
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Not set up</span>
  }

  const byFence = rows.reduce<Record<string, IntegrationRow[]>>((acc, r) => {
    acc[r.fenceId] = acc[r.fenceId] ?? []
    acc[r.fenceId].push(r)
    return acc
  }, {})

  return (
    <div className="min-h-full p-4 md:p-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl font-extrabold text-ink md:text-2xl">Payment integrations</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/60">
          Bank transfer and cash always stay manual — a manager confirms with evidence, same as
          today. Mobile money can route through a real merchant API per building once it's
          connected here; it shows up as a status badge on that landlord's own dashboard. Actual
          merchant keys live in Edge Function secrets, never in this table — connecting a provider
          for real is a follow-up step once Titus has live merchant credentials for that building.
        </p>
      </header>

      {loading ? (
        <p className="text-ink/50">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(byFence).map(([fenceId, fenceRows]) => (
            <div key={fenceId} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
              <button
                onClick={() => setExpandedFence(expandedFence === fenceId ? null : fenceId)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-semibold text-ink">{fenceRows[0].fenceName}</p>
                  <p className="text-xs text-ink/50">Owner: {fenceRows[0].ownerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {fenceRows.some((r) => r.status === 'connected') ? statusBadge('connected') : statusBadge('not_configured')}
                  <span className="text-ink/30">{expandedFence === fenceId ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedFence === fenceId && (
                <div className="border-t border-ink/10 bg-ink/[0.02] p-4">
                  {fenceRows.map((row) => {
                    const key = `${row.fenceId}:${row.provider}`
                    return (
                      <div key={key} className="mb-4 last:mb-0">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-bold text-ink">{PROVIDER_LABEL[row.provider]}</p>
                          {statusBadge(row.status)}
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            defaultValue={row.merchantName}
                            placeholder="Merchant display name"
                            onBlur={(e) => save(row, { merchantName: e.target.value })}
                            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                          />
                          <input
                            defaultValue={row.shortCode}
                            placeholder="Merchant short code"
                            onBlur={(e) => save(row, { shortCode: e.target.value })}
                            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                          />
                          <select
                            value={row.status}
                            disabled={savingKey === key}
                            onChange={(e) => save(row, { status: e.target.value as IntegrationStatus })}
                            className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold"
                          >
                            <option value="not_configured">Not set up</option>
                            <option value="connected">Connected</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
