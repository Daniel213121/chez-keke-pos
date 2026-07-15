'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { MenuItem } from '../../types'
import Loading from '../components/Loading'

type CartItem = {
  cartItemId: string
  id: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

const Icons = {
  Search:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  Plus:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Minus:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>,
  Trash:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>,
  Close:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Check:    () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
  Receipt:  () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>,
  Table:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18M4 9l1 11M20 9l-1 11M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/></svg>,
  Logout:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
  Ticket:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>,
  Register: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h2"/></svg>,
  Chart:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  Clear:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
}

// Warm palette
const C = {
  paper:       '#F1E8D8',
  paper2:      '#EBE0CC',
  card:        '#FBF6EC',
  card2:       '#FFFDF8',
  ink:         '#2C2820',
  inkSoft:     '#5A5246',
  muted:       '#8C8170',
  line:        '#E2D6C0',
  lineSoft:    '#ECE2D0',
  green:       '#1F5A47',
  greenDeep:   '#164035',
  greenHi:     '#2A6F58',
  greenTint:   '#E4EDE6',
  copper:      '#BE6B34',
  copperDeep:  '#9A4F1E',
  copperTint:  '#F4E5D6',
  danger:      '#B23B2E',
  dangerTint:  '#F6E3DF',
  shadowSm:    '0 1px 3px rgba(54,42,20,.06), 0 1px 2px rgba(54,42,20,.04)',
  shadowMd:    '0 4px 14px rgba(54,42,20,.08), 0 2px 5px rgba(54,42,20,.05)',
  shadowLg:    '0 18px 50px rgba(40,30,12,.18), 0 6px 18px rgba(40,30,12,.10)',
}

export default function POSPage() {
  const [isInitializing, setIsInitializing]   = useState(true)
  const [currentTime, setCurrentTime]         = useState<Date | null>(null)
  const [menuItems, setMenuItems]             = useState<any[]>([])
  const [categories, setCategories]           = useState<any[]>([{ id: 'all', name: 'All Menu' }])
  const [tables, setTables]                   = useState<any[]>([])
  const [cart, setCart]                       = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm]           = useState('')
  const [activeCategory, setActiveCategory]   = useState('all')
  const [searchFocused, setSearchFocused]     = useState(false)
  const [selectedItem, setSelectedItem]       = useState<MenuItem | null>(null)
  const [showPriceModal, setShowPriceModal]   = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal]   = useState(false)
  const [entryPrice, setEntryPrice]           = useState('')
  const [entryQty, setEntryQty]               = useState(1)
  const [customerInfo, setCustomerInfo]       = useState('')
  const [orderNotes, setOrderNotes]           = useState('')
  const [isProcessing, setIsProcessing]       = useState(false)
  const [lastOrderNumber, setLastOrderNumber] = useState('')
  const [entryGuests, setEntryGuests]         = useState(1)
  const [orderType, setOrderType]             = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showMergeModal, setShowMergeModal]   = useState(false)
  const [voidModalItem, setVoidModalItem]     = useState<any>(null)
  const [voidQty, setVoidQty]                 = useState<number>(1)
  const [isActionProcessing, setIsActionProcessing] = useState(false)

  const getActiveSession = (table: any) => {
    if (!table || !table.orders || table.orders.length === 0) return null
    return table.orders[0]
  }

  const { selectedTable, activeSession } = useMemo(() => {
    const selectedTable = tables.find(t => t.id === customerInfo) || null
    return {
      selectedTable,
      activeSession: selectedTable ? getActiveSession(selectedTable) : null,
    }
  }, [tables, customerInfo])

  const handleReopen = async (orderId: string) => {
    setIsActionProcessing(true)
    try {
      const res = await fetch(`/api/pos/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REOPEN' }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Reopen failed') }
      toast.success('Order session reopened successfully!')
      
      const infraRes = await fetch('/api/pos/menu')
      if (infraRes.ok) {
        const data = await infraRes.json()
        setTables(data.tables)
      }
    } catch (err: any) {
      toast.error(err.message || 'Reopen failed')
    } finally {
      setIsActionProcessing(false)
    }
  }

  const handleTransfer = async (orderId: string, targetTableId: string) => {
    setIsActionProcessing(true)
    try {
      const res = await fetch(`/api/pos/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRANSFER', targetTableId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Transfer failed') }
      toast.success('Table session transferred successfully!')
      setShowTransferModal(false)
      setCustomerInfo('')
      
      const infraRes = await fetch('/api/pos/menu')
      if (infraRes.ok) {
        const data = await infraRes.json()
        setTables(data.tables)
      }
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed')
    } finally {
      setIsActionProcessing(false)
    }
  }

  const handleMerge = async (targetOrderId: string, sourceOrderId: string) => {
    setIsActionProcessing(true)
    try {
      const res = await fetch(`/api/pos/orders/${targetOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MERGE', sourceOrderId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Merge failed') }
      toast.success('Table sessions merged successfully!')
      setShowMergeModal(false)
      setCustomerInfo('')
      
      const infraRes = await fetch('/api/pos/menu')
      if (infraRes.ok) {
        const data = await infraRes.json()
        setTables(data.tables)
      }
    } catch (err: any) {
      toast.error(err.message || 'Merge failed')
    } finally {
      setIsActionProcessing(false)
    }
  }

  const openVoidModal = (orderItemId: string) => {
    let foundItem: any = null
    let parentOrderId = ''
    for (const t of tables) {
      const session = getActiveSession(t)
      if (session) {
        const item = session.items.find((i: any) => i.id === orderItemId)
        if (item) {
          parentOrderId = session.id
          foundItem = item
          break
        }
      }
    }
    
    if (!foundItem) {
      toast.error('Item not found')
      return
    }

    setVoidModalItem({ ...foundItem, parentOrderId })
    setVoidQty(foundItem.quantity) // Default to voiding ALL of it
  }

  const confirmVoidItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voidModalItem) return
    setIsActionProcessing(true)
    try {
      const res = await fetch(`/api/pos/orders/${voidModalItem.parentOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VOID_ITEM', orderItemId: voidModalItem.id, quantityToVoid: voidQty }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Void item failed') }
      toast.success(`Voided ${voidQty}x ${voidModalItem.name} successfully!`)
      setVoidModalItem(null)
      
      const infraRes = await fetch('/api/pos/menu')
      if (infraRes.ok) {
        const data = await infraRes.json()
        setTables(data.tables)
      }
    } catch (err: any) {
      toast.error(err.message || 'Void item failed')
    } finally {
      setIsActionProcessing(false)
    }
  }


  useEffect(() => {
    setCurrentTime(new Date())
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    const fetchInfrastructure = async () => {
      try {
        const res = await fetch('/api/pos/menu')
        if (!res.ok) throw new Error('Failed to load menu')
        const data = await res.json()
        setMenuItems(data.items)
        setCategories([{ id: 'all', name: 'All Menu' }, ...data.categories])
        setTables(data.tables)
      } catch {
        toast.error('System synchronization failed')
      } finally {
        setIsInitializing(false)
      }
    }
    fetchInfrastructure()
    return () => clearInterval(clockInterval)
  }, [])

  const filteredMenu = useMemo(() => menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat    = activeCategory === 'all' || item.categoryId === activeCategory || item.category === activeCategory
    return matchSearch && matchCat
  }), [menuItems, searchTerm, activeCategory])

  const cartSubtotal  = cart.reduce((s, i) => s + i.subtotal, 0)
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0)

  // Add or increment cart item
  const addToCart = (item: any, price: number, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && c.price === price)
      if (existing) {
        return prev.map(c => c.cartItemId === existing.cartItemId
          ? { ...c, quantity: c.quantity + qty, subtotal: c.price * (c.quantity + qty) }
          : c
        )
      }
      return [...prev, {
        cartItemId: `${item.id}-${Date.now()}`,
        id: item.id, name: item.name,
        price, quantity: qty, subtotal: price * qty,
      }]
    })
    toast.success(`Added ${item.name}`)
  }

  // Fixed price → direct add; variable price → open price modal
  const handleItemClick = (item: any) => {
    if (item.basePrice != null) {
      addToCart(item, item.basePrice)
    } else {
      setSelectedItem(item)
      setEntryPrice('')
      setEntryQty(1)
      setShowPriceModal(true)
    }
  }

  const confirmPriceEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const price = parseFloat(entryPrice)
    if (isNaN(price) || price <= 0) { toast.error('Invalid price'); return }
    addToCart(selectedItem, price, Math.max(1, entryQty))
    setShowPriceModal(false)
  }

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.cartItemId !== cartItemId) return [item]
      const newQty = item.quantity + change
      if (newQty <= 0) return []
      return [{ ...item, quantity: newQty, subtotal: item.price * newQty }]
    }))
  }

  const removeCartItem = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId))
  }

  const confirmOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      const selectedTable = tables.find((t: any) => t.id === customerInfo)
      const orderPayload = {
        cart: cart.map(item => ({ menuItemId: item.id, quantity: item.quantity, price: item.price })),
        tableId: orderType === 'DINE_IN' ? (customerInfo || null) : null,
        tableNumber: orderType === 'DINE_IN' ? (selectedTable?.name || null) : 'Takeaway',
        notes: orderNotes,
        guestCount: orderType === 'DINE_IN' ? entryGuests : null,
        orderType: orderType,
      }
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Dispatch Failed') }
      const dispatchData = await res.json()
      setLastOrderNumber(dispatchData.orderNumber || dispatchData.order_number || 'Session Updated')
      setShowCheckoutModal(false)
      setShowSuccessModal(true)
      setCart([])
      setCustomerInfo('')
      setOrderNotes('')
      setEntryGuests(1)
      
      const infraRes = await fetch('/api/pos/menu')
      if (infraRes.ok) {
        const data = await infraRes.json()
        setMenuItems(data.items)
        setCategories([{ id: 'all', name: 'All Menu' }, ...data.categories])
        setTables(data.tables)
      }
    } catch (err: any) {
      toast.error(err.message || 'System Dispatch Error')
    } finally {
      setIsProcessing(false)
    }
  }

  const fmt = (n: number | string | null | undefined) => `₵${Number(n ?? 0).toFixed(2)}`

  if (isInitializing) return <Loading />

  const timeStr = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
  const dateStr = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) || ''

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.paper, overflow: 'hidden' }}>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
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
              Keke&rsquo;s Kitchen &middot; Front of house
            </div>
          </div>
        </div>

        {/* Nav + clock + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { label: 'Orders',       href: '/pos/orders', icon: <Icons.Ticket /> },
            { label: 'Cashier desk', href: '/cashier',    icon: <Icons.Register /> },
            { label: "Today's sales",href: '/pos/sales',  icon: <Icons.Chart /> },
          ].map(nav => (
            <Link
              key={nav.href}
              href={nav.href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 13px', borderRadius: '999px', color: C.inkSoft, fontSize: '13.5px', fontWeight: 600, textDecoration: 'none', transition: 'all .15s ease', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.card2; (e.currentTarget as HTMLElement).style.color = C.greenDeep }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.inkSoft }}
            >
              {nav.icon}
              <span>{nav.label}</span>
            </Link>
          ))}

          <div style={{ width: '1px', height: '26px', background: C.line, margin: '0 6px' }} />

          {/* Clock */}
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: C.ink }}>{timeStr}</span>
            <span style={{ display: 'block', fontSize: '11.5px', color: C.muted }}>{dateStr}</span>
          </div>

          <div style={{ width: '1px', height: '26px', background: C.line, margin: '0 6px' }} />

          {/* Sign out */}
          <button
            onClick={async () => { await signOut({ redirect: false }); window.location.replace('/auth/login') }}
            style={{ width: '38px', height: '38px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', transition: 'all .15s ease' }}
            title="Sign out"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.dangerTint; (e.currentTarget as HTMLElement).style.color = C.danger }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.muted }}
          >
            <Icons.Logout />
          </button>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── LEFT: MENU CANVAS ──────────────────────────────────────── */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 8px 0 28px' }}>

          {/* Search */}
          <div style={{ paddingRight: '20px', marginBottom: '4px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: C.card2, border: `1px solid ${searchFocused ? C.greenHi : C.line}`,
              boxShadow: searchFocused ? `0 0 0 4px ${C.greenTint}` : C.shadowSm,
              borderRadius: '999px', padding: '0 18px', transition: 'all .15s ease',
            }}>
              <span style={{ color: C.muted, display: 'inline-flex', flexShrink: 0 }}><Icons.Search /></span>
              <input
                type="text"
                placeholder="Search the menu…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="placeholder:text-[#8C8170]"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '14px 0', fontSize: '15px', color: C.ink, fontFamily: 'inherit' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ color: C.muted, display: 'inline-flex', padding: '4px', borderRadius: '999px', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper2}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <Icons.Clear />
                </button>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '16px 20px 16px 0', flexShrink: 0, scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    whiteSpace: 'nowrap', padding: '8px 17px', borderRadius: '999px',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    background: active ? C.green : 'transparent',
                    color: active ? '#fff' : C.inkSoft,
                    border: `1px solid ${active ? C.green : C.line}`,
                    boxShadow: active ? C.shadowSm : 'none',
                    transition: 'all .15s ease',
                  }}
                >
                  {cat.name || cat.label}
                </button>
              )
            })}
          </div>

          {/* Menu grid */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '20px', paddingBottom: '28px', scrollbarWidth: 'none' }}>
            {filteredMenu.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center', color: C.muted }}>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>
                  {searchTerm ? `Nothing matches "${searchTerm}".` : 'No items in this category.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{ marginTop: '12px', color: C.copperDeep, fontWeight: 600, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {filteredMenu.map(item => {
                  const qtyInCart = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      style={{
                        textAlign: 'left', background: C.card, border: `1px solid ${C.line}`,
                        borderRadius: '20px', overflow: 'hidden', boxShadow: C.shadowSm,
                        display: 'flex', flexDirection: 'column', cursor: 'pointer',
                        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
                        padding: 0,
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.transform = 'translateY(-3px)'
                        el.style.boxShadow = C.shadowMd
                        el.style.borderColor = C.copper
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.transform = 'translateY(0)'
                        el.style.boxShadow = C.shadowSm
                        el.style.borderColor = C.line
                      }}
                    >
                      {/* Photo */}
                      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: C.paper2, flexShrink: 0 }}>
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', opacity: 0.4 }}>
                            🍱
                          </div>
                        )}
                        {/* Cart quantity badge */}
                        {qtyInCart > 0 && (
                          <span style={{
                            position: 'absolute', top: '10px', left: '10px',
                            minWidth: '28px', height: '28px', padding: '0 8px', borderRadius: '999px',
                            background: C.copper, color: '#fff', fontSize: '13px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: C.shadowSm,
                          }}>
                            {qtyInCart}
                          </span>
                        )}
                        {/* Add button */}
                        <span style={{
                          position: 'absolute', right: '10px', bottom: '10px',
                          width: '38px', height: '38px', borderRadius: '999px',
                          background: C.green, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: C.shadowMd,
                        }}>
                          <Icons.Plus />
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{ padding: '13px 15px 15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 500, lineHeight: 1.2, margin: 0, color: C.ink, letterSpacing: '.005em' }}>
                          {item.name}
                        </h3>
                        {item.description && (
                          <p style={{ fontSize: '12.5px', color: C.muted, margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                            {item.description}
                          </p>
                        )}
                        <div style={{ fontSize: '15px', fontWeight: 700, color: C.greenDeep, marginTop: '4px' }}>
                          {item.basePrice != null
                            ? fmt(item.basePrice)
                            : <span style={{ fontSize: '13px', fontWeight: 600, color: C.copperDeep }}>Price at till</span>
                          }
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT: ORDER PANEL ─────────────────────────────────────── */}
        <aside style={{ width: '392px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: C.card, borderLeft: `1px solid ${C.line}` }}>

          {/* Order header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 12px', gap: '12px' }}>
            <div>
              <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '24px', fontWeight: 600, margin: 0, color: C.greenDeep, lineHeight: 1.1 }}>
                Your order
              </h2>
              <p style={{ fontSize: '13px', color: C.muted, marginTop: '3px' }}>
                {cartItemCount === 0 ? 'No items yet' : `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ fontSize: '13px', fontWeight: 600, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'all .15s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.danger; (e.currentTarget as HTMLElement).style.background = C.dangerTint }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Service Type Switcher */}
          <div style={{ padding: '16px 24px 10px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setOrderType('DINE_IN'); setCustomerInfo('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: orderType === 'DINE_IN' ? C.green : C.paper2,
                color: orderType === 'DINE_IN' ? '#fff' : C.inkSoft,
                transition: 'all .15s ease'
              }}
            >
              Dine-In
            </button>
            <button
              onClick={() => { setOrderType('TAKEAWAY'); setCustomerInfo('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: orderType === 'TAKEAWAY' ? C.green : C.paper2,
                color: orderType === 'TAKEAWAY' ? '#fff' : C.inkSoft,
                transition: 'all .15s ease'
              }}
            >
              Takeaway
            </button>
          </div>

          {/* Table picker */}
          {orderType === 'DINE_IN' && (
            <div style={{ padding: '0 24px 14px', borderBottom: `1px solid ${C.lineSoft}`, position: 'relative' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.muted, marginBottom: '10px' }}>
                <Icons.Table /> Table Session
              </span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {tables.map(t => {
                  const active = customerInfo === t.id
                  const session = getActiveSession(t)
                  
                  let btnBg = C.card2
                  let btnColor = C.inkSoft
                  let btnBorder = C.line
                  let btnBorderStyle = 'solid'
                  
                  if (session) {
                    if (session.status.toUpperCase() === 'AWAITING_PAYMENT') {
                      btnBg = active ? C.danger : C.dangerTint
                      btnColor = active ? '#fff' : C.danger
                      btnBorder = C.danger
                      btnBorderStyle = 'dashed'
                    } else {
                      btnBg = active ? C.copper : C.copperTint
                      btnColor = active ? '#fff' : C.copperDeep
                      btnBorder = C.copper
                    }
                  } else if (active) {
                    btnBg = C.green
                    btnColor = '#fff'
                    btnBorder = C.green
                  }

                  return (
                    <button
                      key={t.id}
                      onClick={() => setCustomerInfo(customerInfo === t.id ? '' : t.id)}
                      style={{
                        whiteSpace: 'nowrap', padding: '7px 13px', borderRadius: '999px',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        background: btnBg,
                        color: btnColor,
                        border: `1px ${btnBorderStyle} ${btnBorder}`,
                        transition: 'all .15s ease',
                      }}
                    >
                      {t.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cart items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 24px', scrollbarWidth: 'none' }}>
            
            {/* Timeline for active sessions */}
            {orderType === 'DINE_IN' && selectedTable && activeSession && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `2px dashed ${C.line}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: C.greenDeep }}>
                    Active Order: {activeSession.orderNumber}
                  </span>
                  {activeSession.guestCount && (
                    <span style={{ fontSize: '12px', background: C.paper2, padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>
                      👥 {activeSession.guestCount} guests
                    </span>
                  )}
                </div>

                {/* Session controls */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {activeSession.status.toUpperCase() === 'AWAITING_PAYMENT' ? (
                    <button
                      disabled={isActionProcessing}
                      onClick={() => handleReopen(activeSession.id)}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.green}`, background: C.greenTint, color: C.greenDeep, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔓 Reopen Session
                    </button>
                  ) : (
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: C.muted, fontStyle: 'italic', padding: '7px' }}>
                      Session is Active / Open
                    </span>
                  )}
                  <button
                    disabled={isActionProcessing}
                    onClick={() => setShowTransferModal(true)}
                    style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.line}`, background: C.card2, color: C.inkSoft, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ➡️ Transfer
                  </button>
                  <button
                    disabled={isActionProcessing}
                    onClick={() => setShowMergeModal(true)}
                    style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.line}`, background: C.card2, color: C.inkSoft, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🔗 Merge
                  </button>
                </div>

                {/* Timeline group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeSession.tickets?.map((ticket: any) => {
                    const ticketItems = activeSession.items.filter((item: any) => item.ticketId === ticket.id)
                    if (ticketItems.length === 0) return null
                    return (
                      <div key={ticket.id} style={{ padding: '10px 12px', background: C.paper, borderRadius: '14px', border: `1px solid ${C.lineSoft}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          <span>Ticket #{ticket.ticketNumber} &middot; {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ color: ticket.status === 'SERVED' ? C.green : C.copper }}>{ticket.status}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {ticketItems.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                              <span style={{ textDecoration: item.status === 'VOIDED' ? 'line-through' : 'none', color: item.status === 'VOIDED' ? C.muted : C.ink }}>
                                <b>{item.quantity}×</b> {item.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: item.status === 'VOIDED' ? C.muted : C.inkSoft, fontSize: '12.5px' }}>
                                  {item.status === 'VOIDED' ? 'Voided' : fmt(Number(item.lineTotal))}
                                </span>
                                {item.status !== 'VOIDED' && (
                                  <button
                                    onClick={() => openVoidModal(item.id)}
                                    title="Void item"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, padding: '2px', display: 'flex', alignItems: 'center' }}
                                  >
                                    <Icons.Trash />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '6px', padding: '30px' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '999px', background: C.paper2, color: C.copper, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <Icons.Receipt />
                </div>
                <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '19px', color: C.ink, margin: 0 }}>Start building the order</p>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Tap a dish on the left to add it here.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartItemId} style={{ padding: '13px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: C.ink, lineHeight: 1.25 }}>{item.name}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: C.greenDeep, whiteSpace: 'nowrap' }}>{fmt(item.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    {/* Stepper */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: '999px', padding: '3px' }}>
                      <button
                        onClick={() => item.quantity > 1 ? updateQuantity(item.cartItemId, -1) : removeCartItem(item.cartItemId)}
                        style={{ width: '32px', height: '32px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', transition: 'all .12s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.card2; (e.currentTarget as HTMLElement).style.color = C.greenDeep }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.inkSoft }}
                      >
                        {item.quantity > 1 ? <Icons.Minus /> : <Icons.Trash />}
                      </button>
                      <span style={{ minWidth: '26px', textAlign: 'center', fontWeight: 700, fontSize: '14px', color: C.ink }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        style={{ width: '32px', height: '32px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', transition: 'all .12s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.card2; (e.currentTarget as HTMLElement).style.color = C.greenDeep }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.inkSoft }}
                      >
                        <Icons.Plus />
                      </button>
                    </div>
                    <span style={{ fontSize: '13px', color: C.muted }}>{fmt(item.price)} each</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order footer */}
          <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${C.line}`, background: C.card2, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '14px', color: C.inkSoft, fontWeight: 600 }}>Subtotal</span>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', fontWeight: 600, color: C.ink }}>{fmt(cartSubtotal)}</span>
            </div>
            <p style={{ fontSize: '12px', color: C.muted, margin: '5px 0 14px' }}>Government taxes are added at the till.</p>
            <button
              disabled={cart.length === 0}
              onClick={() => setShowCheckoutModal(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: '14px',
                background: cart.length === 0 ? C.paper2 : C.green,
                color: cart.length === 0 ? C.muted : '#fff',
                fontSize: '16px', fontWeight: 700, border: 'none',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: cart.length === 0 ? 'none' : C.shadowMd,
                transition: 'all .15s ease', fontFamily: 'inherit',
              }}
            >
              <span>Send to kitchen</span>
              <span style={{ fontWeight: 700, opacity: cart.length === 0 ? 0 : 0.9 }}>{fmt(cartSubtotal)}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── MODAL: Price entry (variable-price items) ──────────────── */}
      {showPriceModal && selectedItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowPriceModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '380px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, overflow: 'hidden', border: `1px solid ${C.line}` }}>
            {/* Modal head */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>Set the price</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, margin: 0, color: C.ink }}>{selectedItem.name}</h3>
              </div>
              <button onClick={() => setShowPriceModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <form onSubmit={confirmPriceEntry} style={{ padding: '20px 24px 24px' }}>
              {/* Price input */}
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '10px' }}>How much? (₵)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '4px 18px', marginBottom: '18px' }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', color: C.muted }}>₵</span>
                <input
                  type="number" step="0.5" min="0" autoFocus
                  value={entryPrice} onChange={e => setEntryPrice(e.target.value)}
                  placeholder="0.00"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: C.ink, padding: '10px 0', width: '100%' }}
                  className="placeholder:text-[#8C8170]"
                />
              </div>

              {/* Quantity */}
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '10px' }}>Quantity</label>
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 56px', gap: '10px', height: '56px', marginBottom: '22px' }}>
                <button type="button" onClick={() => setEntryQty(Math.max(1, entryQty - 1))}
                  style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer' }}>−</button>
                <div style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input type="number" min="1" value={entryQty} onChange={e => setEntryQty(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'none', textAlign: 'center', fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.ink }} />
                </div>
                <button type="button" onClick={() => setEntryQty(entryQty + 1)}
                  style={{ background: C.greenTint, border: `1px solid ${C.green}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: C.greenDeep, cursor: 'pointer' }}>+</button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowPriceModal(false)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '15px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.green, border: 'none', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit' }}>
                  Add to order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Checkout / Send to kitchen ─────────────────────── */}
      {showCheckoutModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowCheckoutModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '460px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, overflow: 'hidden', border: `1px solid ${C.line}` }}>
            {/* Head */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>Review &amp; send</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, margin: 0, color: C.ink }}>Send to the kitchen?</h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <form onSubmit={confirmOrder}>
              <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
                {/* Active Session Info Banner */}
                {orderType === 'DINE_IN' && activeSession && (
                  <div style={{ background: C.copperTint, border: `1px solid ${C.copper}`, borderRadius: '14px', padding: '12px 16px', marginBottom: '18px', color: C.copperDeep, fontSize: '13.5px', fontWeight: 600 }}>
                    💡 Appending items to active session <b>{activeSession.orderNumber}</b> for Table <b>{selectedTable?.name}</b>.
                  </div>
                )}

                {/* Order summary */}
                <div style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
                  {cart.map(item => (
                    <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px', padding: '4px 0', color: C.inkSoft }}>
                      <span><b style={{ color: C.ink, fontWeight: 700 }}>{item.quantity}×</b> {item.name}</span>
                      <span style={{ fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '12px', borderTop: `1px solid ${C.line}`, fontWeight: 700, fontSize: '15px', color: C.ink }}>
                    <span>Subtotal to Add</span><span>{fmt(cartSubtotal)}</span>
                  </div>
                </div>

                {/* Service Type Selection details */}
                {orderType === 'DINE_IN' ? (
                  <>
                    {!activeSession && (
                      <>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '10px' }}>
                          Number of Guests (Covers)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={entryGuests}
                          onChange={e => setEntryGuests(parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                            border: `1px solid ${C.line}`, background: C.card2,
                            color: C.ink, marginBottom: '18px', fontSize: '15px'
                          }}
                        />
                      </>
                    )}

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '10px' }}>
                      Table <span style={{ color: C.copper }}>*</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                      {tables.length === 0 && (
                        <p style={{ fontSize: '13px', color: C.muted }}>No active tables.</p>
                      )}
                      {tables.map(t => {
                        const active = customerInfo === t.id
                        return (
                          <button key={t.id} type="button"
                            disabled={!!activeSession}
                            onClick={() => setCustomerInfo(t.id)}
                            style={{ padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: activeSession ? 'not-allowed' : 'pointer', background: active ? C.copper : C.card2, color: active ? '#fff' : C.inkSoft, border: `1px solid ${active ? C.copper : C.line}`, transition: 'all .15s ease', opacity: activeSession && !active ? 0.5 : 1 }}>
                            {t.name}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ background: C.paper, borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', fontSize: '14.5px', color: C.inkSoft }}>
                    🥡 <b>Takeaway Order</b> &middot; No table session required.
                  </div>
                )}

              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '16px 24px 20px', borderTop: `1px solid ${C.lineSoft}` }}>
                <button type="button" onClick={() => setShowCheckoutModal(false)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '15px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Back
                </button>
                <button type="submit" disabled={(orderType === 'DINE_IN' && !customerInfo) || isProcessing}
                  style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: (orderType === 'DINE_IN' && !customerInfo) || isProcessing ? C.paper2 : C.green, border: 'none', fontSize: '15px', fontWeight: 700, color: (orderType === 'DINE_IN' && !customerInfo) || isProcessing ? C.muted : '#fff', cursor: (orderType === 'DINE_IN' && !customerInfo) || isProcessing ? 'not-allowed' : 'pointer', boxShadow: (orderType === 'DINE_IN' && !customerInfo) || isProcessing ? 'none' : C.shadowMd, fontFamily: 'inherit', transition: 'all .15s ease' }}>
                  {isProcessing ? 'Sending…' : activeSession ? 'Add to session' : 'Send to kitchen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Success ────────────────────────────────────────── */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, overflow: 'hidden', border: `1px solid ${C.line}`, textAlign: 'center', padding: '36px 30px 30px' }}>
            {/* Check mark */}
            <div style={{ width: '76px', height: '76px', borderRadius: '999px', background: C.greenTint, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icons.Check />
            </div>

            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, margin: '0 0 6px', color: C.ink, whiteSpace: 'nowrap' }}>Order&rsquo;s in!</h3>
            <p style={{ fontSize: '14px', color: C.muted, margin: '0 auto 22px', maxWidth: '280px' }}>It&rsquo;s on its way to the kitchen.</p>

            <div style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: '14px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: C.muted }}>Order number</span>
              <strong style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.copperDeep, letterSpacing: '.04em' }}>{lastOrderNumber}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                href="/pos/orders"
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                View orders
              </Link>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit' }}
              >
                New order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Transfer Table session ────────────────────────────────── */}
      {showTransferModal && activeSession && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowTransferModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '400px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, overflow: 'hidden', border: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>Session Admin</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, margin: 0, color: C.ink }}>Transfer Table</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: '13.5px', color: C.inkSoft, marginBottom: '14px' }}>
                Transfer session <b>{activeSession.orderNumber}</b> to another unoccupied table:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
                {tables.filter(t => !getActiveSession(t)).map(t => (
                  <button
                    key={t.id}
                    disabled={isActionProcessing}
                    onClick={() => handleTransfer(activeSession.id, t.id)}
                    style={{ padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: isActionProcessing ? 'not-allowed' : 'pointer', background: isActionProcessing ? C.paper2 : C.card2, color: isActionProcessing ? C.muted : C.inkSoft, border: `1px solid ${C.line}` }}
                  >
                    {isActionProcessing ? 'Transferring...' : t.name}
                  </button>
                ))}
                {tables.filter(t => !getActiveSession(t)).length === 0 && (
                  <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No available tables to transfer to.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Merge Table sessions ──────────────────────────────────── */}
      {showMergeModal && activeSession && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowMergeModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '400px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, overflow: 'hidden', border: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>Session Admin</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, margin: 0, color: C.ink }}>Merge Tables</h3>
              </div>
              <button onClick={() => setShowMergeModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: '13.5px', color: C.inkSoft, marginBottom: '14px' }}>
                Merge another active table session into <b>{selectedTable?.name} ({activeSession.orderNumber})</b>:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
                {tables.filter(t => t.id !== customerInfo && getActiveSession(t)).map(t => {
                  const srcSession = getActiveSession(t)
                  return (
                    <button
                      key={t.id}
                      disabled={isActionProcessing}
                      onClick={() => handleMerge(activeSession.id, srcSession.id)}
                      style={{ padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: isActionProcessing ? 'not-allowed' : 'pointer', background: isActionProcessing ? C.paper2 : C.copperTint, color: isActionProcessing ? C.muted : C.copperDeep, border: `1px solid ${isActionProcessing ? C.line : C.copper}` }}
                    >
                      {isActionProcessing ? 'Merging...' : `${t.name} (${srcSession.orderNumber})`}
                    </button>
                  )
                })}
                {tables.filter(t => t.id !== customerInfo && getActiveSession(t)).length === 0 && (
                  <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No other active table sessions available to merge.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Void Item ─────────────────────────────────────────────── */}
      {voidModalItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(40,30,14,.42)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setVoidModalItem(null)}
        >
          <div style={{ width: '100%', maxWidth: '380px', background: C.card, borderRadius: '28px', boxShadow: C.shadowLg, overflow: 'hidden', border: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.danger, margin: '0 0 4px' }}>Return / Void Item</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, margin: 0, color: C.ink }}>{voidModalItem.name}</h3>
              </div>
              <button onClick={() => setVoidModalItem(null)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <form onSubmit={confirmVoidItem} style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: '13px', color: C.inkSoft, marginBottom: '18px' }}>
                How many would you like to return? (Max: {voidModalItem.quantity})
              </p>

              {/* Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 56px', gap: '10px', height: '56px', marginBottom: '22px' }}>
                <button type="button" onClick={() => setVoidQty(Math.max(1, voidQty - 1))}
                  style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer' }}>−</button>
                <div style={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '28px', fontWeight: 600, color: C.ink }}>{voidQty}</span>
                </div>
                <button type="button" onClick={() => setVoidQty(Math.min(voidModalItem.quantity, voidQty + 1))}
                  style={{ background: C.dangerTint, border: `1px solid ${C.danger}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: C.danger, cursor: 'pointer' }}>+</button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setVoidModalItem(null)} disabled={isActionProcessing}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '15px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isActionProcessing}
                  style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: C.danger, border: 'none', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: isActionProcessing ? 'not-allowed' : 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit', opacity: isActionProcessing ? 0.7 : 1 }}>
                  {isActionProcessing ? 'Voiding...' : `Void ${voidQty}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
