'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import Loading from '../../components/Loading'

const Icons = {
  Plus:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Trash:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Close:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Search:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  Tag:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Clear:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
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

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today'      },
  { id: 'week',  label: 'This week'  },
  { id: 'month', label: 'This month' },
  { id: 'all',   label: 'All time'   },
]

const PAY_METHODS = ['Cash', 'Mobile money', 'Card', 'Bank transfer'] as const

type Category = { id: string; name: string; isDefault: boolean }
type Expense = {
  id: string
  amount: number
  description: string
  date: string
  isRecurring: boolean
  category: { id: string; name: string }
  recordedBy: { name: string; role: string }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>{label}</label>
      {children}
    </div>
  )
}
const inp = (focused = false): React.CSSProperties => ({
  width: '100%', background: C.card2, border: `1px solid ${focused ? C.greenDeep : C.line}`,
  boxShadow: focused ? `0 0 0 3px ${C.greenTint}` : 'none',
  borderRadius: '12px', padding: '12px 14px', fontSize: '14.5px', color: C.ink,
  outline: 'none', fontFamily: 'inherit', transition: 'all .15s ease', boxSizing: 'border-box' as const,
})

export default function AdminExpensesPage() {
  const [expenses,        setExpenses]        = useState<Expense[]>([])
  const [categories,      setCategories]      = useState<Category[]>([])
  const [period,          setPeriod]          = useState('month')
  const [categoryFilter,  setCategoryFilter]  = useState('')
  const [recurringFilter, setRecurringFilter] = useState('')
  const [search,          setSearch]          = useState('')
  const [searchFocused,   setSearchFocused]   = useState(false)
  const [totals,          setTotals]          = useState({ total: 0, recurringTotal: 0, oneOffTotal: 0 })
  const [isLoading,       setIsLoading]       = useState(true)

  // Log expense modal
  const [showLogModal, setShowLogModal] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], isRecurring: false, categoryId: '', payMethod: 'Cash' })
  const [amountFocused, setAmountFocused] = useState(false)
  const [descFocused,   setDescFocused]   = useState(false)
  const [isSaving,      setIsSaving]      = useState(false)

  // Categories modal
  const [showCatModal,  setShowCatModal]  = useState(false)
  const [newCatName,    setNewCatName]    = useState('')
  const [isSavingCat,   setIsSavingCat]   = useState(false)

  const fmt = (n: number) => `₵${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const loadExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams({ period })
      if (categoryFilter)  params.append('categoryId', categoryFilter)
      if (recurringFilter) params.append('recurring', recurringFilter)
      const res = await fetch(`/api/admin/expenses?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExpenses(data.expenses)
      setTotals({ total: data.total, recurringTotal: data.recurringTotal, oneOffTotal: data.oneOffTotal })
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setIsLoading(false)
    }
  }, [period, categoryFilter, recurringFilter])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/expense-categories')
      if (!res.ok) throw new Error()
      setCategories(await res.json())
    } catch {
      toast.error('Failed to load categories')
    }
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { loadExpenses() },   [loadExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { toast.error('Select a category'); return }
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Expense logged')
      setShowLogModal(false)
      setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0], isRecurring: false, categoryId: '', payMethod: 'Cash' })
      loadExpenses()
    } catch (err: any) {
      toast.error(err.message || 'Failed to log expense')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Delete expense "${description}"?`)) return
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Expense deleted')
      loadExpenses()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsSavingCat(true)
    try {
      const res = await fetch('/api/admin/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Category added')
      setNewCatName('')
      loadCategories()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add category')
    } finally {
      setIsSavingCat(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/expense-categories/${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Category deleted')
      loadCategories()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category')
    }
  }

  // Category breakdown
  const byCat = useMemo(() => {
    return categories.map(c => ({
      name: c.name,
      amount: expenses.filter(e => e.category.id === c.id).reduce((s, e) => s + e.amount, 0),
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)
  }, [expenses, categories])
  const maxCat = Math.max(...byCat.map(c => c.amount), 1)

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return expenses
    const q = search.toLowerCase()
    return expenses.filter(e =>
      e.description.toLowerCase().includes(q) ||
      e.category.name.toLowerCase().includes(q) ||
      e.recordedBy.name.toLowerCase().includes(q)
    )
  }, [expenses, search])

  if (isLoading) return <Loading />

  return (
    <div style={{ padding: '28px 40px 60px', background: C.paper, minHeight: '100%' }}>

      {/* ── Heading ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: '0 0 4px', lineHeight: 1 }}>Expenses</h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Track and manage operational spending</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCatModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '13.5px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icons.Tag /> Categories
          </button>
          <button onClick={() => setShowLogModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', background: C.green, color: '#fff', fontSize: '13.5px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit' }}
          >
            <Icons.Plus /> Log expense
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '18px', marginBottom: '18px', alignItems: 'stretch' }}>
        {/* Spent */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '20px 22px', boxShadow: C.shadowSm }}>
          <p style={{ fontSize: '13px', color: C.muted, fontWeight: 600, margin: '0 0 8px' }}>Spent {PERIOD_OPTIONS.find(p => p.id === period)?.label.toLowerCase()}</p>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '32px', fontWeight: 600, color: C.danger, margin: '0 0 4px', lineHeight: 1 }}>{fmt(totals.total)}</p>
          <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        {/* Recurring vs one-off */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '20px 22px', boxShadow: C.shadowSm }}>
          <p style={{ fontSize: '13px', color: C.muted, fontWeight: 600, margin: '0 0 14px' }}>Breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontWeight: 600, color: C.inkSoft }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: C.copper, flexShrink: 0 }} />Recurring
              </span>
              <span style={{ fontWeight: 700, color: C.ink }}>{fmt(totals.recurringTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontWeight: 600, color: C.inkSoft }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: C.muted, flexShrink: 0 }} />One-off
              </span>
              <span style={{ fontWeight: 700, color: C.ink }}>{fmt(totals.oneOffTotal)}</span>
            </div>
          </div>
        </div>
        {/* Where it went */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '20px 22px', boxShadow: C.shadowSm }}>
          <p style={{ fontSize: '13px', color: C.muted, fontWeight: 600, margin: '0 0 14px' }}>Where it went</p>
          {byCat.length === 0 ? (
            <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>Nothing logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {byCat.slice(0, 4).map(c => (
                <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <div style={{ height: '8px', background: C.paper2, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: C.copper, borderRadius: '999px', width: `${(c.amount / maxCat) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.ink, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 1 260px', background: C.card2, border: `1px solid ${searchFocused ? C.greenDeep : C.line}`, boxShadow: searchFocused ? `0 0 0 3px ${C.greenTint}` : C.shadowSm, borderRadius: '999px', padding: '0 14px', transition: 'all .15s ease' }}>
          <span style={{ color: C.muted, flexShrink: 0 }}><Icons.Search /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="Search expenses…"
            className="placeholder:text-[#8C8170]"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '10px 0', fontSize: '14px', color: C.ink, fontFamily: 'inherit' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: '2px' }}><Icons.Clear /></button>}
        </div>

        {/* Category chips */}
        <div style={{
          display: 'flex', gap: '8px', flex: '1 1 0%', minWidth: 0,
          overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%)',
          padding: '0 2px',
        }}>
          {[{ id: '', name: 'All' }, ...categories.map(c => ({ id: c.id, name: c.name }))].map(c => {
            const active = categoryFilter === c.id
            return (
              <button key={c.id} onClick={() => setCategoryFilter(c.id)}
                style={{ flexShrink: 0, padding: '7px 15px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? C.green : C.card, color: active ? '#fff' : C.inkSoft, border: `1px solid ${active ? C.green : C.line}`, transition: 'all .15s ease' }}
              >
                {c.name}
              </button>
            )
          })}
        </div>

        {/* Period segmented */}
        <div style={{ display: 'flex', background: C.paper2, borderRadius: '10px', padding: '3px', gap: '3px', flexShrink: 0 }}>
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setPeriod(opt.id)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, background: period === opt.id ? C.card : 'transparent', color: period === opt.id ? C.greenDeep : C.muted, boxShadow: period === opt.id ? C.shadowSm : 'none', transition: 'all .15s ease', whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Recurring filter */}
        <div style={{ display: 'flex', background: C.paper2, borderRadius: '10px', padding: '3px', gap: '3px', flexShrink: 0 }}>
          {[{ id: '', label: 'All' }, { id: 'true', label: 'Recurring' }, { id: 'false', label: 'One-off' }].map(opt => (
            <button key={opt.id} onClick={() => setRecurringFilter(opt.id)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, background: recurringFilter === opt.id ? C.card : 'transparent', color: recurringFilter === opt.id ? C.greenDeep : C.muted, boxShadow: recurringFilter === opt.id ? C.shadowSm : 'none', transition: 'all .15s ease', whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Expenses table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', overflow: 'hidden', boxShadow: C.shadowSm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {['Date', 'Category', 'Description', 'Paid by', 'Type', 'Amount', ''].map((h, i) => (
                <th key={h + i} style={{ padding: '11px 16px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, textAlign: i === 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: C.muted, fontSize: '14px', fontStyle: 'italic' }}>
                {search ? `No expenses match "${search}".` : 'No expenses recorded for this period.'}
              </td></tr>
            ) : filtered.map((exp, idx) => (
              <tr key={exp.id}
                style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.lineSoft}` : 'none', transition: 'background .12s ease' }}
                className="group"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontSize: '13px', color: C.muted, whiteSpace: 'nowrap' }}>
                  {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.greenDeep, background: C.greenTint, padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                    {exp.category.name}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14.5px', fontWeight: 600, color: C.ink, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exp.description}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: C.inkSoft }}>{exp.recordedBy.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  {exp.isRecurring
                    ? <span style={{ fontSize: '11.5px', fontWeight: 700, background: C.copperTint, color: C.copperDeep, padding: '3px 9px', borderRadius: '999px' }}>Recurring</span>
                    : <span style={{ fontSize: '11.5px', fontWeight: 600, color: C.muted }}>One-off</span>
                  }
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.danger }}>{fmt(exp.amount)}</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(exp.id, exp.description)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: `1px solid transparent`, cursor: 'pointer', transition: 'all .12s ease', opacity: 0 }}
                    className="group-hover:opacity-100"
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.danger; el.style.background = C.dangerTint; el.style.borderColor = C.danger; el.style.opacity = '1' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.background = 'none'; el.style.borderColor = 'transparent'; el.style.opacity = '0' }}
                  >
                    <Icons.Trash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.line}`, background: C.card2 }}>
          <span style={{ fontSize: '13px', color: C.muted, fontWeight: 600 }}>{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</span>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '17px', fontWeight: 600, color: C.danger }}>{fmt(totals.total)}</span>
        </div>
      </div>

      {/* ═══ LOG EXPENSE MODAL ═══ */}
      {showLogModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowLogModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '480px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.copperDeep, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>New entry</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: 0 }}>Log an expense</h3>
              </div>
              <button onClick={() => setShowLogModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Category + Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Category">
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required
                    style={{ ...inp(), appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Amount (₵)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.card2, border: `1px solid ${amountFocused ? C.greenDeep : C.line}`, boxShadow: amountFocused ? `0 0 0 3px ${C.greenTint}` : 'none', borderRadius: '12px', padding: '0 10px', transition: 'all .15s ease' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', color: C.muted, flexShrink: 0 }}>₵</span>
                    <input type="number" step="0.01" min="0.01" required autoFocus
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      onFocus={() => setAmountFocused(true)} onBlur={() => setAmountFocused(false)}
                      placeholder="0.00" className="placeholder:text-[#8C8170]"
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, padding: '9px 0', width: '100%' }}
                    />
                  </div>
                </Field>
              </div>

              {/* Description */}
              <Field label="What was it for?">
                <input type="text" required
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={() => setDescFocused(true)} onBlur={() => setDescFocused(false)}
                  placeholder="e.g. Vegetables – Odumase market"
                  className="placeholder:text-[#8C8170]" style={inp(descFocused)}
                />
              </Field>

              {/* Paid with */}
              <Field label="Paid with">
                <div style={{ display: 'flex', background: C.paper2, borderRadius: '10px', padding: '3px', gap: '3px', flexWrap: 'wrap' }}>
                  {PAY_METHODS.map(m => {
                    const active = form.payMethod === m
                    return (
                      <button key={m} type="button" onClick={() => setForm(f => ({ ...f, payMethod: m }))}
                        style={{ flex: '1 1 auto', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', background: active ? C.card : 'transparent', color: active ? C.greenDeep : C.muted, boxShadow: active ? C.shadowSm : 'none', transition: 'all .15s ease' }}
                      >{m}</button>
                    )
                  })}
                </div>
              </Field>

              {/* Date + Recurring row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                <Field label="Date paid">
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ ...inp(), cursor: 'pointer' }}
                  />
                </Field>
                <div style={{ paddingBottom: '2px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', padding: '12px 14px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '12px' }}>
                    <button type="button" onClick={() => setForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
                      style={{ width: '36px', height: '20px', borderRadius: '999px', background: form.isRecurring ? C.copper : C.line, position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background .18s ease' }}
                    >
                      <span style={{ position: 'absolute', top: '2px', left: form.isRecurring ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '999px', background: '#fff', boxShadow: C.shadowSm, transition: 'left .18s ease', display: 'block' }} />
                    </button>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: C.ink, margin: 0 }}>Recurring</p>
                      <p style={{ fontSize: '11.5px', color: C.muted, margin: 0 }}>Rent, wages, etc.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowLogModal(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}
                >Cancel</button>
                <button type="submit" disabled={isSaving}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: isSaving ? C.paper2 : C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: isSaving ? C.muted : '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: isSaving ? 'none' : C.shadowSm, fontFamily: 'inherit' }}
                >
                  {isSaving ? 'Saving…' : 'Save expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CATEGORIES MODAL ═══ */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowCatModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '420px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.copperDeep, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>Manage</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: 0 }}>Expense categories</h3>
              </div>
              <button onClick={() => setShowCatModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <div style={{ padding: '16px 24px 20px' }}>
              {/* Add form */}
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="New category name…"
                  className="placeholder:text-[#8C8170]"
                  style={{ flex: 1, ...inp(), padding: '10px 12px', fontSize: '13.5px' }}
                />
                <button type="submit" disabled={isSavingCat || !newCatName.trim()}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', background: C.green, border: 'none', color: '#fff', cursor: isSavingCat || !newCatName.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !newCatName.trim() ? 0.5 : 1, flexShrink: 0 }}
                >
                  <Icons.Plus />
                </button>
              </form>

              {/* Category list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto', scrollbarWidth: 'none' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '10px', background: C.paper, border: `1px solid ${C.lineSoft}`, transition: 'background .12s ease' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper2}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: cat.isDefault ? C.green : C.line, flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.ink }}>{cat.name}</span>
                      {cat.isDefault && <span style={{ fontSize: '11px', color: C.muted }}>Default</span>}
                    </div>
                    {!cat.isDefault && (
                      <button onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        style={{ width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', transition: 'all .12s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.danger; (e.currentTarget as HTMLElement).style.background = C.dangerTint }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.background = 'none' }}
                      >
                        <Icons.Trash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
