'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import Loading from '../../components/Loading'
import ReceiptPreview from '../../components/ReceiptPreview'
import { Order } from '../../../types'
import { useSettingsStore } from '../../../lib/store'

const Icons = {
  Register: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h2"/></svg>,
  Expenses: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>,
  Logout:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
  Search:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  Refresh:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Cash:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
  Phone:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M11 18h2"/></svg>,
  Card:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  ChevDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  Print:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></svg>,
  Close:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Clear:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
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

type SalesOrder = Order & {
  payment_method: string
  payment_reference?: string | null
  waiter_name: string
}

type WaiterRow = {
  name: string
  initials: string
  orders: number
  total: number
  cash: number
  momo: number
  card: number
  topSellers: { name: string; qty: number; revenue: number }[]
}

export default function CashierSalesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [orders, setOrders]             = useState<SalesOrder[]>([])
  const [searchTerm, setSearchTerm]     = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [openWaiter, setOpenWaiter]     = useState<string | null>(null)
  const [currentTime, setCurrentTime]   = useState<Date | null>(null)

  const taxConfig     = useSettingsStore(state => state.taxConfig)
  const fetchTaxConfig = useSettingsStore(state => state.fetchTaxConfig)

  useEffect(() => {
    setCurrentTime(new Date())
    const clockId = setInterval(() => setCurrentTime(new Date()), 1000)
    fetchTaxConfig()
    loadSales()
    const pollId = setInterval(() => loadSales(true), 30000)
    return () => { clearInterval(clockId); clearInterval(pollId) }
  }, [])

  const loadSales = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const res = await fetch('/api/cashier/sales?dateFilter=today')
      if (!res.ok) throw new Error('Failed')
      setOrders(await res.json())
    } catch {
      toast.error('Failed to load sales data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Client-side search — live filtering, no extra API calls
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders
    const term = searchTerm.toLowerCase()
    return orders.filter(o =>
      o.order_number.toLowerCase().includes(term) ||
      (o.tableNumber || '').toLowerCase().includes(term) ||
      (o.waiter_name || '').toLowerCase().includes(term) ||
      (o.payment_method || '').toLowerCase().includes(term)
    )
  }, [orders, searchTerm])

  // ── Aggregations ────────────────────────────────────────────
  const byWaiter = useMemo<WaiterRow[]>(() => {
    const map = new Map<string, WaiterRow & { _sellers: Map<string, { qty: number; revenue: number }> }>()
    orders.forEach(order => {
      const name   = order.waiter_name || 'Staff'
      const method = (order.payment_method || 'other').toLowerCase()
      const prev   = map.get(name) || {
        name, initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        orders: 0, total: 0, cash: 0, momo: 0, card: 0, topSellers: [],
        _sellers: new Map(),
      }
      prev.orders++
      prev.total += order.total
      if (method === 'cash') prev.cash += order.total
      else if (method === 'momo') prev.momo += order.total
      else if (method === 'card') prev.card += order.total
      order.items?.forEach(item => {
        const ps = prev._sellers.get(item.name) || { qty: 0, revenue: 0 }
        prev._sellers.set(item.name, { qty: ps.qty + item.quantity, revenue: ps.revenue + item.lineTotal })
      })
      map.set(name, prev)
    })
    return Array.from(map.values()).map(w => ({
      ...w,
      topSellers: Array.from(w._sellers.entries())
        .map(([n, v]) => ({ name: n, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 4),
    })).sort((a, b) => b.total - a.total)
  }, [orders])

  const totals = useMemo(() => byWaiter.reduce(
    (a, w) => ({ orders: a.orders + w.orders, total: a.total + w.total, cash: a.cash + w.cash, momo: a.momo + w.momo, card: a.card + w.card }),
    { orders: 0, total: 0, cash: 0, momo: 0, card: 0 }
  ), [byWaiter])

  const maxWaiterTotal = Math.max(...byWaiter.map(w => w.total), 1)

  const fmt     = (n: number | any) => `₵${Number(n || 0).toFixed(2)}`
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  const today   = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const timeStr = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
  const dateStr = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) || ''

  if (isLoading) return <Loading />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.paper }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px', gap: '20px', flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
        background: `linear-gradient(${C.card}, rgba(251,246,236,.7))`,
        boxShadow: C.shadowSm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: C.shadowSm }}>
            <Image src="/logo.png" alt="Chez Keke" fill className="object-cover" />
          </div>
          <div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: '24px', fontWeight: 600, color: C.greenDeep, lineHeight: 1, whiteSpace: 'nowrap' }}>
              Chez Keke
            </div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>Cashier desk &middot; All servers</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {([
            { label: 'Cashier desk', href: '/cashier',          icon: <Icons.Register /> },
            { label: 'Expenses',     href: '/cashier/expenses', icon: <Icons.Expenses /> },
          ] as const).map(nav => (
            <Link key={nav.href} href={nav.href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 13px', borderRadius: '999px', color: C.inkSoft, fontSize: '13.5px', fontWeight: 600, textDecoration: 'none', transition: 'all .15s ease', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.card2; (e.currentTarget as HTMLElement).style.color = C.greenDeep }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.inkSoft }}
            >
              {nav.icon}<span>{nav.label}</span>
            </Link>
          ))}

          <div style={{ width: '1px', height: '26px', background: C.line, margin: '0 6px' }} />

          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: C.ink }}>{timeStr}</span>
            <span style={{ display: 'block', fontSize: '11.5px', color: C.muted }}>{dateStr}</span>
          </div>

          <div style={{ width: '1px', height: '26px', background: C.line, margin: '0 6px' }} />

          <button onClick={async () => { await signOut({ redirect: false }); window.location.replace('/auth/login') }} title="Sign out"
            style={{ width: '38px', height: '38px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', transition: 'all .15s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.dangerTint; (e.currentTarget as HTMLElement).style.color = C.danger }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.muted }}
          >
            <Icons.Logout />
          </button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '26px 40px 60px' }}>

        {/* Heading */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '34px', fontWeight: 600, color: C.greenDeep, margin: '0 0 4px', lineHeight: 1 }}>
              Today&rsquo;s sales &middot; all servers
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {today} &middot; {totals.orders} order{totals.orders !== 1 ? 's' : ''} &middot; {byWaiter.length} server{byWaiter.length !== 1 ? 's' : ''} on shift
            </p>
          </div>
          {/* Live chip */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 700, color: C.greenDeep, background: C.greenTint, padding: '7px 13px', borderRadius: '999px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.green, animation: 'pulse 1.8s ease-in-out infinite' }} />
            Live
          </span>
        </div>

        {/* ── Totals strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '1px', marginBottom: '18px', background: C.line, border: `1px solid ${C.line}`, borderRadius: '20px', overflow: 'hidden', boxShadow: C.shadowSm }}>
          {/* Hero cell */}
          <div style={{ background: 'radial-gradient(600px 300px at 80% -10%, rgba(190,107,52,.18), transparent 60%), linear-gradient(150deg, #21604D, #163C30)', padding: '20px 24px' }}>
            <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'rgba(243,236,221,.7)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>Total takings</p>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1 }}>{fmt(totals.total)}</p>
          </div>
          {[
            { label: 'Cash',         amount: totals.cash, icon: <Icons.Cash /> },
            { label: 'Mobile money', amount: totals.momo, icon: <Icons.Phone /> },
            { label: 'Card',         amount: totals.card, icon: <Icons.Card /> },
          ].map(cell => (
            <div key={cell.label} style={{ background: C.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: C.muted, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                {cell.icon} {cell.label}
              </span>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>{fmt(cell.amount)}</span>
            </div>
          ))}
        </div>

        {/* ── Sales by server ── */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', overflow: 'hidden', boxShadow: C.shadowSm, marginBottom: '18px' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: `1px solid ${C.lineSoft}` }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 3px' }}>Sales by server</h3>
            <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>Tap a server to see their top dishes</p>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .7fr 1fr 1.2fr 1fr 1.1fr', gap: '12px', padding: '10px 20px 10px', borderBottom: `1px solid ${C.line}` }}>
            {['Server', 'Orders', 'Cash', 'Mobile money', 'Card', 'Total'].map((h, i) => (
              <span key={h} style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.muted, textAlign: i > 0 ? 'right' : 'left', display: 'inline-flex', alignItems: 'center', justifyContent: i > 0 ? 'flex-end' : 'flex-start', gap: '5px', whiteSpace: 'nowrap' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Server rows */}
          {byWaiter.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>No sales recorded today yet.</div>
          ) : (
            <>
              {byWaiter.map(w => {
                const isOpen = openWaiter === w.name
                return (
                  <div key={w.name}>
                    <button
                      onClick={() => setOpenWaiter(isOpen ? null : w.name)}
                      style={{
                        display: 'grid', gridTemplateColumns: '1.6fr .7fr 1fr 1.2fr 1fr 1.1fr', gap: '12px',
                        padding: '13px 20px', width: '100%', textAlign: 'left', cursor: 'pointer',
                        background: isOpen ? C.greenTint : 'transparent',
                        borderBottom: `1px solid ${C.lineSoft}`, transition: 'background .15s ease',
                      }}
                      onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = C.paper }}
                      onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {/* Name */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '34px', height: '34px', borderRadius: '999px', background: C.copper, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                          {w.initials}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink }}>{w.name}</span>
                        <span style={{ color: C.muted, transition: 'transform .15s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                          <Icons.ChevDown />
                        </span>
                      </span>
                      {/* Orders */}
                      <span style={{ fontSize: '15px', color: C.inkSoft, fontWeight: 600, textAlign: 'right', alignSelf: 'center' }}>{w.orders}</span>
                      {/* Cash */}
                      <span style={{ fontSize: '15px', color: C.inkSoft, fontWeight: 600, textAlign: 'right', alignSelf: 'center' }}>{fmt(w.cash)}</span>
                      {/* Momo */}
                      <span style={{ fontSize: '15px', color: C.inkSoft, fontWeight: 600, textAlign: 'right', alignSelf: 'center' }}>{fmt(w.momo)}</span>
                      {/* Card */}
                      <span style={{ fontSize: '15px', color: C.inkSoft, fontWeight: 600, textAlign: 'right', alignSelf: 'center' }}>{fmt(w.card)}</span>
                      {/* Total + bar */}
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', alignSelf: 'center' }}>
                        <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.ink }}>{fmt(w.total)}</span>
                        <span style={{ width: '100%', maxWidth: '110px', height: '5px', background: C.paper2, borderRadius: '999px', overflow: 'hidden', display: 'block' }}>
                          <span style={{ display: 'block', height: '100%', background: C.copper, borderRadius: '999px', width: `${(w.total / maxWaiterTotal) * 100}%` }} />
                        </span>
                      </span>
                    </button>

                    {/* Expanded top dishes */}
                    {isOpen && w.topSellers.length > 0 && (
                      <div style={{ background: C.paper, padding: '14px 20px 16px 80px', borderBottom: `1px solid ${C.lineSoft}` }}>
                        <p style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.copperDeep, margin: '0 0 12px' }}>
                          {w.name}&rsquo;s top dishes today
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px' }}>
                          {w.topSellers.map(item => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontSize: '14px' }}>
                              <span style={{ fontWeight: 700, color: C.copperDeep, minWidth: '26px' }}>{item.qty}&times;</span>
                              <span style={{ flex: 1, color: C.inkSoft }}>{item.name}</span>
                              <span style={{ fontWeight: 700, color: C.ink }}>{fmt(item.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Footer totals row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .7fr 1fr 1.2fr 1fr 1.1fr', gap: '12px', padding: '14px 20px', borderTop: `2px solid ${C.line}` }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink }}>All servers</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink, textAlign: 'right' }}>{totals.orders}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink, textAlign: 'right' }}>{fmt(totals.cash)}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink, textAlign: 'right' }}>{fmt(totals.momo)}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.ink, textAlign: 'right' }}>{fmt(totals.card)}</span>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.greenDeep, textAlign: 'right' }}>{fmt(totals.total)}</span>
              </div>
            </>
          )}
        </section>

        {/* ── Payment breakdown ── */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', padding: '20px 24px', boxShadow: C.shadowSm, marginBottom: '18px' }}>
          <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 18px' }}>
            How the day was paid
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { id: 'cash', label: 'Cash',         amount: totals.cash, icon: <Icons.Cash />, color: C.green   },
              { id: 'momo', label: 'Mobile money', amount: totals.momo, icon: <Icons.Phone />, color: C.copper  },
              { id: 'card', label: 'Card',         amount: totals.card, icon: <Icons.Card />, color: '#5a8eb5' },
            ].map(p => {
              const pct = totals.total > 0 ? Math.round((p.amount / totals.total) * 100) : 0
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', fontWeight: 600, color: C.ink }}>
                      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: C.paper2, color: C.inkSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</span>
                      {p.label}
                    </span>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>{fmt(p.amount)}</span>
                  </div>
                  <div style={{ height: '9px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: p.color, borderRadius: '999px', width: `${pct}%`, transition: 'width .3s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.muted, marginTop: '6px' }}>
                    <span>{pct}% of takings</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Orders list ── */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', overflow: 'hidden', boxShadow: C.shadowSm }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: `1px solid ${C.lineSoft}`, gap: '16px', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: 0 }}>
              All transactions
            </h3>
            {/* Search + refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '240px',
                background: C.card2, border: `1px solid ${searchFocused ? C.greenDeep : C.line}`,
                boxShadow: searchFocused ? `0 0 0 3px ${C.greenTint}` : 'none',
                borderRadius: '999px', padding: '0 12px', transition: 'all .15s ease',
              }}>
                <span style={{ color: C.muted, flexShrink: 0 }}><Icons.Search /></span>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                  onKeyDown={e => e.key === 'Escape' && setSearchTerm('')}
                  placeholder="Order # or table…"
                  className="placeholder:text-[#8C8170]"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '9px 0', fontSize: '13.5px', color: C.ink, fontFamily: 'inherit' }}
                />
                {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); loadSales() }} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: '2px' }}><Icons.Clear /></button>
                )}
              </div>
              <button onClick={() => loadSales()} disabled={isRefreshing}
                style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: C.card2, border: `1px solid ${C.line}`, cursor: 'pointer', transition: 'all .15s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenTint; (e.currentTarget as HTMLElement).style.color = C.greenDeep }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card2; (e.currentTarget as HTMLElement).style.color = C.muted }}
              >
                <span style={{ display: 'inline-flex', animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }}><Icons.Refresh /></span>
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ padding: '50px 24px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
              {searchTerm ? `No transactions match "${searchTerm}".` : 'No transactions recorded today yet.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  {['Order', 'Time', 'Table', 'Waiter', 'Method', 'Total'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr key={order.id}
                    style={{ borderBottom: idx < filteredOrders.length - 1 ? `1px solid ${C.lineSoft}` : 'none', cursor: 'pointer', transition: 'background .12s ease' }}
                    onClick={() => setSelectedOrder(order)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '16px', fontWeight: 600, color: C.ink }}>{order.order_number}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: C.inkSoft, fontWeight: 600 }}>
                      {fmtTime(order.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: C.inkSoft }}>{order.tableNumber || 'Takeaway'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: C.inkSoft }}>{order.waiter_name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, background: C.copperTint, color: C.copperDeep, padding: '3px 9px', borderRadius: '999px', textTransform: 'capitalize' }}>
                        {order.payment_method || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.greenDeep }}>{fmt(order.total)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `1px solid ${C.line}`, background: C.card2 }}>
                  <td colSpan={5} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: C.inkSoft }}>
                    {filteredOrders.length} transaction{filteredOrders.length !== 1 ? 's' : ''}{searchTerm ? ` matching "${searchTerm}"` : ' today'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.greenDeep }}>{fmt(totals.total)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>
      </div>

      {/* ── ORDER DETAIL MODAL ─────────────────────────────────────── */}
      {selectedOrder && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{ width: '100%', maxWidth: '560px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal head */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>
                  {selectedOrder.tableNumber || 'Takeaway'} &middot; {selectedOrder.waiter_name}
                </p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '24px', fontWeight: 600, color: C.ink, margin: 0 }}>
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)}
                style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper2}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <Icons.Close />
              </button>
            </div>

            {/* Receipt */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', background: C.paper2, scrollbarWidth: 'none' }}>
              <ReceiptPreview order={selectedOrder} taxConfig={taxConfig} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: `1px solid ${C.line}` }}>
              <button onClick={() => setSelectedOrder(null)}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
              <button onClick={() => router.push(`/cashier/receipt/${selectedOrder.id}`)}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                <Icons.Print /> Print receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
