'use client'

const Loading = () => {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px',
      background: '#F1E8D8',
    }}>
      {/* Spinner */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        border: '3px solid #E2D6C0',
        borderTopColor: '#1F5A47',
        animation: 'spin 0.7s linear infinite',
      }} />

      {/* Label */}
      <p style={{
        fontFamily: "'Newsreader', Georgia, serif",
        fontStyle: 'italic', fontSize: '18px', fontWeight: 500,
        color: '#8C8170', letterSpacing: '.01em',
      }}>
        Loading…
      </p>
    </div>
  )
}

export default Loading
