import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || !role || !['ADMIN', 'CASHIER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    console.log('API: Fetching Order ID:', orderId)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: 'ACTIVE', deletedAt: null }
        },
        waiter: {
          select: { name: true }
        },
        cashier: {
          select: { name: true }
        },
        payments: {
          include: {
            cashier: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Map to frontend snake_case format
    const mappedOrder = {
      id: order.id,
      order_number: order.orderNumber,
      order_status: order.status.toLowerCase(),
      payment_status: order.paymentStatus.toLowerCase(),
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      tableNumber: order.tableNumber,
      notes: order.notes,
      total: Number(order.total),
      subtotal: Number(order.subtotal || 0),
      vatAmount: Number(order.vatAmount || 0),
      nhilAmount: Number(order.nhilAmount || 0),
      getfundAmount: Number(order.getfundAmount || 0),
      serviceAmount: Number(order.serviceAmount || 0),
      serviceRateSnapshot: Number(order.serviceRateSnapshot || 0),
      discountAmount: Number(order.discountAmount || 0),
      discountRateSnapshot: Number(order.discountRateSnapshot || 0),
      waiter_name: order.waiter?.name || 'Staff',
      cashier_name: order.cashier?.name || 'Staff',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      })),
      payments: order.payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method.toLowerCase(),
        reference: payment.reference,
        created_at: payment.createdAt.toISOString(),
        cashier_name: payment.cashier?.name || 'Staff'
      }))
    }

    return NextResponse.json(mappedOrder)
  } catch (error) {
    console.error('Fetch Order Error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}