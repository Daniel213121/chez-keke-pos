'use client'

import { Order } from '../../types'
import { TaxConfig } from '../../lib/store'

type ReceiptPreviewProps = {
  order: Order
  taxConfig?: TaxConfig
}

export default function ReceiptPreview({ order, taxConfig }: ReceiptPreviewProps) {
  const fmt = (n: number) => `₵${Number(n).toFixed(2)}`
  const fmtNum = (n: number) => Number(n).toFixed(2)

  const date = new Date(order.created_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const showTax = taxConfig ? taxConfig.isTaxEnabled : true

  // ── Palette (Optimized for Thermal Printing) ──
  const ink     = '#000000'
  const muted   = '#000000'
  const rule    = '#000000'
  const bg      = '#ffffff'
  const green   = '#000000'

  const Rule = () => (
    <div style={{ borderTop: `1.5px dashed ${rule}`, margin: '10px 0' }} />
  )

  return (
    <div style={{
      background: bg, width: '300px', padding: '20px 20px 28px',
      color: ink, fontFamily: "'Hanken Grotesque', 'Courier New', monospace",
      fontWeight: 800, fontSize: '13.5px', lineHeight: 1.5, position: 'relative',
      boxShadow: '0 4px 20px rgba(54,42,20,.10)',
    }}>

      {/* PAID watermark */}
      {order.payment_status === 'paid' && (
        <div style={{
          position: 'absolute', top: '46%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-14deg)',
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic',
          fontSize: '100px', fontWeight: 900,
          color: 'rgba(0, 0, 0, 0.25)', // Darker, pure black semi-transparent for thermal dithering
          letterSpacing: '.05em', pointerEvents: 'none', zIndex: 10, // Higher z-index to overlap text
          whiteSpace: 'nowrap', userSelect: 'none',
        }}>
          PAID
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center' }}>
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Chez Keke"
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 8px' }}
          />
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: '26px', fontWeight: 800, color: green, lineHeight: 1 }}>
            Chez Keke
          </div>
          <div style={{ fontSize: '12.5px', color: muted, marginTop: '3px', fontWeight: 700 }}>
            at keke&rsquo;s place &middot; Restaurant
          </div>
          <div style={{ fontSize: '12.5px', color: muted, marginTop: '3px', fontWeight: 700 }}>
            Odumase&ndash;Krobo &middot; Opp. Odumase Station
          </div>
          <div style={{ fontSize: '12.5px', color: muted, marginTop: '2px', fontWeight: 700 }}>
            Tel / MoMo&nbsp;&nbsp;{order.store_phone || '0242 691 458'}
          </div>
        </div>

        <Rule />

        {/* ── Meta ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { label: 'Receipt',   value: order.order_number },
            { label: 'Date',      value: date },
            { label: 'Table',     value: order.tableNumber || 'Takeaway' },
            { label: 'Served by', value: order.waiter_name || order.cashier_name },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span style={{ color: muted }}>{row.label}</span>
              <b style={{ fontWeight: 700 }}>{row.value}</b>
            </div>
          ))}
        </div>

        <Rule />

        {/* ── Items ── */}
        <div>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 26px 44px 50px', gap: '4px', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '.04em', color: muted, fontWeight: 800, paddingBottom: '6px' }}>
            <span>Item</span>
            <span style={{ textAlign: 'right' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
          </div>

          {/* Rows */}
          {order.items?.map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 26px 44px 50px', gap: '4px', padding: '2px 0', alignItems: 'start', fontWeight: 800 }}>
              <span style={{ lineHeight: 1.25 }}>{item.name}</span>
              <span style={{ textAlign: 'right' }}>{item.quantity}</span>
              <span style={{ textAlign: 'right' }}>{fmtNum(item.unitPrice)}</span>
              <span style={{ textAlign: 'right' }}>{fmtNum(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <Rule />

        {/* ── Totals ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: muted }}>Subtotal</span>
            <span>{fmt(order.subtotal)}</span>
          </div>

          {/* Discount */}
          {(order.discountAmount ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: muted }}>Discount ({order.discountRateSnapshot || 0}%)</span>
              <span style={{ fontWeight: 700, color: '#2a7a4a' }}>-{fmt(order.discountAmount ?? 0)}</span>
            </div>
          )}

          {/* Tax lines */}
          {showTax && (order.vatAmount ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: muted }}>VAT ({taxConfig?.vatRate || 15}%)</span>
              <span>{fmt(order.vatAmount)}</span>
            </div>
          )}
          {showTax && (order.nhilAmount ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: muted }}>NHIL ({taxConfig?.nhilRate || 2.5}%)</span>
              <span>{fmt(order.nhilAmount)}</span>
            </div>
          )}
          {showTax && (order.getfundAmount ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', paddingBottom: '4px', borderBottom: `1px dashed ${rule}` }}>
              <span style={{ color: muted }}>GETFund ({taxConfig?.getfundRate || 2.5}%)</span>
              <span>{fmt(order.getfundAmount)}</span>
            </div>
          )}

          {/* Service charge */}
          {(order.serviceAmount ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: muted }}>Service charge ({order.serviceRateSnapshot || 0}%)</span>
              <span>{fmt(order.serviceAmount ?? 0)}</span>
            </div>
          )}

          {/* Grand total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px', paddingTop: '8px', borderTop: `1.5px solid ${ink}` }}>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '19px', fontWeight: 800, color: green }}>Total (GHS)</span>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '19px', fontWeight: 800, color: green }}>{fmt(order.total)}</span>
          </div>

          {/* Payment reference */}
          {order.reference_number && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: muted, fontStyle: 'italic', marginTop: '4px' }}>
              <span>Ref:</span><span>{order.reference_number}</span>
            </div>
          )}
        </div>

        <Rule />

        {/* ── Thanks ── */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '12.5px', margin: '4px 0 10px' }}>
          Medaase! Thank you for eating with us.
        </div>

        {/* ── Wi-Fi ── */}
        <div style={{
          textAlign: 'center', border: `1.5px dashed ${rule}`, borderRadius: '8px',
          padding: '10px', background: 'transparent', marginBottom: '12px',
        }}>
          <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '12.5px', color: '#000000', marginBottom: '4px' }}>
            Free Wi-Fi
          </div>
          <div style={{ fontSize: '12.5px', color: muted, fontWeight: 800 }}>
            Network <b style={{ color: ink, fontWeight: 900 }}>chezkeke.network</b>
          </div>
          <div style={{ fontSize: '12.5px', color: muted, fontWeight: 800 }}>
            Password is your order number
          </div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '20px', fontWeight: 900, color: ink, letterSpacing: '.08em', marginTop: '4px' }}>
            {order.order_number}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', fontSize: '10.5px', color: muted, marginBottom: '10px' }}>
          Come back soon &middot; Chez Keke Restaurant
        </div>

        {/* ── Developer note ── */}
        <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: `1px dashed ${rule}`, fontSize: '10px', color: muted, lineHeight: 1.5 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Need a POS System like this?</p>
          <p style={{ margin: 0 }}>Call: 0557618757</p>
          <p style={{ margin: 0 }}>Daniel Sackitey &mdash; Software Developer</p>
        </div>
      </div>

      {/* ── Paper teeth ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '-7px', height: '8px',
        background: `
          linear-gradient(135deg, ${bg} 25%, transparent 25%) -1px 0 / 14px 14px,
          linear-gradient(225deg, ${bg} 25%, transparent 25%) -1px 0 / 14px 14px
        `,
      }} className="print:hidden" />

    </div>
  )
}
