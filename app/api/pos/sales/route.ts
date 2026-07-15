import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || !role || !['ADMIN', 'WAITER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const dateFilter = searchParams.get('dateFilter') || 'today'

    // Build date filter
    const now = new Date()
    let dateFrom: Date

    switch (dateFilter) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1)
        break
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Build where clause
    const where: any = {
      createdAt: {
        gte: dateFrom
      }
    }

    // Add search filter if provided (only by order number)
    if (search) {
      where.orderNumber = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map to frontend snake_case format
    const mappedOrders = orders.map(order => ({
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
      items_count: order.items.length, // Add items count for POS sales page
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
    }))

    return NextResponse.json(mappedOrders)
  } catch (error) {
    console.error('Fetch POS Sales Error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 })
  }
}