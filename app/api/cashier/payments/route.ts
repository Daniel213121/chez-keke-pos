import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { calculateFiscalTotals } from '../../../../utils/taxCalculator'

const PAYMENT_METHODS = new Set(['CASH', 'MOMO', 'CARD'])

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string; id?: string } | undefined)?.role
    const userId = (session?.user as { role?: string; id?: string } | undefined)?.id
    if (!session || !userId || !role || !['ADMIN', 'CASHIER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized operation. Active session required.' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, method, reference } = body as {
      orderId?: string
      method?: string
      reference?: string
    }

    if (!orderId || !method) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const normalizedMethod = method.toUpperCase()
    if (!PAYMENT_METHODS.has(normalizedMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const [order, settings] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            where: {
              status: 'ACTIVE',
              deletedAt: null
            },
            select: {
              quantity: true,
              unitPrice: true,
            }
          }
        }
      }),
      prisma.settings.findUnique({ where: { id: 'GLOBAL' } })
    ])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Order already settled' }, { status: 409 })
    }

    const subtotal = Number(
      order.items
        .reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0)
        .toFixed(2)
    )

    const fiscal = calculateFiscalTotals(subtotal, {
      isTaxEnabled: settings?.isTaxEnabled ?? true,
      isInclusive: settings?.isInclusive ?? false,
      vatRate: settings?.vatRate ?? 15,
      nhilRate: settings?.nhilRate ?? 2.5,
      getfundRate: settings?.getfundRate ?? 2.5,
      serviceCharge: settings?.serviceCharge ?? 5,
      discountRate: settings?.discountRate ?? 0,
    })

    // Process everything in a transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          cashierId: userId,
          amount: fiscal.total,
          method: normalizedMethod as 'CASH' | 'MOMO' | 'CARD',
          reference: reference || null
        }
      })

      // 2. Update the Order status and lock in the financial snapshots
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          cashierId: userId,
          // Fiscal lock values are now derived server-side from trusted data.
          subtotal: fiscal.subtotal,
          vatAmount: fiscal.breakdown?.vat || 0,
          nhilAmount: fiscal.breakdown?.nhil || 0,
          getfundAmount: fiscal.breakdown?.getfund || 0,
          serviceAmount: fiscal.serviceAmount || 0,
          serviceRateSnapshot: settings?.serviceCharge ?? 5,
          vatRateSnapshot: settings?.vatRate ?? 15,
          nhilRateSnapshot: settings?.nhilRate ?? 2.5,
          getfundRateSnapshot: settings?.getfundRate ?? 2.5,
          discountRateSnapshot: settings?.discountRate ?? 0,
          discountAmount: fiscal.discountAmount,
          total: fiscal.total
        }
      })

      return { payment, updatedOrder }
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Payment Processing Error:', error)
    return NextResponse.json({ error: 'Failed to record transaction and synchronize fiscal logs' }, { status: 500 })
  }
}
