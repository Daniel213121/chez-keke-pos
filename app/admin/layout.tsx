'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const NavIcons = {
  Dashboard: () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
  Menu:      () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14v16l-3-2-4 2-4-2-3 2z"/><path d="M9 9h6M9 13h4"/></svg>,
  Orders:    () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>,
  Expenses:  () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>,
  Reports:   () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  Users:     () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 20a5.5 5.5 0 0 0-3-4.9"/></svg>,
  Settings:  () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2.5 12H5M19 12h2.5M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8"/></svg>,
  Logout:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>,
}

const C = {
  paper:     '#F1E8D8',
  card:      '#FBF6EC',
  card2:     '#FFFDF8',
  ink:       '#2C2820',
  inkSoft:   '#5A5246',
  muted:     '#8C8170',
  line:      '#E2D6C0',
  lineSoft:  '#ECE2D0',
  green:     '#1F5A47',
  greenDeep: '#164035',
  greenTint: '#E4EDE6',
  copper:    '#BE6B34',
  danger:    '#B23B2E',
  dangerTint:'#F6E3DF',
  shadowSm:  '0 1px 3px rgba(54,42,20,.06), 0 1px 2px rgba(54,42,20,.04)',
}

const navItems = [
  { name: 'Dashboard', href: '/admin',          icon: <NavIcons.Dashboard /> },
  { name: 'Menu',      href: '/admin/menu',      icon: <NavIcons.Menu />      },
  { name: 'Orders',    href: '/admin/orders',    icon: <NavIcons.Orders />    },
  { name: 'Expenses',  href: '/admin/expenses',  icon: <NavIcons.Expenses />  },
  { name: 'Reports',   href: '/admin/reports',   icon: <NavIcons.Reports />   },
  { name: 'Users',     href: '/admin/users',     icon: <NavIcons.Users />     },
  { name: 'Settings',  href: '/admin/settings',  icon: <NavIcons.Settings />  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const { data: session } = useSession()

  const userName    = (session?.user as any)?.name || 'Admin'
  const userRole    = (session?.user as any)?.role || 'ADMIN'
  const initials    = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#F1E8D8', overflow: 'hidden' }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside style={{
        width: '248px', flexShrink: 0, background: C.card,
        borderRight: `1px solid ${C.line}`,
        display: 'flex', flexDirection: 'column', padding: '22px 16px',
        boxShadow: C.shadowSm,
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px 22px', borderBottom: `1px solid ${C.lineSoft}`, marginBottom: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: C.shadowSm }}>
            <Image src="/logo.png" alt="Chez Keke" fill className="object-cover" />
          </div>
          <div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: '22px', fontWeight: 600, color: C.greenDeep, lineHeight: 1, whiteSpace: 'nowrap' }}>
              Chez Keke
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginTop: '4px' }}>
              Admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '13px',
                  padding: '11px 14px', borderRadius: '12px',
                  fontSize: '14.5px', fontWeight: 600, textDecoration: 'none',
                  background: active ? C.greenTint : 'transparent',
                  color: active ? C.greenDeep : C.inkSoft,
                  transition: 'all .15s ease',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = '#EBE0CC'; (e.currentTarget as HTMLElement).style.color = C.ink } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.inkSoft } }}
              >
                <span style={{ color: active ? C.green : C.muted, display: 'inline-flex', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User + sign out */}
        <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px 14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '999px', background: C.copper, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
              <strong style={{ fontSize: '14px', color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</strong>
              <span style={{ fontSize: '12px', color: C.muted, textTransform: 'capitalize' }}>{userRole.toLowerCase()}</span>
            </div>
          </div>
          <button
            onClick={async () => { await signOut({ redirect: false }); window.location.replace('/auth/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 14px', borderRadius: '12px', color: C.inkSoft, fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none', transition: 'all .15s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.dangerTint; (e.currentTarget as HTMLElement).style.color = C.danger }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.inkSoft }}
          >
            <NavIcons.Logout /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </main>

    </div>
  )
}
