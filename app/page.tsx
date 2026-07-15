'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function RootPage() {
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation at 4.2 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 4200)

    // Redirect at 5 seconds
    const redirectTimer = setTimeout(() => {
      router.replace('/auth/login')
    }, 5000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(redirectTimer)
    }
  }, [router])

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${isExiting ? 'animate-splash-exit' : 'opacity-100'}`}
      style={{
        background: 'radial-gradient(700px 420px at 80% -5%, rgba(190,107,52,.22), transparent 60%), linear-gradient(160deg, #21604D, #163C30)',
      }}
    >

      {/* Decorative leaf orbs */}
      <div
        className="absolute rounded-full animate-brand-pulse pointer-events-none"
        style={{
          width: '500px', height: '500px', right: '-160px', top: '-140px',
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.12), transparent 60%)',
          filter: 'blur(4px)',
        }}
      />
      <div
        className="absolute rounded-full animate-brand-pulse pointer-events-none"
        style={{
          width: '360px', height: '360px', left: '-120px', bottom: '-100px',
          background: 'radial-gradient(circle at 50% 50%, rgba(190,107,52,.28), transparent 65%)',
          filter: 'blur(4px)',
          animationDelay: '2.5s',
        }}
      />

      {/* Branding container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 animate-splash-reveal">

        {/* Logo */}
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%', position: 'relative',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 20px 50px rgba(0,0,0,.35), 0 8px 20px rgba(0,0,0,.2)',
          border: '3px solid rgba(255,255,255,.45)',
        }}>
          {/* Glossy overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 60%)',
          }} />
          <Image src="/logo.png" alt="Chez Keke" fill className="object-cover" priority />
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: 'italic', fontSize: '72px', fontWeight: 600,
            margin: 0, lineHeight: 1, letterSpacing: '-0.01em',
            color: '#F3ECDD',
          }}>
            Chez{' '}
            <span style={{ color: '#E9C9A8' }}>Keke</span>
          </h1>

          <p
            className="animate-tagline"
            style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.55em',
              textTransform: 'uppercase', color: '#E9C9A8', opacity: 0,
            }}
          >
            The Spirit of Africa in Every Grain
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '200px', height: '2px', borderRadius: '999px',
          background: 'rgba(255,255,255,.14)', position: 'relative', overflow: 'hidden',
          marginTop: '8px',
        }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full animate-progress"
            style={{
              width: '100%',
              background: 'linear-gradient(to right, rgba(255,255,255,.25), rgba(233,201,168,.7), #BE6B34)',
            }}
          />
        </div>
      </div>

      {/* Footer note */}
      <div style={{
        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap',
      }}>
        <span
          className="animate-pulse"
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#BE6B34', flexShrink: 0, display: 'inline-block' }}
        />
        <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(243,236,221,.45)' }}>
          Chez Keke POS
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(243,236,221,.2)' }}>|</span>
        <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(243,236,221,.45)' }}>
          Professional v1.2.0
        </span>
      </div>

    </main>
  )
}
