'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useSettingsStore } from '../../../lib/store'

const API_MAP: Record<string, string> = {
  items:      '/api/admin/menu/items',
  categories: '/api/admin/menu/categories',
  tables:     '/api/admin/menu/tables',
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

const Icons = {
  Edit:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Power: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  Save:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: '38px', height: '22px', borderRadius: '999px', background: on ? C.green : C.line, position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background .18s ease' }}
    >
      <span style={{ position: 'absolute', top: '2px', left: on ? '18px' : '2px', width: '18px', height: '18px', borderRadius: '999px', background: '#fff', boxShadow: C.shadowSm, transition: 'left .18s ease', display: 'block' }} />
    </button>
  )
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        placeholder={placeholder}
        className="placeholder:text-[#8C8170]"
        style={{ width: '100%', background: C.card2, border: `1px solid ${f ? C.greenDeep : C.line}`, boxShadow: f ? `0 0 0 3px ${C.greenTint}` : 'none', borderRadius: '12px', padding: '12px 14px', fontSize: '14.5px', color: C.ink, outline: 'none', fontFamily: 'inherit', transition: 'all .15s ease', boxSizing: 'border-box' as const }}
      />
    </div>
  )
}

function RateRow({ label, sub, value, onChange, accent }: { label: string; sub: string; value: number; onChange: (v: number) => void; accent?: string }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.lineSoft}` }}>
      <div>
        <p style={{ fontSize: '14.5px', fontWeight: 700, color: accent || C.ink, margin: 0 }}>{label}</p>
        <p style={{ fontSize: '12px', color: C.muted, margin: '2px 0 0' }}>{sub}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: C.card2, border: `1px solid ${f ? C.greenDeep : C.line}`, boxShadow: f ? `0 0 0 3px ${C.greenTint}` : 'none', borderRadius: '10px', padding: '0 12px', transition: 'all .15s ease' }}>
        <input type="number" step="0.1" value={value} onChange={e => onChange(Number(e.target.value))}
          onFocus={() => setF(true)} onBlur={() => setF(false)}
          style={{ width: '60px', border: 'none', outline: 'none', background: 'none', fontFamily: "'Newsreader', Georgia, serif", fontSize: '18px', fontWeight: 600, color: C.ink, padding: '8px 0', textAlign: 'right' }}
        />
        <span style={{ color: C.muted, fontWeight: 600, marginLeft: '4px', fontSize: '14px' }}>%</span>
      </div>
    </div>
  )
}

export default function AdminSettings() {
  const [activeTab,      setActiveTab]      = useState<'profile' | 'tax' | 'archives'>('profile')
  const [archiveSubTab,  setArchiveSubTab]  = useState<'items' | 'categories' | 'tables'>('items')
  const [storeName,      setStoreName]      = useState('Chez Keke')
  const [storeTagline,   setStoreTagline]   = useState('The Spirit of Africa in Every Grain')
  const [isSaving,       setIsSaving]       = useState(false)
  const [saved,          setSaved]          = useState(false)

  const taxConfig      = useSettingsStore(state => state.taxConfig)
  const updateTaxConfig = useSettingsStore(state => state.updateTaxConfig)
  const [localTax,     setLocalTax]         = useState(taxConfig)

  const [items,          setItems]          = useState<any[]>([])
  const [categories,     setCategories]     = useState<any[]>([])
  const [tables,         setTables]         = useState<any[]>([])
  const [archivesLoading,setArchivesLoading]= useState(false)
  const [archiveSearch,  setArchiveSearch]  = useState('')
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editValue,      setEditValue]      = useState('')
  const [editFormData,   setEditFormData]   = useState<any>({ name: '', basePrice: 0, categoryId: '', imageUrl: '' })
  const [isUploading,    setIsUploading]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return
      setStoreName(data.storeName)
      setStoreTagline(data.storeTagline)
      const dbTax = { isTaxEnabled: data.isTaxEnabled, isInclusive: data.isInclusive, vatRate: data.vatRate, nhilRate: data.nhilRate, getfundRate: data.getfundRate, serviceCharge: data.serviceCharge, discountRate: data.discountRate ?? 0 }
      setLocalTax(dbTax)
      updateTaxConfig(dbTax)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab !== 'archives') return
    setArchivesLoading(true)
    fetch('/api/admin/menu').then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return
      setItems(data.items); setCategories(data.categories); setTables(data.tables)
    }).catch(() => toast.error('Failed to load archives')).finally(() => setArchivesLoading(false))
  }, [activeTab])

  const totalTax = (localTax.vatRate + localTax.nhilRate + localTax.getfundRate).toFixed(1)
  const updateTaxRate = (key: keyof typeof localTax, value: any) => setLocalTax(p => ({ ...p, [key]: value }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const isTax = activeTab === 'tax'
      const payload = isTax ? localTax : { storeName, storeTagline }
      const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      if (isTax) updateTaxConfig(localTax)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      toast.success(isTax ? 'Tax settings saved' : 'Restaurant details saved')
    } catch { toast.error('Failed to save settings') }
    finally { setIsSaving(false) }
  }

  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsUploading(true); toast.loading('Uploading…', { id: 'img' })
    try {
      const authData = await fetch('/api/imagekit/auth').then(r => r.json())
      const fd = new FormData()
      fd.append('file', file); fd.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '')
      fd.append('signature', authData.signature); fd.append('expire', authData.expire.toString()); fd.append('token', authData.token)
      fd.append('folder', '/chezkeke/menu'); fd.append('fileName', `${editFormData.name || 'item'}_${Date.now()}`)
      const up = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('Upload failed')
      const data = await up.json()
      setEditFormData((p: any) => ({ ...p, imageUrl: data.url }))
      toast.success('Image uploaded', { id: 'img' })
    } catch (err: any) { toast.error(err.message || 'Upload failed', { id: 'img' }) }
    finally { setIsUploading(false) }
  }

  const toggleStatus = async (id: string, type: 'items' | 'categories' | 'tables') => {
    const list  = type === 'items' ? items : type === 'categories' ? categories : tables
    const entry = list.find(x => x.id === id)
    const next  = !entry?.isActive
    try {
      const res = await fetch(`${API_MAP[type]}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: next }) })
      if (!res.ok) throw new Error()
      const setter = type === 'items' ? setItems : type === 'categories' ? setCategories : setTables
      setter(prev => prev.map(x => x.id === id ? { ...x, isActive: next } : x))
      toast.success(`${entry?.name || entry?.label} ${next ? 'activated' : 'deactivated'}`)
    } catch { toast.error('Failed to update') }
  }

  const startRename = (id: string, entry: any) => {
    setEditingId(id); setEditValue(entry.name || entry.label)
    if (archiveSubTab === 'items') setEditFormData({ name: entry.name, basePrice: entry.basePrice || 0, categoryId: entry.categoryId, imageUrl: entry.images?.[0] || '' })
  }

  const saveRename = async (type: 'items' | 'categories' | 'tables') => {
    const list  = type === 'items' ? items : type === 'categories' ? categories : tables
    const entry = list.find(x => x.id === editingId); if (!entry) return
    const data: any = type === 'items'
      ? { name: editFormData.name, basePrice: Number(editFormData.basePrice), categoryId: editFormData.categoryId, images: editFormData.imageUrl ? [editFormData.imageUrl] : [] }
      : { name: editValue }
    try {
      const res = await fetch(`${API_MAP[type]}/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      const setter = type === 'items' ? setItems : type === 'categories' ? setCategories : setTables
      setter(prev => prev.map(x => x.id === editingId ? { ...x, ...data, category: type === 'items' ? categories.find(c => c.id === data.categoryId) : x.category, label: type === 'categories' ? editValue : x.label } : x))
      setEditingId(null); toast.success('Updated successfully')
    } catch { toast.error('Failed to save') }
  }

  return (
    <div style={{ padding: '28px 40px 80px', background: C.paper, minHeight: '100%' }}>

      {/* ── Heading ── */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: '0 0 4px', lineHeight: 1 }}>Settings</h1>
        <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Configure your restaurant profile, taxes and archives</p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '6px', padding: '5px', background: C.paper2, borderRadius: '999px', marginBottom: '28px', width: 'fit-content' }}>
        {[
          { id: 'profile',  label: 'Restaurant' },
          { id: 'tax',      label: 'Tax & Charges' },
          { id: 'archives', label: 'Archives' },
        ].map(t => {
          const active = activeTab === t.id
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              style={{ padding: '9px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, background: active ? C.green : 'transparent', color: active ? '#fff' : C.inkSoft, boxShadow: active ? C.shadowSm : 'none', transition: 'all .15s ease', whiteSpace: 'nowrap' }}
            >{t.label}</button>
          )
        })}
      </div>

      {/* ══ PROFILE TAB ══ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'start' }}>

          {/* Restaurant details */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowSm }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 20px' }}>Restaurant details</h3>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px', paddingBottom: '22px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: C.shadowMd }}>
                <Image src="/logo.png" alt="Logo" fill className="object-cover" />
              </div>
              <div>
                <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: '22px', fontWeight: 600, color: C.greenDeep, margin: 0 }}>{storeName}</p>
                <p style={{ fontSize: '13px', color: C.muted, margin: '3px 0 10px' }}>{storeTagline}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FieldInput label="Restaurant name" value={storeName} onChange={setStoreName} placeholder="e.g. Chez Keke" />
              <FieldInput label="Tagline" value={storeTagline} onChange={setStoreTagline} placeholder="e.g. The Spirit of Africa in Every Grain" />
            </div>
          </section>

          {/* Info panel */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowSm }}>
            <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 16px' }}>About this system</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Location',    value: 'Odumase–Krobo · Opp. Odumase Station' },
                { label: 'Tel / MoMo', value: '0242 691 458' },
                { label: 'Wi-Fi',      value: 'chezkeke.network' },
                { label: 'POS version',value: 'v1.2.0 · Chez Keke POS' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.lineSoft}`, fontSize: '14px' }}>
                  <span style={{ fontWeight: 600, color: C.muted }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: C.ink }}>{row.value}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: C.muted, margin: '16px 0 0', fontStyle: 'italic' }}>Contact your developer to update location, phone or Wi-Fi details.</p>
          </section>
        </div>
      )}

      {/* ══ TAX TAB ══ */}
      {activeTab === 'tax' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'start' }}>

          {/* Left: core tax */}
          <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowSm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 3px' }}>Taxes &amp; charges</h3>
                <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>Applied at the till</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: localTax.isTaxEnabled ? C.green : C.muted }}>{localTax.isTaxEnabled ? 'On' : 'Off'}</span>
                <Toggle on={localTax.isTaxEnabled} onChange={() => updateTaxRate('isTaxEnabled', !localTax.isTaxEnabled)} />
              </div>
            </div>

            {/* Exclusive only */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: C.ink, margin: '0 0 2px' }}>Tax exclusive</p>
                  <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>Tax is added on top of the item price at the till</p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, background: C.greenTint, color: C.greenDeep, padding: '4px 12px', borderRadius: '999px' }}>Active</span>
              </div>
            </div>

            {/* Tax rates */}
            <div style={{ opacity: localTax.isTaxEnabled ? 1 : 0.4, pointerEvents: localTax.isTaxEnabled ? 'auto' : 'none', transition: 'opacity .2s ease' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, margin: '0 0 4px' }}>GRA tax stack</p>
              <RateRow label="VAT"     sub="Value Added Tax"          value={localTax.vatRate}     onChange={v => updateTaxRate('vatRate', v)}     accent={C.greenDeep} />
              <RateRow label="NHIL"    sub="National Health Insurance" value={localTax.nhilRate}    onChange={v => updateTaxRate('nhilRate', v)}    accent={C.copper}    />
              <RateRow label="GETFund" sub="Education Fund Levy"       value={localTax.getfundRate} onChange={v => updateTaxRate('getfundRate', v)} accent={C.inkSoft}   />
            </div>
          </section>

          {/* Right: service, discount, summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowSm }}>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 600, color: C.ink, margin: '0 0 20px' }}>Operational charges</h3>
              <RateRow label="Service charge" sub="Added to order total"          value={localTax.serviceCharge} onChange={v => updateTaxRate('serviceCharge', v)} />
              <RateRow label="Discount rate"  sub="Applied to subtotal before tax; 0 to disable" value={localTax.discountRate}  onChange={v => updateTaxRate('discountRate', v)} />
            </section>

            {/* Summary */}
            <section style={{ background: `radial-gradient(600px 300px at 80% -10%, rgba(190,107,52,.15), transparent 60%), linear-gradient(150deg, #21604D, #163C30)`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowMd }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(243,236,221,.6)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total tax aggregate</p>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '52px', fontWeight: 600, color: '#fff', margin: '0 0 4px', lineHeight: 1 }}>{totalTax}<span style={{ fontSize: '28px', color: 'rgba(243,236,221,.5)' }}>%</span></p>
              <p style={{ fontSize: '12.5px', color: 'rgba(243,236,221,.6)', margin: '0 0 20px' }}>VAT + NHIL + GETFund on subtotal</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,.14)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: `VAT`,     value: `${localTax.vatRate}%`     },
                  { label: `NHIL`,    value: `${localTax.nhilRate}%`    },
                  { label: `GETFund`, value: `${localTax.getfundRate}%` },
                  { label: `Service`, value: `${localTax.serviceCharge}%` },
                  { label: `Discount`,value: `${localTax.discountRate}%`  },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(243,236,221,.7)', fontWeight: 600 }}>
                    <span>{r.label}</span><span>{r.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ══ ARCHIVES TAB ══ */}
      {activeTab === 'archives' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: '0 0 3px' }}>Archive management</h3>
              <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>Toggle, rename and manage all menu entities</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: '999px', padding: '0 12px', width: '220px', boxShadow: C.shadowSm }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
                <input value={archiveSearch} onChange={e => { setArchiveSearch(e.target.value) }}
                  placeholder="Search…"
                  className="placeholder:text-[#8C8170]"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', padding: '9px 0', fontSize: '13.5px', color: C.ink, fontFamily: 'inherit' }}
                />
                {archiveSearch && (
                  <button onClick={() => setArchiveSearch('')} style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: '1px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', background: C.paper2, borderRadius: '10px', padding: '3px', gap: '3px' }}>
                {(['items', 'categories', 'tables'] as const).map(t => (
                  <button key={t} onClick={() => { setArchiveSubTab(t); setArchiveSearch('') }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, background: archiveSubTab === t ? C.card : 'transparent', color: archiveSubTab === t ? C.greenDeep : C.muted, boxShadow: archiveSubTab === t ? C.shadowSm : 'none', transition: 'all .15s ease', textTransform: 'capitalize' }}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', overflow: 'hidden', boxShadow: C.shadowSm }}>
            {archivesLoading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>Loading…</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                    {['Name', 'Status', ''].map((h, i) => (
                      <th key={h + i} style={{ padding: '11px 20px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(archiveSubTab === 'items' ? items : archiveSubTab === 'categories' ? categories : tables)
                    .filter(e => !archiveSearch || (e.name || e.label || '').toLowerCase().includes(archiveSearch.toLowerCase()))
                    .map((entry, idx, arr) => (
                    <tr key={entry.id} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${C.lineSoft}` : 'none', opacity: entry.isActive === false ? 0.55 : 1, transition: 'background .12s ease' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.paper}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Name cell */}
                      <td style={{ padding: '12px 20px' }}>
                        {editingId === entry.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {archiveSubTab === 'items' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: C.paper2, flexShrink: 0, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                                    {editFormData.imageUrl ? <img src={editFormData.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: C.muted }}>{isUploading ? '…' : 'IMG'}</div>}
                                  </div>
                                  <input value={editFormData.name} onChange={e => setEditFormData((p: any) => ({ ...p, name: e.target.value }))} placeholder="Name"
                                    style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: C.ink, outline: 'none', background: C.card2, fontFamily: 'inherit' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <input type="number" value={editFormData.basePrice} onChange={e => setEditFormData((p: any) => ({ ...p, basePrice: e.target.value }))} placeholder="Price"
                                    style={{ border: `1px solid ${C.line}`, borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: C.ink, outline: 'none', background: C.card2, fontFamily: 'inherit' }} />
                                  <select value={editFormData.categoryId} onChange={e => setEditFormData((p: any) => ({ ...p, categoryId: e.target.value }))}
                                    style={{ border: `1px solid ${C.line}`, borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: C.ink, outline: 'none', background: C.card2, fontFamily: 'inherit', cursor: 'pointer' }}>
                                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                  </select>
                                </div>
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleDeviceUpload} style={{ display: 'none' }} />
                              </div>
                            ) : (
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                style={{ border: `1px solid ${C.greenDeep}`, borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: C.ink, outline: 'none', background: C.card2, fontFamily: 'inherit', boxShadow: `0 0 0 3px ${C.greenTint}` }} />
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => saveRename(archiveSubTab)}
                                style={{ padding: '6px 14px', borderRadius: '8px', background: C.green, color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                              <button onClick={() => setEditingId(null)}
                                style={{ padding: '6px 14px', borderRadius: '8px', background: C.paper2, color: C.muted, fontSize: '13px', fontWeight: 600, border: `1px solid ${C.line}`, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {archiveSubTab === 'items' && (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: C.paper2, flexShrink: 0 }}>
                                {entry.images?.[0] ? <img src={entry.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: C.muted }}>–</div>}
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: '14.5px', fontWeight: 600, color: C.ink, margin: 0, textDecoration: entry.isActive === false ? 'line-through' : 'none' }}>{entry.name || entry.label}</p>
                                {archiveSubTab === 'items' && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.greenDeep }}>₵{Number(entry.basePrice || 0).toFixed(2)}</span>
                                    <span style={{ fontSize: '12px', color: C.muted }}>{entry.category?.name}</span>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status cell */}
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, background: entry.isActive !== false ? C.greenTint : C.dangerTint, color: entry.isActive !== false ? C.greenDeep : C.danger, padding: '3px 9px', borderRadius: '999px' }}>
                          {entry.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Actions cell */}
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => startRename(entry.id, entry)}
                            style={{ width: '30px', height: '30px', borderRadius: '7px', background: C.card2, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, cursor: 'pointer', transition: 'all .12s ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.greenDeep; (e.currentTarget as HTMLElement).style.background = C.greenTint }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.background = C.card2 }}
                          ><Icons.Edit /></button>
                          <button onClick={() => toggleStatus(entry.id, archiveSubTab)}
                            style={{ width: '30px', height: '30px', borderRadius: '7px', background: C.card2, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: entry.isActive !== false ? C.muted : C.green, cursor: 'pointer', transition: 'all .12s ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = entry.isActive !== false ? C.danger : C.green }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = entry.isActive !== false ? C.muted : C.green }}
                          ><Icons.Power /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Save bar (sticky, hidden on archives) ── */}
      {activeTab !== 'archives' && (
        <div style={{ position: 'sticky', bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', padding: '16px 0', background: `linear-gradient(transparent, ${C.paper} 40%)` }}>
          {saved && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: C.green, fontWeight: 700, fontSize: '14px', marginRight: 'auto' }}>
              <Icons.Check /> Saved
            </span>
          )}
          <button onClick={handleSave} disabled={isSaving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: isSaving ? C.paper2 : C.green, color: isSaving ? C.muted : '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: isSaving ? 'none' : C.shadowMd, fontFamily: 'inherit', transition: 'all .15s ease' }}
          >
            {isSaving ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />Saving…</> : <><Icons.Save /> Save changes</>}
          </button>
        </div>
      )}

    </div>
  )
}
