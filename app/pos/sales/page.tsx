'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'
import Loading from '../../components/Loading'
import { Order } from '../../../types'

type Payment = { id: string; amount: number; method: string; created_at: string; cashier_name: string }
type SalesOrder = Order & { payments: Payment[]; waiter_name: string }

const Icons = {
  Plus:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Ticket:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>,
  Register: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h2"/></svg>,
  Logout:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
  Cash:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
  Phone:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M11 18h2"/></svg>,
  Card:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  Lock:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Chart:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
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

export default function POSSalesPage() {
  const { data: session } = useSession()
  const waiterName = (session?.user as any)?.name || 'Staff'

  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders]       = useState<SalesOrder[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const clockId = setInterval(() => setCurrentTime(new Date()), 1000)
    loadSales()
    const pollId = setInterval(() => loadSales(), 10000)
    return () => {
      clearInterval(clockId)
      clearInterval(pollId)
    }
  }, [])

  const loadSales = async () => {
    try {
      const res = await fetch('/api/pos/sales?dateFilter=today')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setOrders(data)
    } catch {
      toast.error('Failed to load sales data')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter to only this waiter's orders
  const myOrders = useMemo(() =>
    orders.filter(o => o.waiter_name === waiterName)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [orders, waiterName])

  const paidOrders  = useMemo(() => myOrders.filter(o => o.payment_status === 'paid'), [myOrders])
  const totalRev    = useMemo(() => paidOrders.reduce((s, o) => s + o.total, 0), [paidOrders])
  // Payment breakdown from payments array
  const allPayments = useMemo(() => paidOrders.flatMap(o => o.payments || []), [paidOrders])
  const cashTotal   = useMemo(() => allPayments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0), [allPayments])
  const momoTotal   = useMemo(() => allPayments.filter(p => p.method === 'momo').reduce((s, p) => s + p.amount, 0), [allPayments])
  const cardTotal   = useMemo(() => allPayments.filter(p => p.method === 'card' || p.method === 'other').reduce((s, p) => s + p.amount, 0), [allPayments])

  // Top dishes
  const topSellers = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>()
    myOrders.forEach(order => {
      order.items?.forEach(item => {
        const prev = map.get(item.name) || { qty: 0, revenue: 0 }
        map.set(item.name, { qty: prev.qty + item.quantity, revenue: prev.revenue + item.lineTotal })
      })
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6)
  }, [myOrders])

  const maxQty = Math.max(...topSellers.map(i => i.qty), 1)

  const fmt  = (n: number) => `₵${n.toFixed(2)}`
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const timeStr = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
  const dateStr = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) || ''

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

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
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>
              Keke&rsquo;s Kitchen &middot; My sales
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {([
            { label: 'Take an order', href: '/pos',        icon: <Icons.Plus /> },
            { label: 'Orders',        href: '/pos/orders', icon: <Icons.Ticket /> },
            { label: 'Cashier desk',  href: '/cashier',    icon: <Icons.Register /> },
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

        {/* Page heading */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '34px', fontWeight: 600, color: C.greenDeep, margin: '0 0 4px', lineHeight: 1 }}>
              My sales today
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>{waiterName} &middot; {today}</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: C.copperDeep, background: C.copperTint, padding: '7px 13px', borderRadius: '999px' }}>
            <Icons.Lock /> Only you can see this
          </span>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '18px', alignItems: 'stretch' }}>

          {/* Hero card */}
          <section style={{
            borderRadius: '24px', padding: '28px 32px',
            background: 'radial-gradient(700px 300px at 80% -10%, rgba(190,107,52,.18), transparent 60%), linear-gradient(150deg, #21604D, #163C30)',
            color: '#F3ECDD', display: 'flex', flexDirection: 'column', gap: '22px',
            boxShadow: C.shadowMd, position: 'relative', overflow: 'hidden',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(243,236,221,.7)', margin: '0 0 8px' }}>My takings today</p>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '52px', fontWeight: 600, lineHeight: 1, margin: '0 0 8px', color: '#F3ECDD' }}>
                {fmt(totalRev)}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(243,236,221,.6)', margin: 0 }}>
                {myOrders.length} order{myOrders.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Payment breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,.14)' }}>
              {[
                { label: 'Cash',         amount: cashTotal },
                { label: 'Mobile money', amount: momoTotal },
                { label: 'Card',         amount: cardTotal },
              ].map(p => (
                <div key={p.label}>
                  <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: '#fff', margin: '0 0 4px', whiteSpace: 'nowrap' }}>{fmt(p.amount)}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(243,236,221,.6)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>{p.label}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── Top dishes ── */}
        {topSellers.length > 0 && (
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', padding: '22px 24px', marginBottom: '18px', boxShadow: C.shadowSm }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 18px' }}>
              My top dishes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
              {topSellers.map((item, i) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '7px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: C.ink }}>
                      <b style={{ color: C.copperDeep, marginRight: '6px' }}>{i + 1}.</b>{item.name}
                    </span>
                    <span style={{ fontSize: '12.5px', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {item.qty} sold &middot; {fmt(item.revenue)}
                    </span>
                  </div>
                  <div style={{ height: '7px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: C.copper, borderRadius: '999px', width: `${(item.qty / maxQty) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Orders list ── */}
        <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', overflow: 'hidden', boxShadow: C.shadowSm }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: `1px solid ${C.lineSoft}` }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: 0 }}>
              Today&rsquo;s orders
            </h3>
          </div>

          {myOrders.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
              No orders yet today.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  {['Order', 'Time', 'Items', 'Payment', 'Total'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 16px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '.05em', color: C.muted, textAlign: i === 4 ? 'right' : 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myOrders.map((order, idx) => (
                  <tr key={order.id} style={{ borderBottom: idx < myOrders.length - 1 ? `1px solid ${C.lineSoft}` : 'none', transition: 'background .12s ease' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '16px', fontWeight: 600, color: C.ink }}>{order.order_number}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13.5px', color: C.inkSoft, fontWeight: 600 }}>
                      {fmtTime(order.created_at)}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, background: C.paper2, color: C.inkSoft, padding: '4px 10px', borderRadius: '999px' }}>
                        {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px',
                        background: order.payment_status === 'paid' ? C.greenTint : C.copperTint,
                        color: order.payment_status === 'paid' ? C.greenDeep : C.copperDeep,
                      }}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.greenDeep }}>{fmt(order.total)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `1px solid ${C.line}`, background: C.card2 }}>
                  <td colSpan={4} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: C.inkSoft }}>
                    {myOrders.length} order{myOrders.length !== 1 ? 's' : ''} today
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.greenDeep }}>{fmt(totalRev)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* Privacy note */}
        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: C.muted, margin: '18px 0 0' }}>
          <Icons.Lock /> You&rsquo;re seeing only your own sales. The cashier sees the full day across every server.
        </p>
      </div>
    </div>
  )
}
