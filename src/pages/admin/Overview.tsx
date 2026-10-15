import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Stats {
  landlords: number
  fences: number
  units: number
  activeTenancies: number
  confirmedThisMonth: number
  volumeThisMonth: number
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    const thisMonth = currentMonthKey()

    const [landlords, fences, units, tenancies, payments] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['landlord', 'manager']),
      supabase.from('fences').select('id', { count: 'exact', head: true }),
      supabase.from('units').select('id', { count: 'exact', head: true }),
      supabase.from('tenancies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payments').select('amount, period_month, status').eq('status', 'confirmed'),
    ])

    const confirmedThisMonth = (payments.data ?? []).filter((p) => p.period_month.slice(0, 7) === thisMonth)

    setStats({
      landlords: landlords.count ?? 0,
      fences: fences.count ?? 0,
      units: units.count ?? 0,
      activeTenancies: tenancies.count ?? 0,
      confirmedThisMonth: confirmedThisMonth.length,
      volumeThisMonth: confirmedThisMonth.reduce((sum, p) => sum + Number(p.amount), 0),
    })
    setLoading(false)
  }

  const cards = stats
    ? [
        { label: 'Landlords & managers', value: stats.landlords },
        { label: 'Buildings', value: stats.fences },
        { label: 'Units', value: stats.units },
        { label: 'Active tenancies', value: stats.activeTenancies },
        { label: 'Rent confirmed this month', value: stats.confirmedThisMonth },
        { label: 'Volume this month', value: `UGX ${stats.volumeThisMonth.toLocaleString()}` },
      ]
    : []

  return (
    <div className="min-h-full p-4 md:p-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl font-extrabold text-ink md:text-2xl">Platform overview</h1>
        <p className="mt-1 text-sm text-ink/60">Everything moving through Enju, across every landlord.</p>
      </header>

      {loading ? (
        <p className="text-ink/50">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm md:p-5">
              <p className="text-xs font-semibold text-ink/50">{c.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
