import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const date = searchParams.get('date') || ''

    // Build where clause
    const where: any = {}

    // Add search filter if provided (by order number or waiter name)
    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          waiter: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Add status filter if not 'all'
    if (status !== 'all') {
      if (status.toLowerCase() === 'cancelled') {
        where.status = 'CANCELLED'
      } else {
        where.paymentStatus = status.toUpperCase()
      }
    }

    // Add date filter if provided
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    // Fetch service charge setting
    const settings = await prisma.settings.findUnique({
      where: { id: 'GLOBAL' }
    })
    const serviceChargeRate = settings?.serviceCharge || 5.0

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

    // Map to frontend format and calculate additional fields
    const mappedOrders = orders.map(order => {
      const subtotal = order.subtotal || 0
      const vatAmount = order.vatAmount || 0
      const nhilAmount = order.nhilAmount || 0
      const getfundAmount = order.getfundAmount || 0
      const serviceAmount = order.serviceAmount || 0

      return {
        id: order.id,
        order_number: order.orderNumber,
        order_status: order.status.toLowerCase(),
        payment_status: order.paymentStatus.toLowerCase(),
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
        tableNumber: order.tableNumber,
        notes: order.notes,
        total: Number(order.total),
        subtotal: Number(subtotal),
        vatAmount: Number(vatAmount),
        nhilAmount: Number(nhilAmount),
        getfundAmount: Number(getfundAmount),
        serviceAmount: Number(serviceAmount),
        // Include the rate snapshots for display
        vatRate: Number(order.vatRateSnapshot || 15.0),
        nhilRate: Number(order.nhilRateSnapshot || 2.5),
        getfundRate: Number(order.getfundRateSnapshot || 2.5),
        serviceRate: Number(order.serviceRateSnapshot || 5.0),
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
    })

    // Calculate revenue stats for filtered orders
    const revenue = mappedOrders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + Number(o.total), 0)

    return NextResponse.json({
      orders: mappedOrders,
      stats: {
        revenue,
        totalOrders: mappedOrders.length,
        paidOrders: mappedOrders.filter(o => o.payment_status === 'paid').length,
        pendingOrders: mappedOrders.filter(o => o.payment_status === 'pending').length
      }
    })
  } catch (error) {
    console.error('Fetch Admin Orders Error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}