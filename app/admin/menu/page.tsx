'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

// ── Icons ────────────────────────────────────────────────────────
const Icons = {
  Search:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  Plus:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Close:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Edit:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Grid:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
  List:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Image:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Grip:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="17" r="1"/><circle cx="15" cy="17" r="1"/></svg>,
  Table:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18M4 9l1 11M20 9l-1 11M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/></svg>,
  Clear:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
}

// ── Palette ───────────────────────────────────────────────────────
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

// ── Toggle switch ─────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: '38px', height: '22px', borderRadius: '999px', background: checked ? C.green : C.line, position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background .18s ease' }}
    >
      <span style={{ position: 'absolute', top: '2px', left: checked ? '18px' : '2px', width: '18px', height: '18px', borderRadius: '999px', background: '#fff', boxShadow: C.shadowSm, transition: 'left .18s ease', display: 'block' }} />
    </button>
  )
}

// ── Input helpers ─────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = (focused = false): React.CSSProperties => ({
  width: '100%', background: C.card2, border: `1px solid ${focused ? C.greenDeep : C.line}`,
  boxShadow: focused ? `0 0 0 3px ${C.greenTint}` : 'none',
  borderRadius: '12px', padding: '12px 14px', fontSize: '14.5px', color: C.ink,
  outline: 'none', fontFamily: 'inherit', transition: 'all .15s ease', boxSizing: 'border-box' as const,
})

// ── Page ──────────────────────────────────────────────────────────
export default function AdminMenuPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [menuItems,   setMenuItems]   = useState<any[]>([])
  const [tables,      setTables]      = useState<any[]>([])
  const [categories,  setCategories]  = useState<any[]>([])
  const [isLoading,   setIsLoading]   = useState(true)

  // Tab
  const [tab, setTab] = useState<'dishes' | 'categories' | 'tables'>('dishes')

  // Dishes UI
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [view,      setView]      = useState<'cards' | 'list'>('cards')
  const [searchFocused, setSearchFocused] = useState(false)

  // Modals
  const [showItemModal,    setShowItemModal]    = useState(false)
  const [showCatModal,     setShowCatModal]     = useState(false)
  const [showTableModal,   setShowTableModal]   = useState(false)
  const [editingItem,      setEditingItem]      = useState<any>(null)

  // Item form
  const [itemForm, setItemForm] = useState({ name: '', categoryId: '', basePrice: '', imageUrl: '' })
  const [nameFocused, setNameFocused]   = useState(false)
  const [priceFocused, setPriceFocused] = useState(false)
  const [isUploading, setIsUploading]   = useState(false)
  const [isPending,   setIsPending]     = useState(false)

  // Category / table form
  const [newCatName,   setNewCatName]   = useState('')
  const [newTableName, setNewTableName] = useState('')

  const fmt = (n?: number | any) => n != null ? `₵${Number(n).toFixed(2)}` : 'Custom'

  // ── Fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/menu')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setMenuItems(data.items || [])
        setCategories(data.categories || [])
        setTables(data.tables || [])
      })
      .catch(() => toast.error('Failed to load menu data'))
      .finally(() => setIsLoading(false))
  }, [])

  // ── Filtered dishes ───────────────────────────────────────────────
  const filtered = useMemo(() => menuItems.filter(m =>
    (catFilter === 'all' || m.categoryId === catFilter) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  ), [menuItems, catFilter, search])

  const dishCount = (catId: string) => menuItems.filter(m => m.categoryId === catId).length

  // ── Open edit ────────────────────────────────────────────────────
  const openEdit = (item: any) => {
    setEditingItem(item)
    setItemForm({ name: item.name, categoryId: item.categoryId || '', basePrice: item.basePrice != null ? String(item.basePrice) : '', imageUrl: item.images?.[0] || '' })
    setShowItemModal(true)
  }

  const openAdd = () => {
    setEditingItem(null)
    setItemForm({ name: '', categoryId: categories[0]?.id || '', basePrice: '', imageUrl: '' })
    setShowItemModal(true)
  }

  // ── Submit item (add or edit) ─────────────────────────────────────
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name || !itemForm.categoryId) { toast.error('Name and category required'); return }
    setIsPending(true)
    const payload = {
      name: itemForm.name,
      categoryId: itemForm.categoryId,
      basePrice: itemForm.basePrice === '' ? null : parseFloat(itemForm.basePrice),
      images: itemForm.imageUrl ? [itemForm.imageUrl] : (editingItem?.images || []),
    }
    try {
      const url    = editingItem ? `/api/admin/menu/items/${editingItem.id}` : '/api/admin/menu/items'
      const method = editingItem ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data   = await res.json()
      if (data.error) throw new Error(data.error)
      if (editingItem) {
        setMenuItems(prev => prev.map(m => m.id === editingItem.id ? { ...m, ...data } : m))
        toast.success('Dish updated')
      } else {
        setMenuItems(prev => [data, ...prev])
        toast.success('Dish added')
      }
      setShowItemModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save dish')
    } finally {
      setIsPending(false)
    }
  }

  // ── Toggle availability ───────────────────────────────────────────
  const toggleItem = async (id: string, current: boolean) => {
    const next = !current
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, isActive: next } : m))
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: next }) })
      if (!res.ok) { setMenuItems(prev => prev.map(m => m.id === id ? { ...m, isActive: current } : m)); toast.error('Failed to update') }
    } catch { setMenuItems(prev => prev.map(m => m.id === id ? { ...m, isActive: current } : m)); toast.error('Failed to update') }
  }

  // ── Toggle category ───────────────────────────────────────────────
  const toggleCat = async (id: string, current: boolean) => {
    const next = !current
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: next } : c))
    try {
      const res = await fetch(`/api/admin/menu/categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: next }) })
      if (!res.ok) { setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: current } : c)); toast.error('Failed to update') }
    } catch { setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: current } : c)); toast.error('Failed to update') }
  }

  // ── Toggle table ──────────────────────────────────────────────────
  const toggleTable = async (id: string, current: boolean) => {
    const next = !current
    setTables(prev => prev.map(t => t.id === id ? { ...t, isActive: next } : t))
    try {
      const res = await fetch(`/api/admin/menu/tables/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: next }) })
      if (!res.ok) { setTables(prev => prev.map(t => t.id === id ? { ...t, isActive: current } : t)); toast.error('Failed to update') }
    } catch { setTables(prev => prev.map(t => t.id === id ? { ...t, isActive: current } : t)); toast.error('Failed to update') }
  }

  // ── Add category ──────────────────────────────────────────────────
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) { toast.error('Name required'); return }
    setIsPending(true)
    try {
      const res  = await fetch('/api/admin/menu/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCategories(prev => [...prev, data])
      setShowCatModal(false)
      setNewCatName('')
      toast.success('Category added')
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setIsPending(false) }
  }

  // ── Add table ─────────────────────────────────────────────────────
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTableName.trim()) { toast.error('Name required'); return }
    setIsPending(true)
    try {
      const res  = await fetch('/api/admin/menu/tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTableName }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTables(prev => [...prev, data])
      setShowTableModal(false)
      setNewTableName('')
      toast.success('Table added')
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setIsPending(false) }
  }

  // ── ImageKit upload ───────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    toast.loading('Uploading image…', { id: 'img-upload' })
    try {
      const authRes  = await fetch('/api/imagekit/auth')
      if (!authRes.ok) throw new Error('Auth failed')
      const authData = await authRes.json()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '')
      formData.append('signature', authData.signature)
      formData.append('expire', authData.expire.toString())
      formData.append('token', authData.token)
      formData.append('folder', '/chezkeke/menu')
      formData.append('fileName', `${itemForm.name || 'item'}_${Date.now()}`)
      const uploadRes  = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const uploadData = await uploadRes.json()
      setItemForm(f => ({ ...f, imageUrl: uploadData.url }))
      toast.success('Image uploaded', { id: 'img-upload' })
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: 'img-upload' })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${C.line}`, borderTopColor: C.green, animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const tabDefs = [
    { id: 'dishes',     label: 'Dishes',     n: menuItems.length   },
    { id: 'categories', label: 'Categories', n: categories.length  },
    { id: 'tables',     label: 'Tables',     n: tables.length      },
  ] as const

  return (
    <div style={{ padding: '28px 40px 60px', background: C.paper, minHeight: '100%' }}>

      {/* ── Page heading ── */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: '0 0 4px', lineHeight: 1 }}>Menu</h1>
        <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Manage dishes, categories and tables</p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '6px', padding: '5px', background: C.paper2, borderRadius: '999px', marginBottom: '22px', width: 'fit-content' }}>
        {tabDefs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '999px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? C.green : 'transparent', color: active ? '#fff' : C.inkSoft, border: 'none', boxShadow: active ? C.shadowSm : 'none', transition: 'all .15s ease' }}
            >
              {t.label}
              <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,255,255,.22)' : C.paper, color: active ? '#fff' : C.inkSoft }}>
                {t.n}
              </span>
            </button>
          )
        })}
      </div>

      {/* ═══════════════════ DISHES TAB ═══════════════════ */}
      {tab === 'dishes' && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 1 280px', background: C.card2, border: `1px solid ${searchFocused ? C.greenDeep : C.line}`, boxShadow: searchFocused ? `0 0 0 3px ${C.greenTint}` : C.shadowSm, borderRadius: '999px', padding: '0 14px', transition: 'all .15s ease' }}>
              <span style={{ color: C.muted, flexShrink: 0 }}><Icons.Search /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Search dishes…"
                className="placeholder:text-[#8C8170]"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '11px 0', fontSize: '14px', color: C.ink, fontFamily: 'inherit' }}
              />
              {search && <button onClick={() => setSearch('')} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: '2px' }}><Icons.Clear /></button>}
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
              {[{ id: 'all', name: 'All', n: menuItems.length }, ...categories.map(c => ({ id: c.id, name: c.name, n: dishCount(c.id) }))].map(c => {
                const active = catFilter === c.id
                return (
                  <button key={c.id} onClick={() => setCatFilter(c.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 15px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? C.green : C.card, color: active ? '#fff' : C.inkSoft, border: `1px solid ${active ? C.green : C.line}`, transition: 'all .15s ease' }}
                  >
                    {c.name} <span style={{ fontSize: '11px', opacity: .7 }}>{c.n}</span>
                  </button>
                )
              })}
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', background: C.paper2, borderRadius: '10px', padding: '3px', gap: '3px', flexShrink: 0 }}>
              {(['cards', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '7px 11px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, background: view === v ? C.card : 'transparent', color: view === v ? C.greenDeep : C.muted, boxShadow: view === v ? C.shadowSm : 'none', transition: 'all .15s ease' }}
                >
                  {v === 'cards' ? <Icons.Grid /> : <Icons.List />} {v === 'cards' ? 'Cards' : 'List'}
                </button>
              ))}
            </div>

            {/* Add button */}
            <button onClick={openAdd}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: C.green, color: '#fff', fontSize: '13.5px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: C.shadowSm, flexShrink: 0, fontFamily: 'inherit' }}
            >
              <Icons.Plus /> Add dish
            </button>
          </div>

          {/* Count */}
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '16px' }}>
            {filtered.length} dish{filtered.length !== 1 ? 'es' : ''}{catFilter !== 'all' ? ` in ${categories.find(c => c.id === catFilter)?.name || ''}` : ''}
          </p>

          {/* Cards view */}
          {view === 'cards' && (
            <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {filtered.map(item => (
                <div key={item.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '18px', overflow: 'hidden', boxShadow: C.shadowSm, display: 'flex', flexDirection: 'column', opacity: item.isActive === false ? 0.65 : 1, transition: 'all .15s ease' }}>
                  {/* Photo */}
                  <div style={{ position: 'relative', aspectRatio: '16/10', background: C.paper2, overflow: 'hidden' }}>
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, opacity: 0.4 }}><Icons.Image /></div>
                    )}
                    {item.isActive === false && (
                      <span style={{ position: 'absolute', top: '10px', left: '10px', background: C.ink, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px' }}>Hidden</span>
                    )}
                  </div>
                  {/* Body */}
                  <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                      <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 500, color: C.ink, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name}</h3>
                      <span style={{ fontWeight: 700, color: C.greenDeep, whiteSpace: 'nowrap', fontSize: '14px' }}>{fmt(item.basePrice)}</span>
                    </div>
                    <span style={{ alignSelf: 'flex-start', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.copperDeep, background: C.copperTint, padding: '3px 9px', borderRadius: '999px' }}>
                      {item.category?.name || '—'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: `1px solid ${C.lineSoft}` }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <Toggle checked={item.isActive !== false} onChange={() => toggleItem(item.id, item.isActive !== false)} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: C.inkSoft }}>{item.isActive !== false ? 'Available' : 'Hidden'}</span>
                      </label>
                      <button onClick={() => openEdit(item)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: C.greenDeep, padding: '5px 11px', borderRadius: '8px', border: `1px solid ${C.line}`, background: C.card, cursor: 'pointer', transition: 'all .15s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenTint; (e.currentTarget as HTMLElement).style.borderColor = C.greenDeep }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card; (e.currentTarget as HTMLElement).style.borderColor = C.line }}
                      >
                        <Icons.Edit /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: '14px' }}>
                  No dishes match.{' '}
                  <button onClick={() => { setSearch(''); setCatFilter('all') }} style={{ color: C.greenDeep, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
                </div>
              )}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', overflow: 'hidden', boxShadow: C.shadowSm }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2.6fr 1fr .9fr .9fr .7fr', gap: '14px', padding: '10px 16px', borderBottom: `1px solid ${C.line}` }}>
                {['Dish', 'Category', 'Price', 'Available', ''].map((h, i) => (
                  <span key={h + i} style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.muted, textAlign: i >= 2 ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>
              {filtered.length === 0 && <div style={{ padding: '36px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>No dishes match.</div>}
              {filtered.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2.6fr 1fr .9fr .9fr .7fr', gap: '14px', padding: '11px 16px', alignItems: 'center', borderBottom: idx < filtered.length - 1 ? `1px solid ${C.lineSoft}` : 'none', opacity: item.isActive === false ? 0.6 : 1, transition: 'background .12s ease' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '9px', overflow: 'hidden', background: C.paper2, flexShrink: 0 }}>
                      {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, opacity: .4 }}><Icons.Image /></div>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '14.5px', fontWeight: 700, color: C.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    </div>
                  </span>
                  <span><span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.copperDeep, background: C.copperTint, padding: '3px 9px', borderRadius: '999px' }}>{item.category?.name || '—'}</span></span>
                  <span style={{ textAlign: 'center', fontWeight: 700, color: C.greenDeep, fontSize: '14px' }}>{fmt(item.basePrice)}</span>
                  <span style={{ display: 'flex', justifyContent: 'center' }}><Toggle checked={item.isActive !== false} onChange={() => toggleItem(item.id, item.isActive !== false)} /></span>
                  <span style={{ textAlign: 'right' }}>
                    <button onClick={() => openEdit(item)}
                      style={{ fontSize: '13px', fontWeight: 700, color: C.greenDeep, padding: '5px 11px', borderRadius: '8px', border: `1px solid ${C.line}`, background: C.card, cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenTint }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card }}
                    >Edit</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ CATEGORIES TAB ═══════════════════ */}
      {tab === 'categories' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {categories.filter(c => c.isActive !== false).length} showing on the menu · {categories.filter(c => c.isActive === false).length} hidden
            </p>
            <button onClick={() => setShowCatModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: C.green, color: '#fff', fontSize: '13.5px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit' }}
            >
              <Icons.Plus /> Add category
            </button>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', overflow: 'hidden', boxShadow: C.shadowSm }}>
            {categories.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>No categories yet.</div>}
            {categories.map((cat, idx) => (
              <div key={cat.id} style={{ display: 'grid', gridTemplateColumns: '24px 1.6fr 1fr auto auto', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: idx < categories.length - 1 ? `1px solid ${C.lineSoft}` : 'none', opacity: cat.isActive === false ? 0.6 : 1, transition: 'background .12s ease' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <span style={{ color: C.line, display: 'inline-flex', cursor: 'grab' }}><Icons.Grip /></span>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.ink }}>{cat.name}</span>
                <span style={{ fontSize: '13px', color: C.muted, fontWeight: 600 }}>{dishCount(cat.id)} dish{dishCount(cat.id) !== 1 ? 'es' : ''}</span>
                <Toggle checked={cat.isActive !== false} onChange={() => toggleCat(cat.id, cat.isActive !== false)} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: cat.isActive !== false ? C.green : C.muted, minWidth: '90px', textAlign: 'right' }}>
                  {cat.isActive !== false ? 'On the menu' : 'Hidden'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════ TABLES TAB ═══════════════════ */}
      {tab === 'tables' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {tables.filter(t => t.isActive !== false).length} active · {tables.filter(t => t.isActive === false).length} closed
            </p>
            <button onClick={() => setShowTableModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: C.green, color: '#fff', fontSize: '13.5px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit' }}
            >
              <Icons.Plus /> Add table
            </button>
          </div>

          <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {tables.map(t => {
              const active = t.isActive !== false
              const zone   = t.name.startsWith('Garden') ? 'Garden' : t.name === 'Takeaway' ? 'Takeaway' : 'Indoor'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '13px', background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '16px 18px', boxShadow: C.shadowSm, opacity: active ? 1 : 0.55, transition: 'all .15s ease' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: active ? C.greenTint : C.paper2, color: active ? C.greenDeep : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icons.Table />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15.5px', fontWeight: 700, color: C.ink, margin: 0 }}>{t.name}</p>
                    <span style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>{zone}</span>
                  </div>
                  <Toggle checked={active} onChange={() => toggleTable(t.id, active)} />
                </div>
              )
            })}
            {tables.length === 0 && <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>No tables yet.</div>}
          </div>
        </>
      )}

      {/* ═══════════════════ ADD / EDIT DISH MODAL ═══════════════════ */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowItemModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '680px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

            {/* Modal head */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.copperDeep, margin: '0 0 4px' }}>{editingItem ? 'Edit dish' : 'New dish'}</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: 0 }}>
                  {editingItem ? (itemForm.name || 'Edit dish') : 'Add to the menu'}
                </h3>
              </div>
              <button onClick={() => setShowItemModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} style={{ padding: '20px 24px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Photo row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: '16px', borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: C.paper2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                  {itemForm.imageUrl ? <img src={itemForm.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icons.Image />}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: C.inkSoft, margin: '0 0 8px' }}>Dish photo</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${C.line}`, background: C.card2, fontSize: '13px', fontWeight: 700, color: C.greenDeep, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {isUploading ? 'Uploading…' : itemForm.imageUrl ? 'Replace photo' : 'Upload a photo'}
                  </button>
                  {itemForm.imageUrl && (
                    <button type="button" onClick={() => setItemForm(f => ({ ...f, imageUrl: '' }))}
                      style={{ marginLeft: '8px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${C.lineSoft}`, background: 'transparent', fontSize: '13px', fontWeight: 600, color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}
                    >Remove</button>
                  )}
                  <p style={{ fontSize: '12px', color: C.muted, margin: '6px 0 0' }}>Square crops work best.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" style={{ display: 'none' }} />
              </div>

              {/* Name */}
              <Field label="Dish name">
                <input type="text" required autoFocus
                  value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)}
                  placeholder="e.g. Jollof Rice & Chicken"
                  className="placeholder:text-[#8C8170]"
                  style={inputStyle(nameFocused)}
                />
              </Field>

              {/* Category + Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Category">
                  <select value={itemForm.categoryId} onChange={e => setItemForm(f => ({ ...f, categoryId: e.target.value }))}
                    style={{ ...inputStyle(), appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Price (₵) — leave blank for custom">
                  <input type="number" step="0.5"
                    value={itemForm.basePrice} onChange={e => setItemForm(f => ({ ...f, basePrice: e.target.value }))}
                    onFocus={() => setPriceFocused(true)} onBlur={() => setPriceFocused(false)}
                    placeholder="0.00"
                    className="placeholder:text-[#8C8170]"
                    style={inputStyle(priceFocused)}
                  />
                </Field>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowItemModal(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}
                >Cancel</button>
                <button type="submit" disabled={isPending}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: isPending ? C.paper2 : C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: isPending ? C.muted : '#fff', cursor: isPending ? 'not-allowed' : 'pointer', boxShadow: isPending ? 'none' : C.shadowSm, fontFamily: 'inherit' }}
                >
                  {isPending ? 'Saving…' : editingItem ? 'Save changes' : 'Add dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ ADD CATEGORY MODAL ═══════════════════ */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowCatModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '400px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.copperDeep, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>New entry</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: 0 }}>Add a category</h3>
              </div>
              <button onClick={() => setShowCatModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <form onSubmit={handleAddCategory} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Category name">
                <input type="text" autoFocus required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Breakfast"
                  className="placeholder:text-[#8C8170]" style={inputStyle()} />
              </Field>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowCatModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={isPending} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: isPending ? C.paper2 : C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: isPending ? C.muted : '#fff', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {isPending ? 'Saving…' : 'Add category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ ADD TABLE MODAL ═══════════════════ */}
      {showTableModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowTableModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '400px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.copperDeep, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>Add seating</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: 0 }}>New table</h3>
              </div>
              <button onClick={() => setShowTableModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <form onSubmit={handleAddTable} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Table name">
                <input type="text" autoFocus required value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="e.g. Table 7 or Garden 3"
                  className="placeholder:text-[#8C8170]" style={inputStyle()} />
              </Field>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowTableModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={isPending} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: isPending ? C.paper2 : C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: isPending ? C.muted : '#fff', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {isPending ? 'Saving…' : 'Add table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
