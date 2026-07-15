'use client'

import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { UserRole } from '../../../types'
import Loading from '../../components/Loading'

// ── Warm palette ──────────────────────────────────────────────────
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

// ── Role config ───────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; fg: string; description: string }> = {
  ADMIN: {
    label: 'Admin',
    bg: C.greenTint, fg: C.greenDeep,
    description: 'Full access to everything',
  },
  CASHIER: {
    label: 'Cashier',
    bg: C.copperTint, fg: C.copperDeep,
    description: 'Take payments & see all sales',
  },
  WAITER: {
    label: 'Waiter',
    bg: C.paper2, fg: C.inkSoft,
    description: 'Take orders & see own sales',
  },
}

// ── Icons ─────────────────────────────────────────────────────────
const Icons = {
  Plus:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Close:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Edit:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Key:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="M10.5 13.5l8-8M16 6l2 2M14 8l2 2"/></svg>,
  Trash:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Eye:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Check:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
  Mail:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>,
  Clock:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
}

interface User {
  id: string; name: string; email: string; role: UserRole
  isActive: boolean; createdAt: string; updatedAt: string
  _count?: { ordersCreated: number; ordersHandled: number; paymentsProcessed: number }
}

const emptyForm = { name: '', email: '', password: '', role: 'WAITER' as UserRole }

function inp(focused = false): React.CSSProperties {
  return {
    width: '100%', background: C.card2, border: `1px solid ${focused ? C.greenDeep : C.line}`,
    boxShadow: focused ? `0 0 0 3px ${C.greenTint}` : 'none',
    borderRadius: '12px', padding: '12px 14px', fontSize: '14.5px', color: C.ink,
    outline: 'none', fontFamily: 'inherit', transition: 'all .15s ease', boxSizing: 'border-box' as const,
  }
}

export default function AdminUsersPage() {
  const [users,               setUsers]               = useState<User[]>([])
  const [isLoading,           setIsLoading]           = useState(true)
  const [showModal,           setShowModal]           = useState(false)
  const [editingUser,         setEditingUser]         = useState<User | null>(null)
  const [form,                setForm]                = useState(emptyForm)
  const [showPassword,        setShowPassword]        = useState(false)
  const [roleFilter,          setRoleFilter]          = useState<UserRole | 'ALL'>('ALL')
  const [statusFilter,        setStatusFilter]        = useState<'all' | 'active' | 'inactive'>('all')
  const [confirmDeactivate,   setConfirmDeactivate]   = useState<string | null>(null)
  const [resetPasswordUser,   setResetPasswordUser]   = useState<User | null>(null)
  const [resetPasswordForm,   setResetPasswordForm]   = useState({ password: '', confirmPassword: '' })
  const [isSaving,            setIsSaving]            = useState(false)
  const [nameFocused,         setNameFocused]         = useState(false)
  const [emailFocused,        setEmailFocused]        = useState(false)
  const [pwFocused,           setPwFocused]           = useState(false)
  const [pw2Focused,          setPw2Focused]          = useState(false)

  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'ALL') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch { toast.error('Failed to load users') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { loadUsers() }, [roleFilter, statusFilter])

  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setShowPassword(false); setShowModal(true) }
  const openEdit   = (u: User) => { setEditingUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowPassword(false); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    if (!editingUser && !form.password.trim()) return
    setIsSaving(true)
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, ...(form.password.trim() && { password: form.password.trim() }) }
      const body   = editingUser ? { ...payload, id: editingUser.id } : payload
      const res    = await fetch('/api/admin/users', { method: editingUser ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      const saved = await res.json()
      if (editingUser) { setUsers(p => p.map(u => u.id === editingUser.id ? saved : u)); toast.success(`${form.name} updated`) }
      else             { setUsers(p => [saved, ...p]); toast.success(`${form.name} added as ${ROLE_CONFIG[form.role].label}`) }
      setShowModal(false); loadUsers()
    } catch (err: any) { toast.error(err.message || 'Failed to save') }
    finally { setIsSaving(false) }
  }

  const openResetPassword = (u: User) => {
    if (u.role === 'ADMIN') { toast.error('Admin passwords cannot be reset here'); return }
    setResetPasswordUser(u); setResetPasswordForm({ password: '', confirmPassword: '' }); setShowPassword(false)
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return
    if (!resetPasswordForm.password.trim()) return
    if (resetPasswordForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) { toast.error('Passwords do not match'); return }
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resetPasswordUser.id, password: resetPasswordForm.password.trim() }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      setResetPasswordUser(null); toast.success(`Password reset for ${resetPasswordUser.name}`)
    } catch (err: any) { toast.error(err.message || 'Failed to reset password') }
    finally { setIsSaving(false) }
  }

  const handleDeactivate = async (id: string) => {
    const user = users.find(u => u.id === id); if (!user) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !user.isActive }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      setUsers(p => p.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))
      setConfirmDeactivate(null)
      toast.success(user.isActive ? `${user.name} deactivated` : `${user.name} reactivated`)
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setIsSaving(false) }
  }

  if (isLoading) return <Loading />

  const roleCounts: Record<UserRole | 'ALL', number> = {
    ALL:     users.filter(u => u.isActive).length,
    ADMIN:   users.filter(u => u.role === 'ADMIN'   && u.isActive).length,
    CASHIER: users.filter(u => u.role === 'CASHIER' && u.isActive).length,
    WAITER:  users.filter(u => u.role === 'WAITER'  && u.isActive).length,
  }

  const avatarColors = [C.copper, C.green, C.copperDeep, C.greenDeep]

  return (
    <div style={{ padding: '28px 40px 60px', background: C.paper, minHeight: '100%' }}>

      {/* ── Heading ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '38px', fontWeight: 600, color: C.ink, margin: '0 0 4px', lineHeight: 1 }}>Team</h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
            {users.filter(u => u.isActive).length} active · {users.filter(u => !u.isActive).length} deactivated
          </p>
        </div>
        <button onClick={openCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: C.green, color: '#fff', fontSize: '13.5px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: C.shadowSm, fontFamily: 'inherit' }}
        >
          <Icons.Plus /> Add team member
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Role summary cards */}
        {(['ALL', 'ADMIN', 'CASHIER', 'WAITER'] as const).map(r => {
          const cfg    = r === 'ALL' ? null : ROLE_CONFIG[r as UserRole]
          const active = roleFilter === r
          return (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{
                padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s ease',
                background: active ? (cfg ? cfg.bg : C.greenTint) : C.card,
                border: `1px solid ${active ? (cfg ? cfg.fg : C.green) : C.line}`,
                boxShadow: active ? `0 0 0 1px ${cfg ? cfg.fg : C.green}` : C.shadowSm,
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: active ? (cfg ? cfg.fg : C.greenDeep) : C.muted, margin: '0 0 4px' }}>
                {r === 'ALL' ? 'All roles' : cfg!.label}
              </p>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: active ? (cfg ? cfg.fg : C.greenDeep) : C.ink, margin: 0, lineHeight: 1 }}>{roleCounts[r]}</p>
            </button>
          )
        })}

        <div style={{ width: '1px', height: '36px', background: C.line, margin: '0 4px' }} />

        {/* Status chips */}
        {(['all', 'active', 'inactive'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '8px 15px', borderRadius: '999px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, background: statusFilter === s ? (s === 'inactive' ? C.dangerTint : C.green) : C.card, color: statusFilter === s ? (s === 'inactive' ? C.danger : '#fff') : C.inkSoft, border: `1px solid ${statusFilter === s ? (s === 'inactive' ? C.danger : C.green) : C.line}`, transition: 'all .15s ease' }}
          >
            {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Deactivated'}
          </button>
        ))}
      </div>

      {/* ── Team cards grid ── */}
      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: '14px', fontStyle: 'italic' }}>No users found.</div>
      ) : (
        <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {users.map((user, idx) => {
            const cfg         = ROLE_CONFIG[user.role as UserRole]
            const isDeactivated = !user.isActive
            const avatarBg    = isDeactivated ? C.paper2 : avatarColors[idx % avatarColors.length]
            const initials    = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div key={user.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: '16px', padding: '20px', boxShadow: C.shadowSm, display: 'flex', flexDirection: 'column', opacity: isDeactivated ? 0.65 : 1, transition: 'all .15s ease' }}>

                {/* Head: avatar + name + role + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px', marginBottom: '10px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '999px', background: avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: C.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                      {isDeactivated && <span style={{ fontSize: '11px', fontWeight: 700, background: C.dangerTint, color: C.danger, padding: '2px 8px', borderRadius: '999px' }}>Deactivated</span>}
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, background: cfg.bg, color: cfg.fg, padding: '3px 9px', borderRadius: '999px' }}>{cfg.label}</span>
                  </div>
                </div>

                {/* Role description */}
                <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 14px', lineHeight: 1.4 }}>{cfg.description}</p>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', padding: '14px 0', borderTop: `1px solid ${C.lineSoft}`, borderBottom: `1px solid ${C.lineSoft}` }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.inkSoft }}>
                    <Icons.Mail />{user.email}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.muted }}>
                    <Icons.Clock />Joined {fmt(user.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(user)} disabled={user.role === 'ADMIN'}
                    style={{ flex: 1, padding: '9px', borderRadius: '8px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '13px', fontWeight: 700, color: C.greenDeep, cursor: user.role === 'ADMIN' ? 'not-allowed' : 'pointer', opacity: user.role === 'ADMIN' ? 0.4 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all .12s ease' }}
                    onMouseEnter={e => { if (user.role !== 'ADMIN') (e.currentTarget as HTMLElement).style.background = C.greenTint }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card2 }}
                  >
                    <Icons.Edit /> Edit
                  </button>
                  <button onClick={() => openResetPassword(user)} disabled={user.role === 'ADMIN'}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', background: C.card2, border: `1px solid ${C.line}`, color: C.muted, cursor: user.role === 'ADMIN' ? 'not-allowed' : 'pointer', opacity: user.role === 'ADMIN' ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s ease' }}
                    title="Reset password"
                    onMouseEnter={e => { if (user.role !== 'ADMIN') { (e.currentTarget as HTMLElement).style.color = C.copper; (e.currentTarget as HTMLElement).style.background = C.copperTint } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.background = C.card2 }}
                  >
                    <Icons.Key />
                  </button>
                  <button
                    onClick={() => user.isActive ? setConfirmDeactivate(user.id) : handleDeactivate(user.id)}
                    disabled={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length === 1 && user.isActive}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', background: C.card2, border: `1px solid ${C.line}`, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s ease' }}
                    title={user.isActive ? 'Deactivate' : 'Reactivate'}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = user.isActive ? C.danger : C.green; (e.currentTarget as HTMLElement).style.background = user.isActive ? C.dangerTint : C.greenTint }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.background = C.card2 }}
                  >
                    {user.isActive ? <Icons.Trash /> : <Icons.Check />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════ CREATE / EDIT MODAL ══════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{ width: '100%', maxWidth: '480px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.copperDeep, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>{editingUser ? 'Edit access' : 'New team member'}</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: 0 }}>{editingUser ? editingUser.name : 'Invite to Chez Keke'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Full name</label>
                <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)}
                  placeholder="e.g. Ama Mensah" className="placeholder:text-[#8C8170]" style={inp(nameFocused)} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                  placeholder="name@chezkeke.com" className="placeholder:text-[#8C8170]" style={inp(emailFocused)} />
              </div>

              {/* Password (create only) */}
              {!editingUser && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                      placeholder="Set a secure password" className="placeholder:text-[#8C8170]"
                      style={{ ...inp(pwFocused), paddingRight: '44px' }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Role */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '10px' }}>Role</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(['WAITER', 'CASHIER', 'ADMIN'] as UserRole[]).map(role => {
                    const cfg    = ROLE_CONFIG[role]
                    const active = form.role === role
                    return (
                      <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', background: active ? cfg.bg : C.card2, border: `1px solid ${active ? cfg.fg : C.line}`, boxShadow: active ? `0 0 0 1px ${cfg.fg}` : 'none', transition: 'all .15s ease' }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: active ? cfg.fg : C.line, flexShrink: 0, marginTop: '5px' }} />
                        <div>
                          <p style={{ fontSize: '14.5px', fontWeight: 700, color: active ? cfg.fg : C.ink, margin: '0 0 2px' }}>{cfg.label}</p>
                          <p style={{ fontSize: '12.5px', color: C.muted, margin: 0 }}>{cfg.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleSave} disabled={isSaving || !form.name.trim() || !form.email.trim() || (!editingUser && !form.password.trim())}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: isSaving ? C.paper2 : C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: isSaving ? C.muted : '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: isSaving ? 'none' : C.shadowSm }}>
                  {isSaving ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />Saving…</> : editingUser ? 'Save changes' : 'Send invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ RESET PASSWORD MODAL ══════════ */}
      {resetPasswordUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 105, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onMouseDown={e => e.target === e.currentTarget && setResetPasswordUser(null)}
        >
          <div style={{ width: '100%', maxWidth: '420px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.lineSoft}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.copperDeep, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>Security update</p>
                <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: '0 0 2px' }}>Reset password</h3>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>{resetPasswordUser.name}</p>
              </div>
              <button onClick={() => setResetPasswordUser(null)} style={{ width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={resetPasswordForm.password} onChange={e => setResetPasswordForm(p => ({ ...p, password: e.target.value }))}
                    onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                    placeholder="Set a secure password" className="placeholder:text-[#8C8170]"
                    style={{ ...inp(pwFocused), paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.inkSoft, marginBottom: '8px' }}>Confirm password</label>
                <input type={showPassword ? 'text' : 'password'} value={resetPasswordForm.confirmPassword} onChange={e => setResetPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  onFocus={() => setPw2Focused(true)} onBlur={() => setPw2Focused(false)}
                  placeholder="Retype password" className="placeholder:text-[#8C8170]" style={inp(pw2Focused)} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setResetPasswordUser(null)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleResetPassword} disabled={isSaving || !resetPasswordForm.password || !resetPasswordForm.confirmPassword}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: isSaving ? C.paper2 : C.green, border: 'none', fontSize: '14px', fontWeight: 700, color: isSaving ? C.muted : '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: isSaving ? 'none' : C.shadowSm }}>
                  {isSaving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ DEACTIVATE CONFIRM MODAL ══════════ */}
      {confirmDeactivate && (() => {
        const target = users.find(u => u.id === confirmDeactivate)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(40,30,14,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '380px', background: C.card, borderRadius: '24px', boxShadow: C.shadowLg, border: `1px solid ${C.line}`, padding: '32px 28px', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '999px', background: C.dangerTint, color: C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icons.Trash />
              </div>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '22px', fontWeight: 600, color: C.ink, margin: '0 0 8px' }}>Deactivate account?</h3>
              <p style={{ fontSize: '13.5px', color: C.muted, margin: '0 0 24px', lineHeight: 1.5 }}>
                <b style={{ color: C.ink }}>{target?.name}</b>'s login will be revoked immediately.<br />
                All orders, reports and history are preserved.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setConfirmDeactivate(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: C.card2, border: `1px solid ${C.line}`, fontSize: '14px', fontWeight: 700, color: C.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={() => handleDeactivate(confirmDeactivate)} disabled={isSaving}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: isSaving ? C.paper2 : C.danger, border: 'none', fontSize: '14px', fontWeight: 700, color: isSaving ? C.muted : '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {isSaving ? 'Processing…' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
