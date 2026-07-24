import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || !role || !['ADMIN', 'CASHIER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'UNPAID',
        status: { not: 'CANCELLED' }
      },
      include: {
        items: {
          where: { status: 'ACTIVE', deletedAt: null }
        },
        waiter: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Map to frontend snake_case format
    const mappedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.orderNumber,
      order_status: order.status.toLowerCase(),
      payment_status: order.paymentStatus.toLowerCase(),
      created_at: order.createdAt.toISOString(),
      tableNumber: order.tableNumber,
      notes: order.notes,
      total: Number(order.total),
      cashier_name: order.waiter?.name || 'Staff',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
    }))

    return NextResponse.json(mappedOrders)
  } catch (error) {
    console.error('Fetch Cashier Orders Error:', error)
    return NextResponse.json({ error: 'Failed to synchronize live terminal feed' }, { status: 500 })
  }
}
