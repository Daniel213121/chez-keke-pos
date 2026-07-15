'use client'

import React, { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Loading from '../components/Loading'

const Icons = {
  TrendUp:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>,
  TrendDown: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/></svg>,
  Chevron:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Flame:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Check:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
  Receipt:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>,
  Cash:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
  Phone:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M11 18h2"/></svg>,
  Card:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  Star:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
}

const C = {
  paper:      '#F1E8D8',
  paper2:     '#EBE0CC',
  card:       '#FBF6EC',
  card2:      '#FFFDF8',
  ink:        '#2C2820',
  inkSoft:    '#5A5246',
  muted:      '#8C8170',
  line:       '#E2D6C0',
  lineSoft:   '#ECE2D0',
  green:      '#1F5A47',
  greenDeep:  '#164035',
  greenTint:  '#E4EDE6',
  copper:     '#BE6B34',
  copperDeep: '#9A4F1E',
  copperTint: '#F4E5D6',
  danger:     '#B23B2E',
  dangerTint: '#F6E3DF',
  shadowSm:   '0 1px 3px rgba(54,42,20,.06), 0 1px 2px rgba(54,42,20,.04)',
  shadowMd:   '0 4px 14px rgba(54,42,20,.08), 0 2px 5px rgba(54,42,20,.05)',
}

export default function AdminDashboard() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fmt  = (n: number) => `₵${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : fmt(n)

  useEffect(() => {
    let alive = true
    async function load(showError: boolean) {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error()
        const json = await res.json()
        if (alive) setData(json)
      } catch {
        if (showError) toast.error('Failed to load dashboard stats')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load(true)
    const id = setInterval(() => load(false), 45000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const topItems = useMemo(() => {
    if (!data?.trendingOrders) return []
    const map: Record<string, { quantity: number; revenue: number }> = {}
    data.trendingOrders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        if (!map[item.name]) map[item.name] = { quantity: 0, revenue: 0 }
        map[item.name].quantity += item.quantity || 1
        map[item.name].revenue  += item.lineTotal || 0
      })
    })
    const maxQty = Math.max(...Object.values(map).map(i => i.quantity), 1)
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, pct: (v.quantity / maxQty) * 100 }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [data])

  if (loading) return <Loading />

  // ── Data extraction ────────────────────────────────────────────
  const revenue          = data?.revenue          || 0
  const ordersCount      = data?.ordersCount      || 0
  const taxToday         = data?.taxToday         || 0
  const netToday         = data?.netToday         || 0
  const todayExpenses    = data?.todayExpensesTotal || 0
  const expensesMonth    = data?.expensesThisMonth || 0
  const deltas           = data?.deltas            || {}
  const recentOrders     = data?.recentOrders      || []
  const staffList        = data?.staffList         || []
  const weeklyTotals     = data?.weeklyTotals      || []
  const weekTotal        = data?.weekTotal         || 0
  const activityFeed     = data?.activityFeed      || []
  const cookingCount     = data?.cookingCount      || 0
  const readyCount       = data?.readyCount        || 0
  const unpaidCount      = data?.unpaidCount       || 0
  const cashToday        = data?.cashToday         || 0
  const momoToday        = data?.momoToday         || 0
  const cardToday        = data?.cardToday         || 0
  const topWaiters       = data?.topWaiters         || []

  const maxWeek          = Math.max(...weeklyTotals.map((d: any) => d.total), 1)
  const paymentTotal     = cashToday + momoToday + cardToday
  const today            = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  const statCards = [
    {
      label: "Today's takings",
      value: fmt(revenue),
      delta: deltas.revenuePct,
      hint:  'vs yesterday',
      accent: C.greenDeep,
    },
    {
      label: 'Orders today',
      value: ordersCount,
      delta: deltas.ordersCountPct,
      hint:  'vs yesterday',
      accent: C.ink,
    },
    {
      label: 'Net profit today',
      value: fmt(netToday),
      delta: null,
      hint:  `Revenue − ₵${todayExpenses.toFixed(2)} expenses`,
      accent: netToday >= 0 ? C.green : C.danger,
    },
    {
      label: 'Tax collected',
      value: fmt(taxToday),
      delta: deltas.taxYieldPct,
      hint:  'VAT + NHIL + GETFund',
      accent: C.copperDeep,
    },
  ]

  return (
    <div style={{ padding: '28px 40px 60px', background: C.paper, minHeight: '100%' }}>

      {/* ── Page heading ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '13px', color: C.copperDeep, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>{today}</p>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1 }}>Overview</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/pos" style={{ padding: '9px 16px', borderRadius: '10px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '13.5px', fontWeight: 700, color: C.inkSoft, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Open front of house
          </Link>
          <Link href="/pos" style={{ padding: '9px 16px', borderRadius: '10px', background: C.green, color: '#fff', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: C.shadowSm }}>
            New order
          </Link>
        </div>
      </div>

      {/* ── 1. Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '18px' }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
            <p style={{ fontSize: '13px', color: C.muted, fontWeight: 600, margin: '0 0 10px' }}>{s.label}</p>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: s.accent, margin: 0, lineHeight: 1 }}>{s.value}</p>
            {s.delta != null ? (
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, margin: '10px 0 0', color: Number(s.delta) >= 0 ? C.green : C.danger }}>
                {Number(s.delta) >= 0 ? <Icons.TrendUp /> : <Icons.TrendDown />}
                {Number(s.delta) >= 0 ? '+' : ''}{Number(s.delta).toFixed(1)}%
                <span style={{ color: C.muted, fontWeight: 500 }}>{s.hint}</span>
              </p>
            ) : (
              <p style={{ fontSize: '12px', color: C.muted, margin: '10px 0 0' }}>{s.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── 2. Live operational strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1px', marginBottom: '18px', background: C.line, border: `1px solid ${C.line}`, borderRadius: '16px', overflow: 'hidden', boxShadow: C.shadowSm }}>
        {/* In the kitchen */}
        <div style={{ background: cookingCount > 0 ? C.copperTint : C.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: cookingCount > 0 ? C.copper : C.paper2, color: cookingCount > 0 ? '#fff' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Flame />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: cookingCount > 0 ? C.copperDeep : C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>In kitchen</p>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: cookingCount > 0 ? C.copperDeep : C.ink, margin: 0, lineHeight: 1 }}>{cookingCount}</p>
          </div>
        </div>

        {/* Ready to serve */}
        <div style={{ background: readyCount > 0 ? C.greenTint : C.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: readyCount > 0 ? C.green : C.paper2, color: readyCount > 0 ? '#fff' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Check />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: readyCount > 0 ? C.greenDeep : C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>Ready to serve</p>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: readyCount > 0 ? C.greenDeep : C.ink, margin: 0, lineHeight: 1 }}>{readyCount}</p>
          </div>
        </div>

        {/* Waiting to pay */}
        <div style={{ background: C.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: unpaidCount > 0 ? C.paper2 : C.paper2, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Receipt />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>Waiting to pay</p>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1 }}>{unpaidCount}</p>
          </div>
        </div>

        {/* Expenses today */}
        <div style={{ background: C.card, padding: '16px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>Expenses today</p>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.danger, margin: '0 0 2px', lineHeight: 1 }}>{fmt(todayExpenses)}</p>
          <p style={{ fontSize: '11.5px', color: C.muted, margin: 0 }}>{fmt(expensesMonth)} this month</p>
        </div>

        {/* Cash on hand */}
        <div style={{ background: C.card, padding: '16px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>Cash on hand</p>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.greenDeep, margin: '0 0 2px', lineHeight: 1 }}>{fmt(cashToday)}</p>
          <p style={{ fontSize: '11.5px', color: C.muted, margin: 0 }}>From cash sales today</p>
        </div>
      </div>

      {/* ── 3. Main 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginBottom: '18px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* This week's takings */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: '0 0 3px' }}>This week&rsquo;s takings</h3>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Last 7 days</p>
              </div>
              <span style={{ background: C.greenTint, color: C.greenDeep, fontSize: '12.5px', fontWeight: 700, padding: '6px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                Net {fmt(weekTotal)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', paddingTop: '20px' }}>
              {weeklyTotals.map((d: any) => {
                const pct = maxWeek > 0 ? (d.total / maxWeek) * 100 : 0
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{
                        width: '100%', height: `${Math.max(pct, 4)}%`, minHeight: '6px',
                        background: d.isToday ? C.green : C.greenTint,
                        borderRadius: '7px 7px 3px 3px', position: 'relative', display: 'flex', justifyContent: 'center',
                        transition: 'background .15s ease',
                      }}>
                        {d.total > 0 && (
                          <span style={{ position: 'absolute', top: '-19px', fontSize: '11px', fontWeight: 700, color: d.isToday ? C.greenDeep : C.inkSoft, whiteSpace: 'nowrap' }}>
                            {fmtK(d.total)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: d.isToday ? C.greenDeep : C.muted }}>{d.day}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Recent orders */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: 0 }}>Recent orders</h3>
              <Link href="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', fontWeight: 600, color: C.greenDeep, textDecoration: 'none' }}>
                View all <Icons.Chevron />
              </Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  {['Order', 'Server', 'Time', 'Payment', 'Total'].map((h, i) => (
                    <th key={h} style={{ padding: '0 12px 12px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '28px 12px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>No orders yet.</td></tr>
                ) : recentOrders.map((order: any) => {
                  const paid   = order.paymentStatus === 'PAID'
                  const method = order.payments?.[0]?.method?.toLowerCase()
                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${C.lineSoft}`, transition: 'background .12s ease' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 600, color: C.ink, fontSize: '15px' }}>{order.orderNumber}</span>
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: '14px', color: C.inkSoft }}>
                        {(order.cashier?.name || order.waiter?.name || 'Staff').split(' ')[0]}
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: '13px', color: C.muted }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', background: paid ? C.greenTint : C.copperTint, color: paid ? C.greenDeep : C.copperDeep }}>
                          {paid ? (method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Paid') : 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '15px', fontWeight: 600, color: C.ink }}>{fmt(order.total)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* 3. Payment method split */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: '0 0 18px' }}>How guests paid</h3>
            {paymentTotal === 0 ? (
              <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No payments yet today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Cash',         amount: cashToday, icon: <Icons.Cash />, color: C.green   },
                  { label: 'Mobile money', amount: momoToday, icon: <Icons.Phone />, color: C.copper  },
                  { label: 'Card',         amount: cardToday, icon: <Icons.Card />,  color: '#5a8eb5' },
                ].map(p => {
                  const pct = paymentTotal > 0 ? Math.round((p.amount / paymentTotal) * 100) : 0
                  return (
                    <div key={p.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '7px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: C.ink }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: C.paper2, color: C.inkSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</span>
                          {p.label}
                        </span>
                        <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '16px', fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>{fmt(p.amount)}</span>
                      </div>
                      <div style={{ height: '8px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: p.color, borderRadius: '999px', width: `${pct}%`, transition: 'width .3s ease' }} />
                      </div>
                      <p style={{ fontSize: '11.5px', color: C.muted, margin: '5px 0 0' }}>{pct}% of takings</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 7. Top performers — waiters */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: 0 }}>Top servers today</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: C.copperDeep }}>
                <Icons.Star /> By orders
              </span>
            </div>
            {topWaiters.length === 0 ? (
              <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic', margin: 0 }}>No orders placed yet today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {topWaiters.map((w: any, i: number) => {
                  const rankColors = [C.copper, C.green, C.muted, C.muted]
                  return (
                    <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: i < topWaiters.length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: rankColors[i], minWidth: '18px', textAlign: 'center' }}>#{i + 1}</span>
                      <div style={{ width: '34px', height: '34px', borderRadius: '999px', background: i === 0 ? C.copperTint : C.greenTint, color: i === 0 ? C.copperDeep : C.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                        {w.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: C.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</p>
                        <p style={{ fontSize: '12px', color: C.muted, margin: '1px 0 0' }}>{w.orders} order{w.orders !== 1 ? 's' : ''}</p>
                      </div>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '16px', fontWeight: 600, color: C.greenDeep, whiteSpace: 'nowrap' }}>{fmt(w.total)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 5. Tax collected breakdown */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: '0 0 16px' }}>Tax collected today</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: `VAT (${data?.deltas ? '15' : '15'}%)`,      key: 'vat'     },
                { label: `NHIL (2.5%)`,   key: 'nhil'    },
                { label: `GETFund (2.5%)`,key: 'getfund' },
              ].map((t, i, arr) => {
                const amounts: Record<string, number> = {
                  vat:     data?.taxYield ? (data.recentOrders?.reduce((s: number, o: any) => s + (o.vatAmount || 0), 0) || 0) : 0,
                  nhil:    data?.taxYield ? (data.recentOrders?.reduce((s: number, o: any) => s + (o.nhilAmount || 0), 0) || 0) : 0,
                  getfund: data?.taxYield ? (data.recentOrders?.reduce((s: number, o: any) => s + (o.getfundAmount || 0), 0) || 0) : 0,
                }
                return (
                  <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : 'none', fontSize: '14px', fontWeight: 600, color: C.inkSoft }}>
                    <span>{t.label}</span>
                    <span style={{ color: C.ink }}>{fmt(amounts[t.key] || 0)}</span>
                  </div>
                )
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: `2px solid ${C.line}`, fontWeight: 700 }}>
                <span style={{ fontSize: '14px', color: C.ink }}>To remit to GRA</span>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.copperDeep }}>{fmt(taxToday)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── 4. Bottom 3-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>

        {/* Popular dishes */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
          <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>Popular dishes</h3>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 18px' }}>Last 30 days</p>
          {topItems.length === 0 ? (
            <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topItems.map((item, i) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '7px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <b style={{ color: C.copperDeep, marginRight: '5px' }}>{i + 1}.</b>{item.name}
                    </span>
                    <span style={{ fontSize: '12.5px', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.quantity} sold</span>
                  </div>
                  <div style={{ height: '7px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: C.copper, borderRadius: '999px', width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Team */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: 0 }}>Your team</h3>
            <span style={{ fontSize: '13px', color: C.muted }}>
              {staffList.filter((s: any) => s.isActive).length} on shift
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {staffList.slice(0, 7).map((m: any, i: number, arr: any[]) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '999px', flexShrink: 0, background: m.isActive ? C.green : C.line, boxShadow: m.isActive ? `0 0 0 3px ${C.greenTint}` : 'none' }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: C.ink, margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: '11.5px', color: C.muted, margin: '1px 0 0', textTransform: 'capitalize' }}>{m.role?.toLowerCase()}</p>
                  </div>
                </div>
                {m.isActive && <span style={{ fontSize: '11.5px', fontWeight: 700, color: C.green }}>On shift</span>}
              </div>
            ))}
          </div>
          <Link href="/admin/users" style={{ display: 'block', textAlign: 'center', marginTop: '14px', fontSize: '13.5px', fontWeight: 600, color: C.greenDeep, textDecoration: 'none' }}>
            Manage team →
          </Link>
        </section>

        {/* Recent activity */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
          <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, margin: '0 0 18px' }}>Recent activity</h3>
          {activityFeed.length === 0 ? (
            <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activityFeed.map((a: any, i: number, arr: any[]) => {
                const dotColor = a.kind === 'ok' ? C.green : a.kind === 'edit' ? C.copper : C.danger
                const mins = Math.max(0, Math.round((Date.now() - new Date(a.time).getTime()) / 60000))
                const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`
                return (
                  <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '999px', marginTop: '5px', flexShrink: 0, background: dotColor }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: C.inkSoft, margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <b style={{ color: C.ink, fontWeight: 700 }}>{a.who}</b> · {a.what}
                      </p>
                      <p style={{ fontSize: '11.5px', color: C.muted, margin: '2px 0 0' }}>{timeAgo}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

    </div>
  )
}
