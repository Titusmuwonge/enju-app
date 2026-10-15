import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ReceiptData {
  receiptNumber: string
  issuedAt: string
  amount: number
  periodMonth: string
  tenantName: string
  unitLabel: string
  fenceName: string
}

export default function Receipt() {
  const { paymentId } = useParams()
  const [data, setData] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!paymentId) return
    void load(paymentId)
  }, [paymentId])

  async function load(id: string) {
    setLoading(true)
    const { data: payment } = await supabase
      .from('payments')
      .select(
        `amount, period_month,
         receipts ( receipt_number, issued_at ),
         tenancy:tenancies (
           tenant:profiles!tenancies_tenant_id_fkey ( full_name, email ),
           unit:units ( label, fence:fences ( name ) )
         )`
      )
      .eq('id', id)
      .maybeSingle()

    const receipt = (payment as any)?.receipts
    if (!payment || !receipt) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setData({
      receiptNumber: receipt.receipt_number,
      issuedAt: receipt.issued_at,
      amount: (payment as any).amount,
      periodMonth: (payment as any).period_month,
      tenantName: (payment as any).tenancy?.tenant?.full_name ?? (payment as any).tenancy?.tenant?.email ?? 'Tenant',
      unitLabel: (payment as any).tenancy?.unit?.label ?? '—',
      fenceName: (payment as any).tenancy?.unit?.fence?.name ?? '—',
    })
    setLoading(false)
  }

  async function share() {
    const text = `Enju receipt ${data?.receiptNumber} — UGX ${data?.amount.toLocaleString()} for ${data?.fenceName}, ${data?.unitLabel}`
    if (navigator.share) {
      await navigator.share({ title: 'Enju receipt', text, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`)
    }
  }

  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-ink/40">Loading…</div>
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-center text-sm text-ink/50">
        No receipt found for this payment yet.
      </div>
    )
  }

  const monthLabel = new Date(data.periodMonth).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex min-h-full items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-gradient-to-br from-brand to-brand-deep p-6 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-extrabold">Enju</span>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-white/70">Rent receipt</p>
          <p className="mt-1 text-2xl font-extrabold">UGX {data.amount.toLocaleString()}</p>
          <p className="text-sm text-white/80">{monthLabel}</p>
        </div>

        <div className="space-y-3 p-6 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/50">Receipt number</span>
            <span className="font-semibold text-ink">{data.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Tenant</span>
            <span className="font-semibold text-ink">{data.tenantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Building</span>
            <span className="font-semibold text-ink">{data.fenceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Unit</span>
            <span className="font-semibold text-ink">{data.unitLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Issued</span>
            <span className="font-semibold text-ink">
              {new Date(data.issuedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="border-t border-ink/10 p-6 pt-4">
          <button
            onClick={share}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep"
          >
            Share receipt
          </button>
        </div>
      </div>
    </div>
  )
}
