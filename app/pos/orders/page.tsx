'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import Loading from '../../components/Loading'
import { Order } from '../../../types'

const Icons = {
  Search:   () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  Close:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Refresh:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Clock:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
  Check:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
  Receipt:  () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>,
  Plus:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Register: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h2"/></svg>,
  Chart:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  Logout:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
  Clear:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
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
  greenHi:    '#2A6F58',
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

const STATUS_META: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  pending:   { label: 'Pending',         bg: C.paper2,     fg: C.muted,      border: C.line   },
  cooking:   { label: 'In the kitchen',  bg: C.copperTint, fg: C.copperDeep, border: C.copper },
  ready:     { label: 'Ready to serve',  bg: C.greenTint,  fg: C.greenDeep,  border: C.green  },
  served:    { label: 'Served',          bg: C.paper2,     fg: C.muted,      border: C.muted  },
  cancelled: { label: 'Voided',          bg: C.dangerTint, fg: C.danger,     border: C.danger },
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_META[status] || STATUS_META.served
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: s.bg, color: s.fg, fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: 'currentColor', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  if (mins < 60) return `${mins} min ago`
  const h = Math.floor(mins / 60)
  return `${h} hr${h > 1 ? 's' : ''} ago`
}

const isToday = (iso: string) => {
  const d = new Date(iso), t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export default function OrdersPage() {
  const [isLoading, setIsLoading]         = useState(true)
  const [isRefreshing, setIsRefreshing]   = useState(false)
  const [orders, setOrders]               = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [isUpdating, setIsUpdating]       = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [currentTime, setCurrentTime]     = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const clockId = setInterval(() => setCurrentTime(new Date()), 1000)

    loadOrders()
    const pollId = setInterval(() => loadOrders(true), 10000)

    return () => {
      clearInterval(clockId)
      clearInterval(pollId)
    }
  }, [])

  // Listen for server-sent events to update voided orders in real time
  useEffect(() => {
    if (typeof window === 'undefined' || !('EventSource' in window)) return
    const es = new EventSource('/api/pos/orders/stream')

    const onVoided = (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data)
        setOrders(prev => prev.map(o => o.id === payload.id ? { ...o, order_status: 'cancelled' } : o))
        setSelectedOrder(prev => prev?.id === payload.id ? { ...prev, order_status: 'cancelled' } as Order : prev)
      } catch (err) {
        // ignore parse errors
      }
    }

    es.addEventListener('order-voided', onVoided as EventListener)

    return () => {
      es.removeEventListener('order-voided', onVoided as EventListener)
      es.close()
    }
  }, [])

  const loadOrders = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const res = await fetch('/api/pos/orders')
      if (!res.ok) throw new Error('Failed')
      setOrders(await res.json())
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleSetStatus = async (orderId: string, newStatus: Order['order_status']) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/pos/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update Failed')
      toast.success(`Marked as ${STATUS_META[newStatus]?.label || newStatus}`)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o))
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, order_status: newStatus } as Order : prev)
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const todayOrders = useMemo(() => orders.filter(o => isToday(o.created_at)), [orders])

  const counts = useMemo(() => ({
    cooking:   todayOrders.filter(o => o.order_status === 'cooking').length,
    ready:     todayOrders.filter(o => o.order_status === 'ready').length,
    served:    todayOrders.filter(o => o.order_status === 'served').length,
    cancelled: todayOrders.filter(o => o.order_status === 'cancelled').length,
  }), [todayOrders])

  const filteredOrders = useMemo(() => todayOrders
    .filter(o => {
      const matchSearch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.tableNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      return matchSearch && (statusFilter === 'all' || o.order_status === statusFilter)
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [todayOrders, searchTerm, statusFilter])

  const fmt       = (n: number | string | null | undefined) => `₵${Number(n ?? 0).toFixed(2)}`
  const timeStr   = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
  const dateStr   = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) || ''

  const filterDefs = [
    { id: 'all',       label: 'All',            count: todayOrders.length },
    { id: 'cooking',   label: 'In the kitchen', count: counts.cooking },
    { id: 'ready',     label: 'Ready to serve', count: counts.ready },
    { id: 'served',    label: 'Served',         count: counts.served },
    { id: 'cancelled', label: 'Voided',         count: counts.cancelled },
  ]

  if (isLoading && orders.length === 0) return <Loading />

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
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: C.shadowSm }}>
            <Image src="/logo.png" alt="Chez Keke" fill className="object-cover" />
          </div>
          <div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: '24px', fontWeight: 600, color: C.greenDeep, lineHeight: 1, whiteSpace: 'nowrap' }}>
              Chez Keke
            </div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>
              Keke&rsquo;s Kitchen &middot; Orders
            </div>
          </div>
        </div>

        {/* Nav + clock + refresh + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {([
            { label: 'Take an order', href: '/pos',       icon: <Icons.Plus /> },
            { label: 'Cashier desk',  href: '/cashier',   icon: <Icons.Register /> },
            { label: "Today's sales", href: '/pos/sales', icon: <Icons.Chart /> },
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

          <button onClick={() => loadOrders()} disabled={isRefreshing} title="Refresh"
            style={{ width: '38px', height: '38px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', transition: 'all .15s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenTint; (e.currentTarget as HTMLElement).style.color = C.greenDeep }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.muted }}
          >
            <span style={{ display: 'inline-flex', animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }}>
              <Icons.Refresh />
            </span>
          </button>

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

        {/* Page heading */}
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '34px', fontWeight: 600, color: C.greenDeep, margin: '0 0 4px', lineHeight: 1 }}>
            Today&rsquo;s tickets
          </h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
            {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} &middot; {counts.cooking} cooking &middot; {counts.ready} ready
          </p>
        </div>

        {/* Filter chips + search on same row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            {filterDefs.map(f => {
              const active = statusFilter === f.id
              return (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                    padding: '9px 16px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    background: active ? C.green : C.card, color: active ? '#fff' : C.inkSoft,
                    border: `1px solid ${active ? C.green : C.line}`,
                    transition: 'all .15s ease',
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: '12px', fontWeight: 700, minWidth: '20px', height: '20px', padding: '0 6px',
                    borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'rgba(255,255,255,.22)' : C.paper2,
                    color: active ? '#fff' : C.inkSoft,
                  }}>
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            minWidth: '240px', width: '300px', flexShrink: 0,
            background: C.card2,
            border: `1px solid ${searchFocused ? C.greenHi : C.line}`,
            boxShadow: searchFocused ? `0 0 0 4px ${C.greenTint}` : C.shadowSm,
            borderRadius: '999px', padding: '0 16px', transition: 'all .15s ease',
          }}>
            <span style={{ color: C.muted, display: 'inline-flex', flexShrink: 0 }}><Icons.Search /></span>
            <input
              type="text"
              placeholder="Find a ticket or table…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="placeholder:text-[#8C8170]"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '11px 0', fontSize: '14px', color: C.ink, fontFamily: 'inherit' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                style={{ color: C.muted, display: 'inline-flex', padding: '4px', borderRadius: '999px', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper2}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <Icons.Clear />
              </button>
            )}
          </div>
        </div>

        {/* Ticket grid */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '58px', height: '58px', borderRadius: '999px', background: C.paper2, color: C.copper, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Icons.Receipt />
            </div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', color: C.ink, margin: 0 }}>No tickets here</p>
            <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
              {searchTerm ? 'Try a different search.' : "New orders show up here the moment they're sent."}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {filteredOrders.map(order => {
              const accent     = STATUS_META[order.order_status]?.border || C.muted
              const orderTotal = order.items?.reduce((s, i) => s + i.lineTotal, 0) ?? order.total ?? 0
              return (
                <button key={order.id} onClick={() => setSelectedOrder(order)}
                  style={{
                    textAlign: 'left', background: C.card, cursor: 'pointer',
                    borderTop: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`,
                    borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${accent}`,
                    borderRadius: '20px', padding: '18px 20px', boxShadow: C.shadowSm,
                    display: 'flex', flexDirection: 'column', gap: '14px',
                    transition: 'transform .15s ease, box-shadow .15s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = C.shadowMd }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = C.shadowSm }}
                >
                  {/* Top: number + status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '21px', fontWeight: 600, color: C.ink, letterSpacing: '.02em', whiteSpace: 'nowrap' }}>
                      {order.order_number}
                    </span>
                    <StatusPill status={order.order_status} />
                  </div>

                  {/* Table + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: C.greenDeep }}>{order.tableNumber || 'Takeaway'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: C.muted, whiteSpace: 'nowrap' }}>
                      <Icons.Clock />{timeAgo(order.created_at)}
                    </span>
                  </div>

                  {/* Items */}
                  <ul style={{ listStyle: 'none', margin: 0, padding: '12px 0', borderTop: `1px solid ${C.lineSoft}`, borderBottom: `1px solid ${C.lineSoft}`, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {order.items?.slice(0, 3).map(item => (
                      <li key={item.id} style={{ fontSize: '14px', color: C.inkSoft, display: 'flex', alignItems: 'baseline', gap: '9px', lineHeight: 1.3 }}>
                        <span style={{ fontWeight: 700, color: C.copperDeep, minWidth: '16px' }}>{item.quantity}</span>
                        {item.name}
                      </li>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <li style={{ color: C.muted, fontStyle: 'italic', fontSize: '13px' }}>+{order.items.length - 3} more</li>
                    )}
                  </ul>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', color: C.muted }}>
                      {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'} &middot; {order.cashier_name}
                    </span>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.copperDeep }}>
                      {fmt(orderTotal)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── SLIDE-OVER BACKDROP ────────────────────────────────────── */}
      <div
        onClick={() => setSelectedOrder(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)',
          opacity: selectedOrder ? 1 : 0,
          pointerEvents: selectedOrder ? 'auto' : 'none',
          transition: 'opacity .25s ease',
        }}
      />

      {/* ── SLIDE-OVER PANEL ───────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 71,
          width: '440px', maxWidth: '92vw',
          background: C.card, display: 'flex', flexDirection: 'column',
          boxShadow: C.shadowLg,
          transform: selectedOrder ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .28s cubic-bezier(.2,1,.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {selectedOrder && (() => {
          const orderTotal = selectedOrder.items?.reduce((s, i) => s + i.lineTotal, 0) ?? selectedOrder.total ?? 0
          return (
            <>
              {/* Head */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '24px 28px 18px', borderBottom: `1px solid ${C.lineSoft}` }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 8px' }}>
                    {selectedOrder.tableNumber || 'Takeaway'} &middot; {selectedOrder.cashier_name}
                  </p>
                  <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: C.ink, margin: '0 0 12px', lineHeight: 1, letterSpacing: '.02em' }}>
                    {selectedOrder.order_number}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusPill status={selectedOrder.order_status} />
                    <span style={{
                      fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px',
                      background: selectedOrder.payment_status === 'paid' ? C.greenTint : C.copperTint,
                      color: selectedOrder.payment_status === 'paid' ? C.greenDeep : C.copperDeep,
                    }}>
                      {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)}
                  style={{ width: '38px', height: '38px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper2}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <Icons.Close />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', scrollbarWidth: 'none' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.inkSoft, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Order</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
                      <span style={{ width: '34px', height: '34px', flexShrink: 0, borderRadius: '9px', background: C.greenTint, color: C.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px' }}>
                        {item.quantity}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.3 }}>{item.name}</p>
                        <p style={{ fontSize: '12.5px', color: C.muted, margin: '2px 0 0' }}>{fmt(item.unitPrice)} each</p>
                      </div>
                      <span style={{ fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: `1px solid ${C.line}`, padding: '18px 28px 24px', background: C.card2 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: C.muted, fontWeight: 600 }}>Order total</span>
                  <strong style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.ink }}>{fmt(orderTotal)}</strong>
                </div>

                {selectedOrder.order_status === 'pending' && (
                  <button disabled={isUpdating} onClick={() => handleSetStatus(selectedOrder.id, 'cooking')}
                    style={{ width: '100%', padding: '15px 18px', borderRadius: '14px', background: isUpdating ? C.paper2 : C.copper, color: isUpdating ? C.muted : '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: isUpdating ? 'none' : C.shadowMd, transition: 'all .15s ease', fontFamily: 'inherit' }}>
                    {isUpdating ? 'Updating…' : 'Send to kitchen'}
                  </button>
                )}

                {selectedOrder.order_status === 'cooking' && (
                  <button disabled={isUpdating} onClick={() => handleSetStatus(selectedOrder.id, 'ready')}
                    style={{ width: '100%', padding: '15px 18px', borderRadius: '14px', background: isUpdating ? C.paper2 : C.green, color: isUpdating ? C.muted : '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: isUpdating ? 'none' : C.shadowMd, transition: 'all .15s ease', fontFamily: 'inherit' }}>
                    {isUpdating ? 'Updating…' : 'Mark ready to serve'}
                  </button>
                )}

                {selectedOrder.order_status === 'ready' && (
                  <button disabled={isUpdating} onClick={() => handleSetStatus(selectedOrder.id, 'served')}
                    style={{ width: '100%', padding: '15px 18px', borderRadius: '14px', background: isUpdating ? C.paper2 : C.green, color: isUpdating ? C.muted : '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: isUpdating ? 'none' : C.shadowMd, transition: 'all .15s ease', fontFamily: 'inherit' }}>
                    {isUpdating ? 'Updating…' : 'Mark as served'}
                  </button>
                )}

                {selectedOrder.order_status === 'served' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '14px', borderRadius: '14px', background: C.greenTint, color: C.greenDeep, fontWeight: 700, fontSize: '15px' }}>
                    <Icons.Check /> Served to {selectedOrder.tableNumber || 'customer'}
                  </div>
                )}
              </div>
            </>
          )
        })()}
      </div>

    </div>
  )
}
