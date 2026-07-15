'use client'

import { useState, useEffect } from 'react'
import Loading from '../../components/Loading'

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
  greenHi:    '#2A6F58',
  greenTint:  '#E4EDE6',
  copper:     '#BE6B34',
  copperDeep: '#9A4F1E',
  copperTint: '#F4E5D6',
  danger:     '#B23B2E',
  dangerTint: '#F6E3DF',
  shadowSm:   '0 1px 3px rgba(54,42,20,.06), 0 1px 2px rgba(54,42,20,.04)',
  shadowMd:   '0 4px 14px rgba(54,42,20,.08), 0 2px 5px rgba(54,42,20,.05)',
}

const PERIOD_OPTIONS = [
  { id: 'today',  label: 'Today'      },
  { id: 'week',   label: 'This week'  },
  { id: 'month',  label: 'This month' },
  { id: 'all',    label: 'All time'   },
  { id: 'custom', label: 'Custom'     },
]

// ── Shared components ─────────────────────────────────────────────
function Panel({ title, sub, children, accent }: { title: string; sub?: string; children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: accent || C.ink, margin: '0 0 3px' }}>{title}</h3>
        {sub && <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>{sub}</p>}
      </div>
      {children}
    </section>
  )
}

function Bar({ label, value, pct, color, sub }: { label: string; value: string; pct: number; color: string; sub?: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
        <span style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '15px', fontWeight: 600, color: C.ink }}>{value}</span>
          {sub && <span style={{ display: 'block', fontSize: '11.5px', color: C.muted }}>{sub}</span>}
        </span>
      </div>
      <div style={{ height: '8px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: '999px', width: `${Math.min(pct, 100)}%`, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

function Delta({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: up ? C.green : C.danger, background: up ? C.greenTint : C.dangerTint, padding: '2px 8px', borderRadius: '999px', marginLeft: '8px' }}>
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

export default function AdminReportsPage() {
  const [period,      setPeriod]      = useState('month')
  const [reportsData, setReportsData] = useState<any>(null)
  const [isLoading,   setIsLoading]   = useState(true)
  const [settings,    setSettings]    = useState<any>(null)
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')

  useEffect(() => { loadReports(); loadSettings() }, [period, startDate, endDate])
  useEffect(() => {
    if (period === 'custom') {
      const today = new Date()
      const last  = new Date(today); last.setMonth(today.getMonth() - 1)
      setStartDate(last.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    }
  }, [period])

  const loadSettings = async () => {
    try { const r = await fetch('/api/admin/settings'); if (r.ok) setSettings(await r.json()) } catch {}
  }
  const loadReports = async () => {
    setIsLoading(true)
    try {
      const p = new URLSearchParams({ period })
      if (period === 'custom' && startDate) p.append('startDate', startDate)
      if (period === 'custom' && endDate)   p.append('endDate', endDate)
      const res = await fetch(`/api/admin/reports?${p}`)
      if (!res.ok) throw new Error()
      setReportsData(await res.json())
    } catch { console.error('Failed to load reports') }
    finally { setIsLoading(false) }
  }

  const fmt = (n: number) => `₵${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  if (isLoading || !reportsData) return <Loading />

  const {
    kpis, statusFunnel, paymentMethods, staffPerformance, waiterActivity,
    tableIntelligence, topItems, categoryBreakdown, expenseBreakdown,
    hourlyDist, dayBreakdown,
  } = reportsData

  const totalTax    = (kpis.vatYield || 0) + (kpis.nhilYield || 0) + (kpis.getfundYield || 0)
  const margin      = kpis.grossRevenue > 0 ? Math.round((kpis.netProfit / kpis.grossRevenue) * 100) : 0
  const maxHourly   = Math.max(...(hourlyDist || []).map((h: any) => h.revenue), 1)
  const maxDay      = Math.max(...(dayBreakdown || []).map((d: any) => d.revenue), 1)
  const maxPM       = Math.max(...(paymentMethods || []).map((m: any) => m.revenue), 1)
  const maxItem     = Math.max(...(topItems || []).map((t: any) => t.quantity), 1)
  const maxStaff    = Math.max(...(staffPerformance || []).map((s: any) => s.revenue), 1)
  const maxWaiter   = Math.max(...(waiterActivity || []).map((w: any) => w.orders), 1)
  const maxTable    = Math.max(...(tableIntelligence || []).map((t: any) => t.revenue), 1)
  const maxCat      = Math.max(...(categoryBreakdown || []).map((c: any) => c.revenue), 1)
  const maxExp      = Math.max(...(expenseBreakdown || []).map((c: any) => c.total), 1)

  const payColors: Record<string, string> = { cash: C.green, momo: C.copper, card: '#5a8eb5' }

  const statusMeta: Record<string, { color: string }> = {
    Delivered: { color: C.green   },
    Pending:   { color: C.copper  },
    Cancelled: { color: C.danger  },
  }

  const periodLabel = PERIOD_OPTIONS.find(p => p.id === period)?.label.toLowerCase() || period

  return (
    <div style={{ padding: '28px 40px 60px', background: C.paper, minHeight: '100%' }}>

      {/* ── Heading + period selector ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: '0 0 4px', lineHeight: 1 }}>Reports</h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Business analytics and financial intelligence</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px', padding: '10px 14px' }}>
              {[{ label: 'From', val: startDate, set: setStartDate }, { label: 'To', val: endDate, set: setEndDate }].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.muted, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{f.label}</label>
                  <input type="date" value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13.5px', color: C.ink, fontFamily: 'inherit', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', background: C.paper2, borderRadius: '10px', padding: '3px', gap: '3px' }}>
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setPeriod(opt.id)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: period === opt.id ? C.card : 'transparent', color: period === opt.id ? C.greenDeep : C.muted, boxShadow: period === opt.id ? C.shadowSm : 'none', transition: 'all .15s ease', whiteSpace: 'nowrap' }}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 1. KPI cards (8 cards, 4-col → 2 rows) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '18px' }}>
        {[
          { label: 'Gross revenue',   value: fmt(kpis.grossRevenue),  delta: kpis.revenueDelta,  sub: `${kpis.paidOrders} paid orders`, accent: C.greenDeep },
          { label: 'Net profit',      value: fmt(kpis.netProfit),     delta: null,                sub: periodLabel,                      accent: kpis.netProfit >= 0 ? C.green : C.danger },
          { label: 'Total orders',    value: String(kpis.totalOrders),delta: kpis.ordersDelta,   sub: periodLabel,                      accent: C.ink       },
          { label: 'Avg order value', value: fmt(kpis.aov),           delta: null,                sub: 'per paid order',                 accent: C.ink       },
          { label: 'Total expenses',  value: fmt(kpis.totalExpenses), delta: null,                sub: periodLabel,                      accent: C.danger    },
          { label: 'Profit margin',   value: `${margin}%`,            delta: null,                sub: 'of gross revenue',               accent: margin >= 0 ? C.greenDeep : C.danger },
          { label: 'Total discounts', value: fmt(kpis.totalDiscounts),delta: null,                sub: `${kpis.discountPct?.toFixed(1)}% of sales`, accent: C.copperDeep },
          { label: 'Void rate',       value: `${kpis.voidRate?.toFixed(1)}%`, delta: null,         sub: 'cancelled orders',               accent: kpis.voidRate > 10 ? C.danger : C.muted },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '18px 20px', boxShadow: C.shadowSm }}>
            <p style={{ fontSize: '12.5px', color: C.muted, fontWeight: 600, margin: '0 0 8px' }}>{k.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: k.accent, margin: 0, lineHeight: 1 }}>{k.value}</p>
              {k.delta != null && <Delta value={k.delta} />}
            </div>
            <p style={{ fontSize: '12px', color: C.muted, margin: '5px 0 0' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginBottom: '18px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* 5. Hourly sales chart */}
          <Panel title="Sales by hour" sub={kpis.busiestHour ? `Busiest hour: ${kpis.busiestHour}` : 'When orders come in'}>
            {hourlyDist && hourlyDist.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', paddingTop: '12px' }}>
                {hourlyDist.map((h: any) => (
                  <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{
                        width: '100%', height: `${Math.max((h.revenue / maxHourly) * 100, 4)}%`,
                        background: h.revenue === maxHourly ? C.green : C.greenTint,
                        borderRadius: '5px 5px 2px 2px', minHeight: '4px',
                        position: 'relative', cursor: 'default', transition: 'background .15s',
                      }} title={`${h.label}: ${fmt(h.revenue)} (${h.orders} orders)`} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>{h.label.replace(':00', '')}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data for this period.</p>}
          </Panel>

          {/* 7. Day-of-week breakdown */}
          <Panel title="Sales by day" sub="Which days are busiest">
            {dayBreakdown && dayBreakdown.length > 0
              ? dayBreakdown.sort((a: any, b: any) => b.revenue - a.revenue).map((d: any, i: number) => (
                  <Bar key={i} label={d.day} value={fmt(d.revenue)} pct={(d.revenue / maxDay) * 100} color={C.green} sub={`${d.orders} orders`} />
                ))
              : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data for this period.</p>}
          </Panel>

          {/* P&L */}
          <Panel title="Revenue vs Expenses" sub={`Net: ${fmt(kpis.netProfit)}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Gross revenue',   value: fmt(kpis.grossRevenue),  bg: C.greenTint,  fg: C.greenDeep },
                { label: 'Total expenses',  value: fmt(kpis.totalExpenses), bg: C.dangerTint, fg: C.danger    },
                { label: 'Net profit',      value: fmt(kpis.netProfit),     bg: kpis.netProfit >= 0 ? C.greenTint : C.dangerTint, fg: kpis.netProfit >= 0 ? C.greenDeep : C.danger },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: s.fg, margin: '0 0 6px', opacity: 0.75 }}>{s.label}</p>
                  <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: s.fg, margin: 0, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>
            {expenseBreakdown && expenseBreakdown.length > 0 && (
              <>
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, margin: '0 0 14px' }}>Expenses by category</p>
                {expenseBreakdown.map((c: any, i: number) => (
                  <Bar key={i} label={c.label} value={fmt(c.total)} pct={(c.total / maxExp) * 100} color={C.copper} sub={`${c.pct.toFixed(0)}%`} />
                ))}
              </>
            )}
          </Panel>

          {/* Order status */}
          <Panel title="Order status funnel" sub={`${kpis.totalOrders} total orders`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {(statusFunnel || []).map((s: any, i: number) => {
                const meta = statusMeta[s.label] || { color: C.muted }
                return (
                  <div key={i} style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: '12px', padding: '14px 16px' }}>
                    <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: meta.color, margin: '0 0 4px', lineHeight: 1 }}>{s.count}</p>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: meta.color, margin: '0 0 10px' }}>{s.label}</p>
                    <div style={{ height: '6px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: meta.color, borderRadius: '999px', width: `${s.pct}%` }} />
                    </div>
                    <p style={{ fontSize: '11.5px', color: C.muted, margin: '4px 0 0' }}>{s.pct}%</p>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Category revenue */}
          <Panel title="Revenue by category">
            {categoryBreakdown && categoryBreakdown.length > 0
              ? categoryBreakdown.map((c: any, i: number) => (
                  <Bar key={i} label={c.label} value={fmt(c.revenue)} pct={(c.revenue / maxCat) * 100} color={C.green} sub={`${c.pct.toFixed(0)}%`} />
                ))
              : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data.</p>}
          </Panel>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Payment methods */}
          <Panel title="How guests paid">
            {(paymentMethods || []).length === 0
              ? <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No payments this period.</p>
              : (paymentMethods || []).map((m: any, i: number) => {
                  const color = payColors[m.label.toLowerCase()] || C.muted
                  return (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: C.ink, textTransform: 'capitalize' }}>{m.label}</span>
                        <span style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '15px', fontWeight: 600, color: C.ink }}>{fmt(m.revenue)}</span>
                          <span style={{ display: 'block', fontSize: '11.5px', color: C.muted }}>{m.count} txn · {m.pct}%</span>
                        </span>
                      </div>
                      <div style={{ height: '8px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: color, borderRadius: '999px', width: `${(m.revenue / maxPM) * 100}%` }} />
                      </div>
                    </div>
                  )
                })
            }
          </Panel>

          {/* 9. Top dishes with revenue per unit */}
          <Panel title="Top dishes" sub="By revenue">
            {topItems && topItems.length > 0
              ? topItems.map((item: any, i: number) => (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        <b style={{ color: C.copperDeep, marginRight: '5px' }}>{i + 1}.</b>{item.name}
                      </span>
                      <span style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '14px', fontWeight: 600, color: C.ink }}>{fmt(item.revenue)}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: C.muted }}>{item.quantity}× · {fmt(item.revenuePerUnit)} ea</span>
                      </span>
                    </div>
                    <div style={{ height: '7px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.copper, borderRadius: '999px', width: `${(item.quantity / maxItem) * 100}%` }} />
                    </div>
                  </div>
                ))
              : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data.</p>}
          </Panel>

          {/* 3. Discount impact */}
          <Panel title="Discount impact">
            <div style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: C.muted, margin: '0 0 6px' }}>Total discounted</p>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: C.copperDeep, margin: 0, lineHeight: 1 }}>{fmt(kpis.totalDiscounts)}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 600, padding: '8px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
              <span style={{ color: C.muted }}>% of gross sales</span>
              <span style={{ color: C.ink }}>{kpis.discountPct?.toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 600, padding: '8px 0' }}>
              <span style={{ color: C.muted }}>Void rate</span>
              <span style={{ color: kpis.voidRate > 10 ? C.danger : C.ink }}>{kpis.voidRate?.toFixed(1)}%</span>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Bottom 2-col: Waiter + Cashier leaderboards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>

        {/* 6. Waiter leaderboard */}
        <Panel title="Server leaderboard" sub="By orders placed">
          {waiterActivity && waiterActivity.length > 0
            ? waiterActivity.map((w: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < waiterActivity.length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '999px', background: i === 0 ? C.copperTint : C.greenTint, color: i === 0 ? C.copperDeep : C.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                    {w.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 700, color: C.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</p>
                    <div style={{ height: '5px', background: C.paper2, borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ height: '100%', background: C.green, borderRadius: '999px', width: `${(w.orders / maxWaiter) * 100}%` }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '15px', fontWeight: 600, color: C.greenDeep }}>{w.orders} orders</span>
                    <span style={{ display: 'block', fontSize: '11.5px', color: C.muted }}>AOV {fmt(w.aov)}</span>
                  </div>
                </div>
              ))
            : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data.</p>}
        </Panel>

        {/* Cashier + table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Panel title="Cashier performance" sub="By revenue processed">
            {staffPerformance && staffPerformance.length > 0
              ? staffPerformance.map((s: any, i: number) => (
                  <Bar key={i} label={s.name} value={fmt(s.revenue)} pct={(s.revenue / maxStaff) * 100} color={C.copper} sub={`${s.orders} orders`} />
                ))
              : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data.</p>}
          </Panel>
          <Panel title="Revenue by table">
            {tableIntelligence && tableIntelligence.length > 0
              ? tableIntelligence.slice(0, 6).map((t: any, i: number) => (
                  <Bar key={i} label={t.name} value={fmt(t.revenue)} pct={(t.revenue / maxTable) * 100} color={C.green} sub={`${t.orders} orders`} />
                ))
              : <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data.</p>}
          </Panel>
        </div>
      </div>

      {/* ── Tax collected (full width) ── */}
      <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '22px 24px', boxShadow: C.shadowSm }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 3px' }}>Tax collected</h3>
            <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>
              Held on behalf of GRA · Effective rate: {kpis.effectiveTaxRate?.toFixed(1)}% of gross revenue
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: C.muted, background: C.paper2, padding: '6px 12px', borderRadius: '999px' }}>
            {kpis.paidOrders} closed orders
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: `VAT (${settings?.vatRate || 15}%)`,          amount: kpis.vatYield,     color: C.green      },
            { label: `NHIL (${settings?.nhilRate || 2.5}%)`,       amount: kpis.nhilYield,    color: C.copper     },
            { label: `GETFund (${settings?.getfundRate || 2.5}%)`, amount: kpis.getfundYield, color: C.greenHi    },
            { label: `Service (${settings?.serviceCharge || 5}%)`, amount: kpis.serviceYield, color: C.copperDeep },
          ].map(t => (
            <div key={t.label} style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: C.muted, margin: '0 0 8px' }}>{t.label}</p>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: t.color, margin: 0, lineHeight: 1 }}>{fmt(t.amount)}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 16px', borderTop: `2px solid ${C.line}` }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink }}>To remit to GRA</span>
            <span style={{ fontSize: '12.5px', color: C.muted, marginLeft: '10px' }}>VAT + NHIL + GETFund</span>
          </div>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: C.copperDeep }}>{fmt(totalTax)}</span>
        </div>
      </section>

    </div>
  )
}
