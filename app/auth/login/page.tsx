'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const AuthIcons = {
  Email: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.003 5.884 10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884Z"></path><path d="m18 8.118-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118Z"></path></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 1.55-.12"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 5"></polyline></svg>,
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Import missing signIn from next-auth/react
      const { signIn } = await import("next-auth/react");

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
        return;
      }

      toast.success(
        <div className="font-sans">
          <p className="font-bold">Signed In Successfully</p>
          <p className="text-xs text-gray-500">Welcome to Chez Keke Dashboard</p>
        </div>
      )

      // Get the session to determine where to redirect based on role
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const role = (session?.user as any)?.role;

      if (role === 'ADMIN') {
        router.push('/admin');
      } else if (role === 'WAITER') {
        router.push('/pos');
      } else if (role === 'CASHIER') {
        router.push('/cashier');
      } else {
        router.push('/pos'); // Fallback
      }

      router.refresh();

    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false)
    }
  }

  const fieldWrap = (focused: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#FFFDF8',
    border: `1px solid ${focused ? '#2A6F58' : '#E2D6C0'}`,
    boxShadow: focused ? '0 0 0 4px #E4EDE6' : 'none',
    borderRadius: '14px',
    padding: '0 16px',
    transition: 'all .15s ease',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F1E8D8' }}>

      {/* ── LEFT PANEL — brand ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:flex-col lg:justify-center"
        style={{
          width: '46%',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(700px 420px at 80% -5%, rgba(190,107,52,.20), transparent 60%), linear-gradient(160deg, #21604D, #163C30)',
          color: '#F3ECDD',
          padding: '64px',
        }}
      >
        {/* Decorative leaves */}
        <div style={{
          position: 'absolute', borderRadius: '50%', filter: 'blur(2px)', opacity: 0.14,
          background: 'radial-gradient(circle at 35% 30%, #fff, transparent 60%)',
          width: '420px', height: '420px', right: '-140px', top: '-120px', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', borderRadius: '50%', filter: 'blur(2px)', opacity: 0.18,
          background: 'radial-gradient(circle at 50% 50%, #BE6B34, transparent 65%)',
          width: '320px', height: '320px', left: '-120px', bottom: '-100px', pointerEvents: 'none',
        }} />

        {/* Brand content */}
        <div style={{ maxWidth: '380px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%', position: 'relative',
            overflow: 'hidden', marginBottom: '28px', flexShrink: 0,
            boxShadow: '0 16px 40px rgba(0,0,0,.3)',
            border: '3px solid rgba(255,255,255,.5)',
          }}>
            <Image src="/logo.png" alt="Chez Keke" fill className="object-cover" priority />
          </div>

          {/* Wordmark */}
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: 'italic', fontSize: '52px', fontWeight: 600,
            margin: 0, lineHeight: 1, color: '#F3ECDD',
          }}>
            Chez Keke
          </h1>

          {/* Tag */}
          <p style={{ fontSize: '13px', letterSpacing: '.04em', margin: '12px 0 0', color: '#E9C9A8' }}>
            at keke&rsquo;s place &middot; Restaurant
          </p>

          {/* Welcome copy */}
          <p style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '22px', lineHeight: 1.45, margin: '40px 0 0',
            color: 'rgba(243,236,221,.92)',
          }}>
            Good food, good people. Sign in and let&rsquo;s get the kitchen moving.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute', left: '64px', right: '64px', bottom: '40px',
          display: 'flex', justifyContent: 'space-between',
          fontSize: '12px', color: 'rgba(243,236,221,.5)',
        }}>
          <span>Odumase&ndash;Krobo</span>
          <span>&copy; {new Date().getFullYear()} Chez Keke</span>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile brand — shown below lg */}
          <div className="flex items-center gap-3 mb-7 lg:hidden">
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/logo.png" alt="" fill className="object-cover" />
            </div>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: '24px', fontWeight: 600, color: '#164035' }}>
              Chez Keke
            </span>
          </div>

          {/* Eyebrow */}
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A4F1E', margin: '0 0 4px' }}>
            Staff sign in
          </p>

          {/* Heading */}
          <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '40px', fontWeight: 600, color: '#2C2820', margin: '2px 0 6px', lineHeight: 1.05 }}>
            Welcome back
          </h2>

          {/* Subtitle */}
          <p style={{ color: '#8C8170', fontSize: '15px', margin: '0 0 32px' }}>
            Sign in to keep service running smoothly.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#5A5246', marginBottom: '10px' }}>
                Email
              </label>
              <div style={fieldWrap(emailFocused)}>
                <span style={{ color: '#8C8170', display: 'inline-flex', flexShrink: 0 }}>
                  <AuthIcons.Email />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  placeholder="you@chezkeke.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="placeholder:text-[#8C8170]"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'none',
                    padding: '15px 0', fontSize: '15.5px', color: '#2C2820', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#5A5246', marginBottom: '10px' }}>
                Password
              </label>
              <div style={fieldWrap(passwordFocused)}>
                <span style={{ color: '#8C8170', display: 'inline-flex', flexShrink: 0 }}>
                  <AuthIcons.Lock />
                </span>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="placeholder:text-[#8C8170]"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'none',
                    padding: '15px 0', fontSize: '15.5px', color: '#2C2820', fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{ color: '#8C8170', display: 'inline-flex', padding: '4px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#2C2820'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#8C8170'}
                >
                  {showPw ? <AuthIcons.EyeOff /> : <AuthIcons.Eye />}
                </button>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <p style={{ margin: '-4px 0 0', color: '#B23B2E', fontSize: '13.5px', fontWeight: 600 }}>
                {error}
              </p>
            )}

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0 6px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#5A5246', fontWeight: 500, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                  border: `1.5px solid ${remember ? '#1F5A47' : '#E2D6C0'}`,
                  background: remember ? '#1F5A47' : '#FFFDF8',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s ease',
                }}>
                  {remember && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  )}
                </span>
                Remember this device
              </label>

              <button
                type="button"
                onClick={() => toast.error("Please contact the admin to reset your password.")}
                style={{ fontSize: '13.5px', fontWeight: 600, color: '#9A4F1E', whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px', width: '100%', padding: '16px', borderRadius: '14px',
                background: loading ? '#EBE0CC' : '#1F5A47',
                color: loading ? '#8C8170' : '#fff',
                fontSize: '16px', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(31,90,71,.25), 0 2px 5px rgba(31,90,71,.15)',
                transition: 'all .15s ease',
                cursor: loading ? 'default' : 'pointer',
                border: 'none', opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                <>Sign in <AuthIcons.ArrowRight /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#8C8170', marginTop: '32px', letterSpacing: '.03em' }}>
            &copy; {new Date().getFullYear()} Chez Keke POS &middot; All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
