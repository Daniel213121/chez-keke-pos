'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import Loading from '../../components/Loading'

const Icons = {
  Search:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  Close:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Clear:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Receipt: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>,
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
  shadowLg:   '0 18px 50px rgba(40,30,12,.18), 0 6px 18px rgba(40,30,12,.10)',
}

export default function AdminOrdersPage() {
  const [searchTerm,    setSearchTerm]    = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [selectedDate,  setSelectedDate]  = useState(new Date().toISOString().split('T')[0])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orders,        setOrders]        = useState<any[]>([])
  const [stats,         setStats]         = useState<any>({ revenue: 0 })
  const [isLoading,     setIsLoading]     = useState(true)
  const [isRefreshing,  setIsRefreshing]  = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => { loadOrders() }, [searchTerm, statusFilter, selectedDate])

  const loadOrders = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm)             params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (selectedDate)           params.append('date', selectedDate)
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data.orders)
      setStats(data.stats)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fmt     = (n: number) => `₵${(n || 0).toFixed(2)}`
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const paidOrders     = useMemo(() => orders.filter(o => o.payment_status === 'paid'),     [orders])
  const unpaidOrders   = useMemo(() => orders.filter(o => o.payment_status === 'unpaid' && o.order_status !== 'cancelled'), [orders])
  const voidOrders     = useMemo(() => orders.filter(o => o.order_status === 'cancelled' || o.payment_status === 'refunded'), [orders])
  const paidRevenue    = useMemo(() => paidOrders.reduce((s, o) => s + o.total, 0), [paidOrders])
  const unpaidRevenue  = useMemo(() => unpaidOrders.reduce((s, o) => s + o.total, 0), [unpaidOrders])

  const statCards = [
    { label: 'Orders today',       value: orders.length,        sub: null,              accent: C.ink        },
    { label: 'Paid',               value: paidOrders.length,    sub: fmt(paidRevenue),  accent: C.green      },
    { label: 'Awaiting payment',   value: unpaidOrders.length,  sub: fmt(unpaidRevenue),accent: C.copper     },
    { label: 'Refunded / void',    value: voidOrders.length,    sub: null,              accent: C.danger     },
  ]

  const statusFilters = [
    { id: 'all',       label: 'All'       },
    { id: 'paid',      label: 'Paid'      },
    { id: 'unpaid',    label: 'Unpaid'    },
    { id: 'refunded',  label: 'Refunded'  },
    { id: 'cancelled', label: 'Void'      },
  ]

  const payTag = (order: any) => {
    const ps = order.payment_status
    if (ps === 'paid')     return { label: 'Paid',     bg: C.greenTint,  fg: C.greenDeep  }
    if (ps === 'refunded') return { label: 'Refunded', bg: C.dangerTint, fg: C.danger     }
    if (order.order_status === 'cancelled') return { label: 'Void', bg: C.paper2, fg: C.muted }
    return { label: 'Unpaid', bg: C.copperTint, fg: C.copperDeep }
  }

  if (isLoading) return <Loading />

  return (
    <div style={{ padding: '28px 40px 60px', background: C.paper, minHeight: '100%' }}>

      {/* ── Heading ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: '0 0 4px', lineHeight: 1 }}>Orders</h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
            {selectedDate === new Date().toISOString().split('T')[0] ? "Today's order history" : `Orders for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 4px' }}>Revenue</p>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.greenDeep, margin: 0 }}>{fmt(stats.revenue || paidRevenue)}</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '22px' }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '20px 22px', boxShadow: C.shadowSm }}>
            <p style={{ fontSize: '13px', color: C.muted, fontWeight: 600, margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: s.accent, margin: 0, lineHeight: 1 }}>{s.value}</p>
            {s.sub && <p style={{ fontSize: '12.5px', color: C.muted, margin: '6px 0 0' }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 1 280px', background: C.card2, border: `1px solid ${searchFocused ? C.greenDeep : C.line}`, boxShadow: searchFocused ? `0 0 0 3px ${C.greenTint}` : C.shadowSm, borderRadius: '999px', padding: '0 14px', transition: 'all .15s ease' }}>
          <span style={{ color: C.muted, flexShrink: 0 }}><Icons.Search /></span>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="Order #, server or table…"
            className="placeholder:text-[#8C8170]"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '11px 0', fontSize: '14px', color: C.ink, fontFamily: 'inherit' }}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: '2px' }}><Icons.Clear /></button>}
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
          {statusFilters.map(f => {
            const active = statusFilter === f.id
            return (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                style={{ padding: '8px 15px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? C.green : C.card, color: active ? '#fff' : C.inkSoft, border: `1px solid ${active ? C.green : C.line}`, transition: 'all .15s ease' }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '999px', padding: '0 16px', height: '42px', flexShrink: 0 }}>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13.5px', color: C.ink, fontFamily: 'inherit', cursor: 'pointer' }}
          />
          {selectedDate && (
            <button onClick={() => setSelectedDate('')} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex' }}><Icons.Clear /></button>
          )}
        </div>
      </div>

      {/* ── Orders table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', overflow: 'hidden', boxShadow: C.shadowSm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {['Order', 'Time', 'Server', 'Table', 'Items', 'Payment', 'Status', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '11px 16px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, textAlign: i === 7 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '56px 16px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: C.copper, opacity: 0.5 }}><Icons.Receipt /></span>
                    No orders match.
                  </div>
                </td>
              </tr>
            ) : orders.map((order, idx) => {
              const tag = payTag(order)
              return (
                <tr key={order.id}
                  style={{ borderBottom: idx < orders.length - 1 ? `1px solid ${C.lineSoft}` : 'none', cursor: 'pointer', transition: 'background .12s ease' }}
                  onClick={() => setSelectedOrder(order)}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '15px', fontWeight: 600, color: C.ink }}>{order.order_number}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: C.muted }}>{fmtTime(order.created_at)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13.5px', color: C.inkSoft, fontWeight: 600 }}>{order.waiter_name || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: C.muted }}>{order.tableNumber || 'Takeaway'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, background: C.paper2, color: C.inkSoft, padding: '3px 9px', borderRadius: '999px' }}>
                      {order.items_count || order.items?.length || 0}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: C.muted, textTransform: 'capitalize' }}>
                    {order.payments?.[0]?.method?.toLowerCase() || '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, background: tag.bg, color: tag.fg, padding: '4px 10px', borderRadius: '999px' }}>{tag.label}</span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '16px', fontWeight: 600, color: C.ink }}>{fmt(order.total)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {/* Table footer */}
        {orders.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.line}`, background: C.card2 }}>
            <span style={{ fontSize: '13px', color: C.muted, fontWeight: 600 }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '16px', fontWeight: 600, color: C.greenDeep }}>{fmt(paidRevenue)}</span>
          </div>
        )}
      </div>

      {/* ── Backdrop ── */}
      <div onClick={() => setSelectedOrder(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', opacity: selectedOrder ? 1 : 0, pointerEvents: selectedOrder ? 'auto' : 'none', transition: 'opacity .25s ease' }} />

      {/* ── Detail slide-over ── */}
      <div
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 71, width: '480px', maxWidth: '92vw', background: C.card, display: 'flex', flexDirection: 'column', boxShadow: C.shadowLg, transform: selectedOrder ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .28s cubic-bezier(.2,1,.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {selectedOrder && (() => {
          const tag = payTag(selectedOrder)
          const method = selectedOrder.payments?.[0]?.method?.toLowerCase()
          const taxTotal = (selectedOrder.vatAmount || 0) + (selectedOrder.nhilAmount || 0) + (selectedOrder.getfundAmount || 0) + (selectedOrder.serviceAmount || 0)
          return (
            <>
              {/* Head */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 28px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 6px' }}>
                    {selectedOrder.tableNumber || 'Takeaway'} · {selectedOrder.waiter_name || 'Staff'}
                  </p>
                  <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.ink, margin: '0 0 10px', lineHeight: 1 }}>
                    {selectedOrder.order_number}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', background: tag.bg, color: tag.fg }}>{tag.label}</span>
                    {method && <span style={{ fontSize: '12px', fontWeight: 600, color: C.muted, textTransform: 'capitalize' }}>{method}</span>}
                    {selectedOrder.payments?.[0]?.reference && (
                      <span style={{ fontSize: '11.5px', color: C.muted }}>Ref: {selectedOrder.payments[0].reference}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper2}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <Icons.Close />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px', scrollbarWidth: 'none' }}>

                {/* Items */}
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.muted, margin: '0 0 12px' }}>Items</p>
                <div style={{ marginBottom: '20px' }}>
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.greenTint, color: C.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                        {item.quantity}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: C.ink, margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: '12.5px', color: C.muted, margin: '2px 0 0' }}>{fmt(item.lineTotal / item.quantity)} each</p>
                      </div>
                      <span style={{ fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Staff */}
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.muted, margin: '0 0 12px' }}>Staff</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    { role: 'Server',  name: selectedOrder.waiter_name,  bg: C.greenTint,  fg: C.greenDeep  },
                    { role: 'Cashier', name: selectedOrder.cashier_name, bg: C.copperTint, fg: C.copperDeep },
                  ].map(s => s.name && (
                    <div key={s.role} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, background: s.bg, color: s.fg, padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{s.role}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.inkSoft }}>{s.name}</span>
                    </div>
                  ))}
                </div>

                {/* Tax breakdown */}
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.muted, margin: '0 0 12px' }}>Breakdown</p>
                <div style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Subtotal',                value: selectedOrder.subtotal  },
                    { label: `VAT (${selectedOrder.vatRateSnapshot || 15}%)`,         value: selectedOrder.vatAmount     },
                    { label: `NHIL (${selectedOrder.nhilRateSnapshot || 2.5}%)`,      value: selectedOrder.nhilAmount    },
                    { label: `GETFund (${selectedOrder.getfundRateSnapshot || 2.5}%)`,value: selectedOrder.getfundAmount },
                    { label: `Service (${selectedOrder.serviceRateSnapshot || 0}%)`,  value: selectedOrder.serviceAmount },
                    selectedOrder.discountAmount > 0 && { label: `Discount (${selectedOrder.discountRateSnapshot || 0}%)`, value: -selectedOrder.discountAmount },
                  ].filter(Boolean).map((row: any) => row.value != null && row.value !== 0 && (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px', color: C.inkSoft, fontWeight: 600 }}>
                      <span>{row.label}</span>
                      <span style={{ color: row.value < 0 ? C.green : C.ink }}>{row.value < 0 ? `-${fmt(Math.abs(row.value))}` : fmt(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: `1px solid ${C.line}`, padding: '16px 28px 20px', background: C.card2, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.muted }}>Total</span>
                  <strong style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.greenDeep }}>{fmt(selectedOrder.total)}</strong>
                </div>
              </div>
            </>
          )
        })()}
      </div>

    </div>
  )
}
