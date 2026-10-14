import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

interface TenantRow {
  tenancyId: string
  unitLabel: string
  fenceName: string
  tenantName: string
  monthlyRent: number
  lastPaymentStatus: 'confirmed' | 'pending' | 'none'
  lastPaymentPeriod: string | null
}

export default function LandlordDashboard() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    void loadTenants()
  }, [profile?.id])

  async function loadTenants() {
    setLoading(true)
    const { data: tenancies } = await supabase
      .from('tenancies')
      .select(
        `id, status,
         unit:units ( label, monthly_rent, fence:fences ( name ) ),
         tenant:profiles!tenancies_tenant_id_fkey ( full_name, phone ),
         payments ( status, period_month, created_at )`
      )
      .eq('status', 'active')

    const mapped: TenantRow[] = (tenancies ?? []).map((t: any) => {
      const latestPayment = (t.payments ?? []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      return {
        tenancyId: t.id,
        unitLabel: t.unit?.label ?? '—',
        fenceName: t.unit?.fence?.name ?? '—',
        tenantName: t.tenant?.full_name ?? t.tenant?.phone ?? 'Unnamed tenant',
        monthlyRent: t.unit?.monthly_rent ?? 0,
        lastPaymentStatus: latestPayment?.status ?? 'none',
        lastPaymentPeriod: latestPayment?.period_month ?? null,
      }
    })
    setRows(mapped)
    setLoading(false)
  }

  async function markPaid(tenancyId: string, amount: number) {
    const period = new Date().toISOString().slice(0, 10)
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        tenancy_id: tenancyId,
        amount,
        method: 'mobile_money',
        period_month: period,
        status: 'confirmed',
        confirmed_by: profile?.id,
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !payment) {
      console.error(error)
      return
    }

    const receiptNumber = `ENJ-${Date.now().toString(36).toUpperCase()}`
    await supabase.from('receipts').insert({
      payment_id: payment.id,
      receipt_number: receiptNumber,
    })

    await loadTenants()
  }

  return (
    <div className="min-h-full bg-paper p-6 md:p-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Your buildings</h1>
          <p className="mt-1 text-sm text-ink/60">
            Every tenant, every payment, tracked automatically.
          </p>
        </div>
      </header>

      {loading ? (
        <p className="text-ink/50">Loading tenants…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No tenants yet. Add a fence and a unit to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
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
                  <td className="px-5 py-4 text-ink/70">
                    UGX {row.monthlyRent.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        row.lastPaymentStatus === 'confirmed'
                          ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
                          : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'
                      }
                    >
                      {row.lastPaymentStatus === 'confirmed' ? 'Paid' : 'Not paid'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {row.lastPaymentStatus !== 'confirmed' && (
                      <button
                        onClick={() => markPaid(row.tenancyId, row.monthlyRent)}
                        className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-deep"
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
