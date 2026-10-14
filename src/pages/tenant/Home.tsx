import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

interface TenancyInfo {
  tenancyId: string
  unitLabel: string
  fenceName: string
  monthlyRent: number
  paidThisMonth: boolean
  pendingThisMonth: boolean
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function TenantHome() {
  const { profile, session } = useAuth()
  const [info, setInfo] = useState<TenancyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    void load()
  }, [session?.user?.id])

  async function load() {
    setLoading(true)
    const { data: tenancy } = await supabase
      .from('tenancies')
      .select(
        `id, unit:units ( label, monthly_rent, fence:fences ( name ) ),
         payments ( status, period_month )`
      )
      .eq('tenant_id', session!.user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!tenancy) {
      setInfo(null)
      setLoading(false)
      return
    }

    const thisMonth = startOfMonth().toISOString().slice(0, 7) // YYYY-MM
    const payments = (tenancy as any).payments ?? []
    const paidThisMonth = payments.some(
      (p: any) => p.status === 'confirmed' && p.period_month.slice(0, 7) === thisMonth
    )
    const pendingThisMonth = payments.some(
      (p: any) => p.status === 'pending' && p.period_month.slice(0, 7) === thisMonth
    )

    setInfo({
      tenancyId: (tenancy as any).id,
      unitLabel: (tenancy as any).unit?.label ?? '—',
      fenceName: (tenancy as any).unit?.fence?.name ?? '—',
      monthlyRent: (tenancy as any).unit?.monthly_rent ?? 0,
      paidThisMonth,
      pendingThisMonth,
    })
    setLoading(false)
  }

  async function markPaid() {
    if (!info) return
    setSubmitting(true)
    const period = new Date().toISOString().slice(0, 10)
    await supabase.from('payments').insert({
      tenancy_id: info.tenancyId,
      amount: info.monthlyRent,
      method: 'mobile_money',
      period_month: period,
      status: 'pending',
    })
    setSubmitting(false)
    await load()
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-ink/40">Loading…</div>
  }

  if (!info) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink/50">You're not linked to a building yet.</p>
        <a href="/join-building" className="text-sm font-bold text-brand-deep hover:underline">
          Join a building
        </a>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6">
      <p className="text-sm text-ink/50">
        {profile?.full_name ? `Hey ${profile.full_name.split(' ')[0]}` : 'Hey there'}
      </p>
      <h1 className="mt-0.5 text-2xl font-extrabold text-ink">{info.fenceName}</h1>
      <p className="text-sm text-ink/50">{info.unitLabel}</p>

      {/* Hero status card — the one bold moment on this screen */}
      <div
        className={`mt-5 overflow-hidden rounded-3xl p-6 text-white shadow-lg ${
          info.paidThisMonth
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
            : 'bg-gradient-to-br from-brand to-brand-deep'
        }`}
      >
        {info.paidThisMonth ? (
          <>
            <p className="text-sm font-semibold text-white/80">This month</p>
            <p className="mt-1 text-3xl font-extrabold">You're all set</p>
            <p className="mt-2 text-sm text-white/80">Rent for this month is confirmed paid.</p>
          </>
        ) : info.pendingThisMonth ? (
          <>
            <p className="text-sm font-semibold text-white/80">This month</p>
            <p className="mt-1 text-3xl font-extrabold">Payment sent</p>
            <p className="mt-2 text-sm text-white/80">
              Waiting for your landlord to confirm it, you'll see it update here.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-white/80">Rent due</p>
            <p className="mt-1 text-3xl font-extrabold">UGX {info.monthlyRent.toLocaleString()}</p>
            <button
              onClick={markPaid}
              disabled={submitting}
              className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-deep disabled:opacity-60"
            >
              {submitting ? 'Sending…' : "I've paid"}
            </button>
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
        <p className="text-sm font-semibold text-ink">How this works</p>
        <p className="mt-1 text-sm text-ink/60">
          Pay your landlord the usual way, mobile money, bank, or cash. Then tap "I've paid" so
          they can confirm it and you get a receipt.
        </p>
      </div>
    </div>
  )
}
