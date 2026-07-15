'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ReceiptPreview from '../../../components/ReceiptPreview'
import { useSettingsStore } from '../../../../lib/store'
import { calculateFiscalTotals } from '../../../../utils/taxCalculator'
import Loading from '../../../components/Loading'

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const taxConfig = useSettingsStore(state => state.taxConfig)
  const fetchTaxConfig = useSettingsStore(state => state.fetchTaxConfig)

  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/cashier/orders/${orderId}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setOrder(data)
      } catch (err) {
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTaxConfig()
    fetchOrder()
  }, [orderId, fetchTaxConfig])

  // Re-apply fiscal totals from current settings so tax/discount/service
  // always reflect correctly even if stored DB values are zero.
  const orderWithTax = useMemo(() => {
    if (!order) return null
    const subtotal = order.items?.reduce((s: number, i: any) => s + i.lineTotal, 0) || order.subtotal || 0
    const fiscal = calculateFiscalTotals(subtotal, taxConfig)
    return {
      ...order,
      subtotal: fiscal.subtotal,
      vatAmount: fiscal.breakdown?.vat || 0,
      nhilAmount: fiscal.breakdown?.nhil || 0,
      getfundAmount: fiscal.breakdown?.getfund || 0,
      serviceAmount: fiscal.serviceAmount || 0,
      serviceRateSnapshot: taxConfig.serviceCharge,
      discountAmount: fiscal.discountAmount || 0,
      discountRateSnapshot: taxConfig.discountRate,
      total: fiscal.total,
    }
  }, [order, taxConfig])

  if (isLoading) return <Loading />

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-500 mb-8">We couldn't find the receipt for this order.</p>
        <Link
          href="/cashier"
          className="px-8 py-3 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:brightness-110 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="receipt-page-wrapper min-h-screen bg-gray-100 py-12 px-6 flex flex-col items-center">

      {/* Action Bar (Hidden on Print) */}
      <div className="w-full max-w-[320px] mb-8 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push('/cashier')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <span>←</span> Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-brand text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span>🖨️</span> Print
        </button>
      </div>

      {/* Receipt Container */}
      <div className="bg-white shadow-2xl rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 print:shadow-none print:rounded-none">
        <ReceiptPreview order={orderWithTax!} taxConfig={taxConfig} />
      </div>

      {/* Post-Print Helper */}
      <div className="mt-12 text-center print:hidden opacity-40">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
          Chez Keke POS System<br />
          Receipt ID: {order.order_number}
        </p>
      </div>

      <style jsx global>{`
        @page {
          margin: 4mm 5mm;
          size: 80mm auto;
        }
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .receipt-page-wrapper {
            min-height: unset !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
