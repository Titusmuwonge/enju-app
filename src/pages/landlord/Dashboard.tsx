import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

type MonthStatus = 'confirmed' | 'pending' | 'none'

interface TenantRow {
  tenancyId: string
  unitLabel: string
  fenceName: string
  tenantName: string
  monthlyRent: number
  status: MonthStatus
  pendingPaymentId: string | null
  confirmedPaymentId: string | null
  evidencePath: string | null
}

interface ConnectedIntegration {
  fenceName: string
  providerLabel: string
  merchantName: string
}

const PROVIDER_LABEL: Record<string, string> = { mtn_momo: 'MTN Mobile Money', airtel_money: 'Airtel Money' }

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

export default function LandlordDashboard() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<TenantRow[]>([])
  const [connected, setConnected] = useState<ConnectedIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    void loadTenants()
    void loadIntegrations()
  }, [profile?.id])

  async function loadIntegrations() {
    // RLS scopes this to fences this landlord/manager owns or manages — see
    // "owner/manager read own fence integrations" policy.
    const { data } = await supabase
      .from('payment_integrations')
      .select('provider, public_config, fence:fences ( name )')
      .eq('status', 'connected')
    setConnected(
      (data ?? []).map((i: any) => ({
        fenceName: i.fence?.name ?? 'Your building',
        providerLabel: PROVIDER_LABEL[i.provider] ?? i.provider,
        merchantName: i.public_config?.merchant_name ?? '',
      }))
    )
  }

  async function loadTenants() {
    setLoading(true)
    const { data: tenancies } = await supabase
      .from('tenancies')
      .select(
        `id, status,
         unit:units ( label, monthly_rent, fence:fences ( name ) ),
         tenant:profiles!tenancies_tenant_id_fkey ( full_name, phone ),
         payments ( id, status, period_month, evidence_path )`
      )
      .eq('status', 'active')

    const thisMonth = currentMonthKey()

    const mapped: TenantRow[] = (tenancies ?? []).map((t: any) => {
      const payments: any[] = t.payments ?? []
      const thisMonthPayments = payments.filter((p) => p.period_month.slice(0, 7) === thisMonth)
      const confirmed = thisMonthPayments.find((p) => p.status === 'confirmed')
      const pending = thisMonthPayments.find((p) => p.status === 'pending')

      return {
        tenancyId: t.id,
        unitLabel: t.unit?.label ?? '—',
        fenceName: t.unit?.fence?.name ?? '—',
        tenantName: t.tenant?.full_name ?? t.tenant?.phone ?? 'Unnamed tenant',
        monthlyRent: t.unit?.monthly_rent ?? 0,
        status: confirmed ? 'confirmed' : pending ? 'pending' : 'none',
        pendingPaymentId: pending?.id ?? null,
        confirmedPaymentId: confirmed?.id ?? null,
        evidencePath: pending?.evidence_path ?? null,
      }
    })
    setRows(mapped)
    setLoading(false)
  }

  async function viewEvidence(path: string) {
    const { data, error } = await supabase.storage
      .from('payment-evidence')
      .createSignedUrl(path, 60)
    if (error || !data) return
    window.open(data.signedUrl, '_blank')
  }

  async function confirmPayment(row: TenantRow) {
    setBusyId(row.tenancyId)

    let paymentId = row.pendingPaymentId

    if (paymentId) {
      // Atomic, race-safe: only the first confirm wins (see confirm_payment_evidence_and_audit migration).
      const { data: confirmed } = await supabase.rpc('confirm_payment', {
        p_payment_id: paymentId,
        p_confirmer: profile?.id,
      })
      if (!confirmed) {
        // Someone else already confirmed it, or it moved on. Just refresh to the real state.
        await loadTenants()
        setBusyId(null)
        return
      }
    } else {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          tenancy_id: row.tenancyId,
          amount: row.monthlyRent,
          method: 'mobile_money',
          period_month: new Date().toISOString().slice(0, 10),
          status: 'confirmed',
          confirmed_by: profile?.id,
          confirmed_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error || !payment) {
        console.error(error)
        setBusyId(null)
        return
      }
      paymentId = payment.id
    }

    const receiptNumber = `ENJ-${Date.now().toString(36).toUpperCase()}`
    await supabase.from('receipts').insert({ payment_id: paymentId, receipt_number: receiptNumber })

    await loadTenants()
    setBusyId(null)
  }

  const statusBadge = (status: MonthStatus) => {
    if (status === 'confirmed')
      return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Paid</span>
    if (status === 'pending')
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Awaiting confirm
        </span>
      )
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Not paid</span>
  }

  const actionLabel = (status: MonthStatus) => (status === 'pending' ? 'Confirm' : 'Mark paid')

  return (
    <div className="min-h-full bg-paper p-4 md:p-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl font-extrabold text-ink md:text-2xl">Your buildings</h1>
        <p className="mt-1 text-sm text-ink/60">Every tenant, every payment, tracked automatically.</p>
      </header>

      {connected.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {connected.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-800">
              <span className="font-bold">●</span>
              {c.fenceName}: {c.providerLabel} connected{c.merchantName ? ` via ${c.merchantName}` : ''} — mobile
              money payments for this building are ready to route automatically once Enju's live.
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-ink/50">Loading tenants…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No tenants yet. Add a building first, then its units.
        </div>
      ) : (
        <>
          {/* Desktop: dense table, built for someone working from a desk */}
          <div className="hidden overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink/[0.03] text-xs font-semibold uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Building</th>
                  <th className="px-5 py-3">Rent</th>
                  <th className="px-5 py-3">This month</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((row) => (
                  <tr key={row.tenancyId}>
                    <td className="px-5 py-4 font-semibold text-ink">{row.tenantName}</td>
                    <td className="px-5 py-4 text-ink/70">{row.unitLabel}</td>
                    <td className="px-5 py-4 text-ink/70">{row.fenceName}</td>
                    <td className="px-5 py-4 text-ink/70">UGX {row.monthlyRent.toLocaleString()}</td>
                    <td className="px-5 py-4">{statusBadge(row.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {row.evidencePath && (
                          <button
                            onClick={() => viewEvidence(row.evidencePath!)}
                            className="text-xs font-bold text-brand-deep hover:underline"
                          >
                            View proof
                          </button>
                        )}
                        {row.status === 'confirmed' && row.confirmedPaymentId && (
                          <Link
                            to={`/receipt/${row.confirmedPaymentId}`}
                            className="text-xs font-bold text-brand-deep hover:underline"
                          >
                            View receipt
                          </Link>
                        )}
                        {row.status !== 'confirmed' && (
                          <button
                            onClick={() => confirmPayment(row)}
                            disabled={busyId === row.tenancyId}
                            className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-deep disabled:opacity-50"
                          >
                            {busyId === row.tenancyId ? '…' : actionLabel(row.status)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards, thumb-friendly, one tenant per card */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <div key={row.tenancyId} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{row.tenantName}</p>
                    <p className="text-xs text-ink/50">
                      {row.unitLabel} · {row.fenceName}
                    </p>
                  </div>
                  {statusBadge(row.status)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink/70">
                    UGX {row.monthlyRent.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-3">
                    {row.evidencePath && (
                      <button
                        onClick={() => viewEvidence(row.evidencePath!)}
                        className="text-xs font-bold text-brand-deep hover:underline"
                      >
                        View proof
                      </button>
                    )}
                    {row.status === 'confirmed' && row.confirmedPaymentId && (
                      <Link
                        to={`/receipt/${row.confirmedPaymentId}`}
                        className="text-xs font-bold text-brand-deep hover:underline"
                      >
                        View receipt
                      </Link>
                    )}
                    {row.status !== 'confirmed' && (
                      <button
                        onClick={() => confirmPayment(row)}
                        disabled={busyId === row.tenancyId}
                        className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-deep disabled:opacity-50"
                      >
                        {busyId === row.tenancyId ? '…' : actionLabel(row.status)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
