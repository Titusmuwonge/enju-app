import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

interface TenancyInfo {
  tenancyId: string
  unitLabel: string
  fenceName: string
  monthlyRent: number
  paidThisMonth: boolean
  pendingThisMonth: boolean
  confirmedPaymentId: string | null
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function TenantHome() {
  const { profile, session } = useAuth()
  const [info, setInfo] = useState<TenancyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
         payments ( id, status, period_month )`
      )
      .eq('tenant_id', session!.user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!tenancy) {
      setInfo(null)
      setLoading(false)
      return
    }

    const thisMonth = startOfMonth().toISOString().slice(0, 7)
    const payments = (tenancy as any).payments ?? []
    const confirmedThisMonth = payments.find(
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
      paidThisMonth: Boolean(confirmedThisMonth),
      pendingThisMonth,
      confirmedPaymentId: confirmedThisMonth?.id ?? null,
    })
    setLoading(false)
  }

  async function submitWithEvidence(file: File) {
    if (!info || !session?.user) return
    setSubmitting(true)
    setError(null)

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${session.user.id}/${info.tenancyId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('payment-evidence')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setSubmitting(false)
      setError('Could not upload that image. Try again.')
      return
    }

    const period = new Date().toISOString().slice(0, 10)
    const { error: insertError } = await supabase.from('payments').insert({
      tenancy_id: info.tenancyId,
      amount: info.monthlyRent,
      method: 'mobile_money',
      period_month: period,
      status: 'pending',
      evidence_path: path,
    })

    setSubmitting(false)
    if (insertError) {
      setError('Payment saved upload failed to link, contact support.')
      return
    }
    await load()
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setPickerOpen(false)
    if (file) void submitWithEvidence(file)
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
            {info.confirmedPaymentId && (
              <a
                href={`/receipt/${info.confirmedPaymentId}`}
                className="mt-4 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-700"
              >
                View receipt
              </a>
            )}
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
              onClick={() => setPickerOpen(true)}
              disabled={submitting}
              className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-deep disabled:opacity-60"
            >
              {submitting ? 'Sending…' : "I've paid"}
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
        <p className="text-sm font-semibold text-ink">How this works</p>
        <p className="mt-1 text-sm text-ink/60">
          Pay your landlord the usual way, mobile money, bank, or cash. Then tap "I've paid" and
          attach the confirmation message or screenshot, so there's proof on file if it's ever
          disputed. Your landlord confirms it and you get a receipt.
        </p>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-base font-bold text-ink">Attach proof of payment</p>
            <p className="mb-4 text-sm text-ink/60">
              A screenshot of the mobile money or bank confirmation. This protects you if the
              payment is ever questioned.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep"
            >
              Choose photo
            </button>
            <button
              onClick={() => setPickerOpen(false)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-ink/50"
            >
              Cancel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChosen}
            />
          </div>
        </div>
      )}
    </div>
  )
}
