'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import Loading from '../../components/Loading'

const Icons = {
  Register: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h2"/></svg>,
  Chart:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  Logout:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
  Plus:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
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

type Category = { id: string; name: string }
type Expense = {
  id: string
  amount: number
  description: string
  date: string
  isRecurring: boolean
  category: { name: string }
  recordedBy: { name: string }
}

const PAYMENT_METHODS = ['Cash', 'Mobile money', 'Card', 'Bank transfer'] as const
type PayMethod = typeof PAYMENT_METHODS[number]

export default function CashierExpensesPage() {
  const [categories, setCategories]     = useState<Category[]>([])
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isSaving, setIsSaving]         = useState(false)
  const [amountFocused, setAmountFocused] = useState(false)
  const [descFocused, setDescFocused]   = useState(false)
  const [currentTime, setCurrentTime]   = useState<Date | null>(null)

  const [form, setForm] = useState({
    amount:      '',
    description: '',
    date:        new Date().toISOString().split('T')[0],
    categoryId:  '',
    payMethod:   'Cash' as PayMethod,
  })

  const fmt = (n: number) => `₵${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const loadData = async () => {
    try {
      const [catRes, expRes] = await Promise.all([
        fetch('/api/admin/expense-categories'),
        fetch('/api/cashier/expenses'),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (expRes.ok) setTodayExpenses(await expRes.json())
    } catch {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setCurrentTime(new Date())
    const id = setInterval(() => setCurrentTime(new Date()), 1000)
    loadData()
    return () => clearInterval(id)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { toast.error('Select a category'); return }
    setIsSaving(true)
    try {
      const res = await fetch('/api/cashier/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:      form.amount,
          description: form.description,
          date:        form.date,
          categoryId:  form.categoryId,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Expense logged')
      setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0], categoryId: '', payMethod: 'Cash' })
      const expRes = await fetch('/api/cashier/expenses')
      if (expRes.ok) setTodayExpenses(await expRes.json())
    } catch (err: any) {
      toast.error(err.message || 'Failed to log expense')
    } finally {
      setIsSaving(false)
    }
  }

  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const byCat = useMemo(() => {
    const map = new Map<string, number>()
    todayExpenses.forEach(e => {
      const name = e.category?.name || 'Other'
      map.set(name, (map.get(name) || 0) + e.amount)
    })
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [todayExpenses])
  const maxCat = Math.max(...byCat.map(c => c.amount), 1)

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
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>Cashier desk &middot; Expenses</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {([
            { label: 'Cashier desk', href: '/cashier',       icon: <Icons.Register /> },
            { label: 'Sales',        href: '/cashier/sales', icon: <Icons.Chart />    },
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
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          {/* Page heading */}
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '34px', fontWeight: 600, color: C.greenDeep, margin: '0 0 4px', lineHeight: 1 }}>
              Log an expense
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              Record cash going out. Everything logged today is visible below.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '18px', marginBottom: '22px', alignItems: 'stretch' }}>
            {/* Today's total */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', padding: '22px 24px', boxShadow: C.shadowSm, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.muted, margin: '0 0 6px' }}>Spent today</p>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '36px', fontWeight: 600, color: C.danger, margin: 0, lineHeight: 1 }}>
                {fmt(todayTotal)}
              </p>
              <p style={{ fontSize: '12.5px', color: C.muted, margin: '6px 0 0' }}>
                {todayExpenses.length} entr{todayExpenses.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>

            {/* Category breakdown */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', padding: '20px 24px', boxShadow: C.shadowSm }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.muted, margin: '0 0 14px' }}>Where it went</p>
              {byCat.length === 0 ? (
                <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>Nothing logged yet today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {byCat.map(cat => (
                    <div key={cat.name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                      <div style={{ height: '8px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: C.copper, borderRadius: '999px', width: `${(cat.amount / maxCat) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: C.ink, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main: form + log side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'start' }}>

            {/* ── Log expense form ── */}
            <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', padding: '22px 24px', boxShadow: C.shadowSm }}>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 20px' }}>
                New entry
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Amount */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Amount (₵)</label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: C.card2, border: `1px solid ${amountFocused ? C.greenDeep : C.line}`,
                    boxShadow: amountFocused ? `0 0 0 3px ${C.greenTint}` : 'none',
                    borderRadius: '14px', padding: '4px 16px', transition: 'all .15s ease',
                  }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '26px', color: C.muted }}>₵</span>
                    <input
                      type="number" step="0.01" min="0.01" required autoFocus
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      onFocus={() => setAmountFocused(true)}
                      onBlur={() => setAmountFocused(false)}
                      placeholder="0.00"
                      className="placeholder:text-[#8C8170]"
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: "'Newsreader', Georgia, serif", fontSize: '30px', fontWeight: 600, color: C.ink, padding: '8px 0', width: '100%' }}
                    />
                  </div>
                </div>

                {/* What was it for */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>What was it for?</label>
                  <input
                    type="text" required
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    placeholder="e.g. Vegetables – Odumase market"
                    className="placeholder:text-[#8C8170]"
                    style={{
                      width: '100%', background: C.card2, padding: '13px 14px', fontSize: '14.5px', color: C.ink,
                      border: `1px solid ${descFocused ? C.greenDeep : C.line}`,
                      boxShadow: descFocused ? `0 0 0 3px ${C.greenTint}` : 'none',
                      borderRadius: '12px', outline: 'none', fontFamily: 'inherit', transition: 'all .15s ease', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {categories.map(cat => {
                      const active = form.categoryId === cat.id
                      return (
                        <button key={cat.id} type="button"
                          onClick={() => setForm(f => ({ ...f, categoryId: cat.id }))}
                          style={{
                            padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            background: active ? C.green : C.card2,
                            color: active ? '#fff' : C.inkSoft,
                            border: `1px solid ${active ? C.green : C.line}`,
                            transition: 'all .15s ease',
                          }}
                        >
                          {cat.name}
                        </button>
                      )
                    })}
                    {categories.length === 0 && (
                      <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No categories — ask admin to add some.</p>
                    )}
                  </div>
                </div>

                {/* Paid with */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Paid with</label>
                  <div style={{ display: 'flex', background: C.paper2, borderRadius: '12px', padding: '4px', gap: '4px', flexWrap: 'wrap' }}>
                    {PAYMENT_METHODS.map(m => {
                      const active = form.payMethod === m
                      return (
                        <button key={m} type="button"
                          onClick={() => setForm(f => ({ ...f, payMethod: m }))}
                          style={{
                            flex: '1 1 auto', padding: '9px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: active ? C.card : 'transparent',
                            color: active ? C.greenDeep : C.muted,
                            border: 'none', boxShadow: active ? C.shadowSm : 'none',
                            transition: 'all .15s ease',
                          }}
                        >
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Date paid</label>
                  <input
                    type="date" required
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: C.ink, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    width: '100%', padding: '15px', borderRadius: '14px',
                    background: isSaving ? C.paper2 : C.green,
                    color: isSaving ? C.muted : '#fff',
                    fontSize: '15px', fontWeight: 700, border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: isSaving ? 'none' : C.shadowMd,
                    transition: 'all .15s ease', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {isSaving ? 'Saving…' : <><Icons.Plus /> Save expense</>}
                </button>
              </form>
            </section>

            {/* ── Today's log ── */}
            <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '20px', overflow: 'hidden', boxShadow: C.shadowSm }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: `1px solid ${C.lineSoft}` }}>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: 0 }}>
                  Today&rsquo;s log
                </h3>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.danger }}>{fmt(todayTotal)}</span>
              </div>

              {todayExpenses.length === 0 ? (
                <div style={{ padding: '50px 24px', textAlign: 'center', color: C.muted, fontSize: '14px', fontStyle: 'italic' }}>
                  Nothing logged today yet.
                </div>
              ) : (
                <div>
                  {todayExpenses.map((exp, idx) => (
                    <div key={exp.id} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
                      padding: '14px 24px',
                      borderBottom: idx < todayExpenses.length - 1 ? `1px solid ${C.lineSoft}` : 'none',
                      transition: 'background .12s ease',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, background: C.greenTint, color: C.greenDeep, padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {exp.category?.name}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.3 }}>{exp.description}</p>
                          <p style={{ fontSize: '12px', color: C.muted, margin: '3px 0 0' }}>
                            {exp.recordedBy?.name} &middot; {fmtTime(exp.date)}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.danger, margin: 0 }}>{fmt(exp.amount)}</p>
                        {exp.isRecurring && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: C.copper, border: `1px solid ${C.copperTint}`, background: C.copperTint, padding: '2px 7px', borderRadius: '999px', display: 'inline-block', marginTop: '4px' }}>
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Footer total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', borderTop: `1px solid ${C.line}`, background: C.card2 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.inkSoft }}>{todayExpenses.length} entr{todayExpenses.length !== 1 ? 'ies' : 'y'}</span>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.danger }}>{fmt(todayTotal)}</span>
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
