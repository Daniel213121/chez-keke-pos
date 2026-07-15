'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import Loading from '../components/Loading'
import ReceiptPreview from '../components/ReceiptPreview'
import ConfirmModal from '../components/ConfirmModal'
import { Order } from '../../types'
import { useSettingsStore } from '../../lib/store'
import { calculateFiscalTotals } from '../../utils/taxCalculator'

const Icons = {
  Register: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h2"/></svg>,
  Chart:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  Expenses: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>,
  Logout:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
  Receipt:  () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>,
  Check:    () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
  Trash:    () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>,
  Print:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></svg>,
  Bell:     () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>,
  Cash:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
  Card:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  Phone:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M11 18h2"/></svg>,
  Clock:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
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

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pending',        bg: C.paper2,    fg: C.muted      },
  cooking: { label: 'In the kitchen', bg: C.copperTint,fg: C.copperDeep },
  ready:   { label: 'Ready',          bg: C.greenTint, fg: C.greenDeep  },
  served:  { label: 'Served',         bg: C.paper2,    fg: C.muted      },
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: s.bg, color: s.fg, fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: 'currentColor', flexShrink: 0 }} />
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

export default function CashierPage() {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [orders, setOrders]                 = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder]   = useState<Order | null>(null)
  const taxConfig                           = useSettingsStore(state => state.taxConfig)
  const isSettingsLoaded                    = useSettingsStore(state => state.isSettingsLoaded)
  const fetchTaxConfig                      = useSettingsStore(state => state.fetchTaxConfig)
  const [currentTime, setCurrentTime]       = useState<Date | null>(null)

  const currentOrderWithTax = useMemo(() => {
    if (!selectedOrder) return null
    const rawSubtotal = selectedOrder.items?.reduce((sum, item) => sum + item.lineTotal, 0) || 0
    const taxData = calculateFiscalTotals(rawSubtotal, taxConfig)
    return {
      ...selectedOrder,
      subtotal: taxData.subtotal,
      discountAmount: taxData.discountAmount,
      discountRateSnapshot: taxConfig.discountRate,
      vatAmount: taxData.breakdown?.vat || 0,
      nhilAmount: taxData.breakdown?.nhil || 0,
      getfundAmount: taxData.breakdown?.getfund || 0,
      serviceAmount: taxData.serviceAmount,
      serviceRateSnapshot: taxConfig.serviceCharge,
      total: taxData.total,
    }
  }, [selectedOrder, taxConfig])

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'momo'>('cash')
  const [cashReceived, setCashReceived]   = useState('')
  const [momoRef, setMomoRef]             = useState('')
  const [isProcessing, setIsProcessing]   = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showCancelModal, setShowCancelModal]   = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    const clockId = setInterval(() => setCurrentTime(new Date()), 1000)
    loadOrders()
    fetchTaxConfig()
    const pollId = setInterval(loadOrders, 8000)
    return () => { clearInterval(clockId); clearInterval(pollId) }
  }, [])

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/cashier/orders')
      if (!res.ok) throw new Error('Sync Failed')
      setOrders(await res.json())
    } catch {
      toast.error('No network')
    } finally {
      setIsInitializing(false)
    }
  }

  const pendingOrders = useMemo(() =>
    orders.filter(o => o.payment_status === 'unpaid' && o.order_status !== 'cancelled'),
  [orders])

  const fmt = (n: number) => `₵${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const handleProcessPayment = async () => {
    if (!currentOrderWithTax) return
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < currentOrderWithTax.total) { toast.error('Insufficient funds'); return }
    } else if (!momoRef.trim()) {
      toast.error('Transaction reference required'); return
    }
    setIsProcessing(true)
    try {
      const res = await fetch('/api/cashier/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrderWithTax.id,
          method: paymentMethod,
          amount: currentOrderWithTax.total,
          reference: paymentMethod === 'cash' ? `CASH_RECV_${cashReceived}` : momoRef,
          subtotal: currentOrderWithTax.subtotal,
          taxBreakdown: { vat: currentOrderWithTax.vatAmount, nhil: currentOrderWithTax.nhilAmount, getfund: currentOrderWithTax.getfundAmount },
          serviceAmount: (currentOrderWithTax as any).serviceAmount || 0,
          serviceRate: taxConfig.serviceCharge,
        })
      })
      if (!res.ok) throw new Error('Transaction Failed')
      toast.success('Payment processed successfully!')
      setShowSuccessModal(true)
      loadOrders()
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order)
    setCashReceived('')
    setMomoRef('')
    setPaymentMethod('cash')
  }

  const handlePrint = () => {
    if (!selectedOrder) return
    window.open(`/cashier/receipt/${selectedOrder.id}`, '_blank')
  }

  const handleConfirmedCancel = async () => {
    if (!selectedOrder) return
    setShowCancelModal(false)
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/pos/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      if (!res.ok) throw new Error('Failed to cancel')
      toast.success('Order cancelled and voided.')
      setSelectedOrder(null)
      loadOrders()
    } catch {
      toast.error('Failed to cancel order.')
    } finally {
      setIsProcessing(false)
    }
  }

  const changeDue = useMemo(() => {
    if (!currentOrderWithTax || paymentMethod !== 'cash') return 0
    const val = parseFloat(cashReceived) - currentOrderWithTax.total
    return val > 0 ? val : 0
  }, [currentOrderWithTax, cashReceived, paymentMethod])

  const canComplete = useMemo(() => {
    if (!currentOrderWithTax) return false
    if (paymentMethod === 'cash') return parseFloat(cashReceived) >= currentOrderWithTax.total
    return momoRef.trim().length > 0
  }, [currentOrderWithTax, paymentMethod, cashReceived, momoRef])

  const quickCash = useMemo(() => {
    if (!currentOrderWithTax) return []
    const t = currentOrderWithTax.total
    return [...new Set([t, Math.ceil(t / 10) * 10, Math.ceil(t / 50) * 50].map(n => Math.round(n)))]
  }, [currentOrderWithTax])

  const timeStr = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
  const dateStr = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) || ''

  if (isInitializing) return <Loading />

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.paper, overflow: 'hidden' }}>

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
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>Cashier desk &middot; Keke&rsquo;s Kitchen</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {([
            { label: 'Front of house', href: '/pos',              icon: <Icons.Register /> },
            { label: 'Sales',          href: '/cashier/sales',    icon: <Icons.Chart />    },
            { label: 'Expenses',       href: '/cashier/expenses', icon: <Icons.Expenses /> },
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
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── LEFT: TICKET FEED ──────────────────────────────────── */}
        <aside style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: C.card, borderRight: `1px solid ${C.line}` }}>

          {/* Head */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 14px' }}>
            <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.greenDeep, margin: 0 }}>
              Waiting to pay
            </h2>
            <span style={{ background: C.green, color: '#fff', fontSize: '13px', fontWeight: 700, minWidth: '26px', height: '26px', padding: '0 9px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {pendingOrders.length}
            </span>
          </div>

          {/* Ticket list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'none' }}>
            {pendingOrders.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px', padding: '40px 20px', color: C.muted }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '999px', background: C.paper2, color: C.copper, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Icons.Bell />
                </div>
                <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', color: C.ink, margin: 0 }}>All settled up</p>
                <p style={{ fontSize: '13px', margin: 0 }}>New tickets appear here as the kitchen sends them.</p>
              </div>
            ) : pendingOrders.map(order => {
              const isSelected = selectedOrder?.id === order.id
              const itemCount  = order.items?.reduce((s, i) => s + i.quantity, 0) || 0
              return (
                <button key={order.id} onClick={() => handleOrderSelect(order)}
                  style={{
                    textAlign: 'left', background: isSelected ? C.greenTint : C.card2,
                    border: `1px solid ${isSelected ? C.green : C.line}`,
                    boxShadow: isSelected ? `0 0 0 1px ${C.green}` : C.shadowSm,
                    borderRadius: '16px', padding: '14px 16px', cursor: 'pointer',
                    transition: 'all .15s ease',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = C.copper }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = C.line }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '19px', fontWeight: 600, color: C.ink, letterSpacing: '.02em', whiteSpace: 'nowrap' }}>
                      {order.order_number}
                    </span>
                    <StatusPill status={order.order_status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: C.greenDeep }}>{order.tableNumber || 'Takeaway'}</span>
                    <span style={{ color: C.line }}>·</span>
                    <span style={{ fontSize: '13px', color: C.muted }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: C.muted }}>
                      <Icons.Clock />{timeAgo(order.created_at)} &middot; {order.cashier_name}
                    </span>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.copperDeep }}>
                      {fmt(order.total)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── CENTER: TRANSACTION ────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedOrder ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: C.muted }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '999px', background: C.paper2, color: C.copper, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <Icons.Receipt />
              </div>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', color: C.ink, margin: 0 }}>Pick a ticket to take payment</p>
              <p style={{ fontSize: '14px', margin: 0 }}>Choose an order from the left and the bill will open here.</p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Txn head */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 32px 14px', borderBottom: `1px solid ${C.lineSoft}` }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>
                    {selectedOrder.tableNumber || 'Takeaway'} &middot; {selectedOrder.order_number}
                  </p>
                  <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.greenDeep, margin: 0 }}>
                    Take payment
                  </h2>
                </div>
                <button onClick={() => setShowCancelModal(true)}
                  style={{ fontSize: '13.5px', fontWeight: 600, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', transition: 'all .15s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.danger; (e.currentTarget as HTMLElement).style.background = C.dangerTint }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  Void order
                </button>
              </div>

              {/* Txn body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px', scrollbarWidth: 'none' }}>

                {/* Bill */}
                <div style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '8px 20px 16px', marginBottom: '20px', boxShadow: C.shadowSm }}>
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '10px', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
                      <span style={{ fontWeight: 700, color: C.copperDeep }}>{item.quantity}×</span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: C.ink }}>{item.name}</span>
                      <span style={{ fontWeight: 700, color: C.ink }}>{fmt(item.lineTotal)}</span>
                    </div>
                  ))}

                  {/* Tax / totals */}
                  <div style={{ paddingTop: '12px' }}>
                    {!isSettingsLoaded ? (
                      <div style={{ height: '80px', borderRadius: '10px', background: C.paper2, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ) : <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '14px', color: C.inkSoft, fontWeight: 600 }}>
                      <span>Subtotal</span><span>{fmt(currentOrderWithTax?.subtotal || 0)}</span>
                    </div>
                    {taxConfig.isTaxEnabled && currentOrderWithTax && (
                      <>
                        {currentOrderWithTax.vatAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', color: C.muted }}>
                            <span>VAT ({taxConfig.vatRate}%)</span><span>{fmt(currentOrderWithTax.vatAmount)}</span>
                          </div>
                        )}
                        {currentOrderWithTax.nhilAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', color: C.muted }}>
                            <span>NHIL ({taxConfig.nhilRate}%)</span><span>{fmt(currentOrderWithTax.nhilAmount)}</span>
                          </div>
                        )}
                        {currentOrderWithTax.getfundAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', color: C.muted }}>
                            <span>GETFund ({taxConfig.getfundRate}%)</span><span>{fmt(currentOrderWithTax.getfundAmount)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {(currentOrderWithTax?.discountAmount ?? 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', color: C.greenDeep, fontWeight: 600 }}>
                        <span>Discount ({taxConfig.discountRate}%)</span>
                        <span>-{fmt(currentOrderWithTax?.discountAmount ?? 0)}</span>
                      </div>
                    )}
                    {((currentOrderWithTax as any)?.serviceAmount ?? 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', color: C.copper, fontWeight: 600 }}>
                        <span>Service charge ({taxConfig.serviceCharge}%)</span>
                        <span>{fmt((currentOrderWithTax as any).serviceAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px', paddingTop: '12px', borderTop: `2px solid ${C.line}` }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: C.inkSoft }}>Total due</span>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.greenDeep }}>{fmt(currentOrderWithTax?.total || 0)}</span>
                    </div>
                    </>}
                  </div>
                </div>

                {/* Payment method */}
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.inkSoft, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.05em' }}>How are they paying?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {([
                    { id: 'cash', label: 'Cash',         icon: <Icons.Cash /> },
                    { id: 'card', label: 'Card',         icon: <Icons.Card /> },
                    { id: 'momo', label: 'Mobile money', icon: <Icons.Phone /> },
                  ] as const).map(m => {
                    const active = paymentMethod === m.id
                    return (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 12px',
                          borderRadius: '14px', cursor: 'pointer', transition: 'all .15s ease',
                          background: active ? C.greenTint : C.card2,
                          border: `1px solid ${active ? C.green : C.line}`,
                          color: active ? C.greenDeep : C.inkSoft,
                          boxShadow: active ? `0 0 0 1px ${C.green}` : 'none',
                        }}
                      >
                        {m.icon}
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{m.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Cash input */}
                {paymentMethod === 'cash' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cash received</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '4px 18px' }}>
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', color: C.muted }}>₵</span>
                      <input type="number" step="0.5" autoFocus value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="placeholder:text-[#8C8170]"
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: C.ink, padding: '10px 0', width: '100%' }}
                      />
                    </div>

                    {/* Quick cash */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {quickCash.map(q => (
                        <button key={q} onClick={() => setCashReceived(String(q))}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${C.line}`, background: C.card, fontWeight: 700, fontSize: '14px', color: C.inkSoft, cursor: 'pointer', transition: 'all .15s ease' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.greenHi; (e.currentTarget as HTMLElement).style.color = C.greenDeep; (e.currentTarget as HTMLElement).style.background = C.greenTint }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.line; (e.currentTarget as HTMLElement).style.color = C.inkSoft; (e.currentTarget as HTMLElement).style.background = C.card }}
                        >
                          {fmt(q)}
                        </button>
                      ))}
                    </div>

                    {/* Change */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.copperTint, border: `1px solid ${C.copper}`, borderRadius: '14px', padding: '14px 18px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: C.copperDeep }}>Change due</span>
                      <strong style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: C.copperDeep }}>{fmt(changeDue)}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {paymentMethod === 'momo' ? 'Mobile money reference' : 'Card / approval reference'}
                    </label>
                    <input type="text" autoFocus value={momoRef}
                      onChange={e => setMomoRef(e.target.value)}
                      placeholder={paymentMethod === 'momo' ? 'e.g. MoMo transaction ID' : 'e.g. POS approval code'}
                      className="placeholder:text-[#8C8170]"
                      style={{ width: '100%', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '14px 16px', fontSize: '15px', color: C.ink, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* Txn footer */}
              <div style={{ padding: '16px 32px 20px', borderTop: `1px solid ${C.line}`, background: C.card2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexShrink: 0 }}>
                <div>
                  <p style={{ fontSize: '13px', color: C.muted, fontWeight: 600, margin: '0 0 2px' }}>Total due</p>
                  <strong style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: C.ink }}>{fmt(currentOrderWithTax?.total || 0)}</strong>
                </div>
                <button disabled={!canComplete || isProcessing} onClick={handleProcessPayment}
                  style={{
                    padding: '15px 36px', borderRadius: '14px',
                    background: canComplete && !isProcessing ? C.green : C.paper2,
                    color: canComplete && !isProcessing ? '#fff' : C.muted,
                    fontSize: '16px', fontWeight: 700, border: 'none',
                    cursor: canComplete && !isProcessing ? 'pointer' : 'not-allowed',
                    boxShadow: canComplete && !isProcessing ? C.shadowMd : 'none',
                    transition: 'all .15s ease', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  {isProcessing ? 'Processing…' : 'Complete sale'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT: RECEIPT PREVIEW ─────────────────────────────── */}
        {selectedOrder && (
          <aside style={{ width: '340px', flexShrink: 0, background: C.paper2, borderLeft: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 12px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted }}>Receipt preview</span>
              <button onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: C.greenDeep, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Icons.Print /> Print
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 28px', display: 'flex', justifyContent: 'center', scrollbarWidth: 'none' }}>
              {currentOrderWithTax && <ReceiptPreview order={currentOrderWithTax} taxConfig={taxConfig} />}
            </div>
          </aside>
        )}
      </div>

      {/* ── SUCCESS MODAL ──────────────────────────────────────────── */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, textAlign: 'center', padding: '36px 30px 30px' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '999px', background: C.greenTint, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icons.Check />
            </div>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.ink, margin: '0 0 6px' }}>Payment received</h3>
            <p style={{ fontSize: '14px', color: C.muted, margin: '0 0 20px' }}>
              Order {selectedOrder?.order_number} is settled and recorded.
            </p>

            {changeDue > 0 && (
              <div style={{ background: C.copperTint, border: `1px solid ${C.copper}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: C.copperDeep, fontWeight: 600 }}>Change to give back</span>
                <strong style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: C.copperDeep }}>{fmt(changeDue)}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => selectedOrder && router.push(`/cashier/receipt/${selectedOrder.id}`)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                <Icons.Print /> Print receipt
              </button>
              <button onClick={() => { setShowSuccessModal(false); setSelectedOrder(null) }}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
                Back to desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VOID CONFIRM MODAL ─────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Void This Order?"
        message={`Are you sure you want to cancel order ${selectedOrder?.order_number}? This action is permanent and will be logged for auditing.`}
        confirmText="Yes, void it"
        cancelText="Keep it"
        onConfirm={handleConfirmedCancel}
        onCancel={() => setShowCancelModal(false)}
        isDanger={true}
      />

    </div>
  )
}
