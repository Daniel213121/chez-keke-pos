import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || !role || !['ADMIN', 'WAITER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [items, categories, tables] = await Promise.all([
      prisma.menuItem.findMany({
        where: {
          isActive: true,
          category: { isActive: true }   // hide items whose category is deactivated
        },
        include: { category: true },
        orderBy: { name: 'asc' }
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.table.findMany({
        where: { isActive: true },
        include: {
          orders: {
            where: {
              paymentStatus: 'UNPAID',
              status: { in: ['OPEN', 'AWAITING_PAYMENT'] },
              deletedAt: null
            },
            include: {
              items: {
                where: { status: 'ACTIVE', deletedAt: null },
                orderBy: { createdAt: 'asc' }
              },
              tickets: {
                where: { deletedAt: null },
                orderBy: { ticketNumber: 'asc' }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })
    ])

    // Normalize Decimal fields → JS numbers so the frontend never receives Prisma Decimal strings
    const normalizedItems = items.map(item => ({
      ...item,
      basePrice: item.basePrice != null ? Number(item.basePrice) : null,
    }))

    const normalizedTables = tables.map(table => ({
      ...table,
      orders: table.orders.map(order => ({
        ...order,
        total:    Number(order.total),
        subtotal: Number(order.subtotal),
        items: order.items.map(oi => ({
          ...oi,
          unitPrice: Number(oi.unitPrice),
          lineTotal: Number(oi.lineTotal),
        })),
      })),
    }))

    return NextResponse.json({ items: normalizedItems, categories, tables: normalizedTables })
  } catch (error) {
    console.error('POS Menu Fetch Error:', error)
    return NextResponse.json({ error: 'Failed to process infrastructure data' }, { status: 500 })
  }
}
