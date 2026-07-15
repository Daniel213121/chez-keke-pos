import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'

type IncomingCartItem = {
  id?: string
  menuItemId?: string
  quantity?: number
  price?: number
}

const roundMoney = (value: number) => Number(value.toFixed(2))

const deriveOrderStatus = (orderStatus: string, tickets: any[]) => {
  if (orderStatus === 'CANCELLED') return 'cancelled'
  if (orderStatus === 'PAID') return 'served'
  
  if (tickets.length === 0) {
    if (orderStatus === 'OPEN') return 'pending'
    if (orderStatus === 'AWAITING_PAYMENT') return 'ready'
    return orderStatus.toLowerCase()
  }
  
  if (tickets.some(t => t.status === 'PENDING')) return 'pending'
  if (tickets.some(t => t.status === 'COOKING')) return 'cooking'
  if (tickets.some(t => t.status === 'READY')) return 'ready'
  if (tickets.every(t => t.status === 'SERVED')) return 'served'
  
  return 'pending'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || !role || !['ADMIN', 'WAITER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        deletedAt: null
      },
      include: {
        items: {
          where: { status: 'ACTIVE', deletedAt: null }
        },
        tickets: {
          where: { deletedAt: null },
          orderBy: { ticketNumber: 'asc' }
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
      order_status: deriveOrderStatus(order.status, order.tickets),
      payment_status: order.paymentStatus.toLowerCase(),
      created_at: order.createdAt.toISOString(),
      total: Number(order.total),
      notes: order.notes,
      cashier_name: order.waiter?.name || 'Staff',
      tableNumber: order.tableNumber,
      guestCount: order.guestCount,
      orderType: order.orderType.toLowerCase(),
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        status: item.status.toLowerCase()
      })),
      tickets: order.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status.toLowerCase(),
        printStatus: ticket.printStatus.toLowerCase(),
        notes: ticket.notes,
        createdAt: ticket.createdAt.toISOString()
      }))
    }))

    return NextResponse.json(mappedOrders)
  } catch (error) {
    console.error('Fetch Orders Error:', error)
    return NextResponse.json({ error: 'Failed to synchronize live terminal feed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string; id?: string } | undefined)?.role
    const userId = (session?.user as { role?: string; id?: string } | undefined)?.id
    if (!session || !userId || !role || !['ADMIN', 'WAITER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized operation. Active session required.' }, { status: 401 })
    }

    const body = await req.json()
    const { cart, tableId, tableNumber, notes, guestCount, orderType } = body as {
      cart?: IncomingCartItem[]
      tableId?: string | null
      tableNumber?: string | null
      notes?: string | null
      guestCount?: number | null
      orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | null
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cannot dispatch an empty order' }, { status: 400 })
    }

    const normalizedCart = cart.map((item) => ({
      menuItemId: item.menuItemId || item.id || '',
      quantity: Number(item.quantity),
      clientPrice: item.price !== undefined ? Number(item.price) : undefined,
    }))

    const invalidEntry = normalizedCart.find((item) => !item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0)
    if (invalidEntry) {
      return NextResponse.json({ error: 'Invalid cart payload. Each item must include menuItemId and positive integer quantity.' }, { status: 400 })
    }

    const menuItemIds = [...new Set(normalizedCart.map((item) => item.menuItemId))]
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: {
        id: true,
        name: true,
        basePrice: true,
        isActive: true,
        category: { select: { isActive: true } }
      }
    })

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ error: 'One or more menu items are invalid.' }, { status: 400 })
    }

    const menuMap = new Map(menuItems.map((item) => [item.id, item]))
    let subtotal = 0
    const secureOrderItems: Array<{
      menuItemId: string
      name: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }> = []

    for (const cartItem of normalizedCart) {
      const menuItem = menuMap.get(cartItem.menuItemId)
      if (!menuItem || !menuItem.isActive || !menuItem.category?.isActive) {
        return NextResponse.json({ error: 'Cart contains inactive or unavailable menu items.' }, { status: 400 })
      }

      const basePriceNum = menuItem.basePrice ? Number(menuItem.basePrice) : null
      const hasFixedPrice = typeof basePriceNum === 'number' && Number.isFinite(basePriceNum) && basePriceNum > 0
      const unitPrice = hasFixedPrice
        ? basePriceNum
        : cartItem.clientPrice

      if (!unitPrice || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        return NextResponse.json({ error: `Missing valid price for open-priced item: ${menuItem.name}` }, { status: 400 })
      }

      const lineTotal = roundMoney(unitPrice * cartItem.quantity)
      subtotal += lineTotal

      secureOrderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: cartItem.quantity,
        unitPrice: roundMoney(unitPrice),
        lineTotal,
      })
    }

    subtotal = roundMoney(subtotal)
    const total = subtotal

    // Check if there is an active session on the selected table
    let activeOrder = null
    const effectiveOrderType = orderType || 'DINE_IN'

    if (tableId && effectiveOrderType === 'DINE_IN') {
      activeOrder = await prisma.order.findFirst({
        where: {
          tableId,
          paymentStatus: 'UNPAID',
          status: { in: ['OPEN', 'AWAITING_PAYMENT'] },
          deletedAt: null
        }
      })
    }

    // ── CASE 1: APPENDING TO AN EXISTING SESSION ─────────────────────────
    if (activeOrder) {
      const result = await prisma.$transaction(async (tx) => {
        // Concurrency Lock: Lock the parent Order row
        await tx.$executeRawUnsafe(`SELECT id FROM "Order" WHERE id = '${activeOrder.id}' FOR UPDATE`)

        // Get the next sequence number for the ticket
        const maxTicket = await tx.orderTicket.aggregate({
          where: { orderId: activeOrder.id },
          _max: { ticketNumber: true }
        })
        const nextTicketNumber = (maxTicket._max.ticketNumber || 0) + 1

        // Create the kitchen ticket
        const ticket = await tx.orderTicket.create({
          data: {
            orderId: activeOrder.id,
            ticketNumber: nextTicketNumber,
            status: 'PENDING',
            printStatus: 'PENDING',
            notes: notes || null
          }
        })

        // Create new distinct OrderItems linked to this ticket (no item quantity merging)
        await tx.orderItem.createMany({
          data: secureOrderItems.map((item) => ({
            orderId: activeOrder.id,
            ticketId: ticket.id,
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            lineTotal: new Prisma.Decimal(item.lineTotal),
            status: 'ACTIVE'
          }))
        })

        // Query all active items to recalculate total
        const allItems = await tx.orderItem.findMany({
          where: { orderId: activeOrder.id, status: 'ACTIVE', deletedAt: null }
        })

        const newSubtotal = allItems.reduce((sum, item) => sum + Number(item.lineTotal), 0)

        // Update the order totals and ensure it is OPEN
        const updated = await tx.order.update({
          where: { id: activeOrder.id },
          data: {
            subtotal: new Prisma.Decimal(newSubtotal),
            total: new Prisma.Decimal(newSubtotal),
            status: 'OPEN'
          }
        })

        return updated
      })

      return NextResponse.json(result)
    }

    // ── CASE 2: CREATING A NEW SESSION ───────────────────────────────────
    let order = null
    let orderNumber = ''
    let attempts = 0

    while (!order && attempts < 5) {
      orderNumber = `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      
      try {
        order = await prisma.$transaction(async (tx) => {
          const createdOrder = await tx.order.create({
            data: {
              orderNumber,
              orderType: effectiveOrderType,
              tableId: tableId || null,
              tableNumber: tableNumber || null,
              notes: notes || null,
              guestCount: guestCount || null,
              subtotal: new Prisma.Decimal(subtotal),
              total: new Prisma.Decimal(total),
              status: 'OPEN',
              waiterId: userId
            }
          })

          const ticket = await tx.orderTicket.create({
            data: {
              orderId: createdOrder.id,
              ticketNumber: 1,
              status: 'PENDING',
              printStatus: 'PENDING',
              notes: notes || null
            }
          })

          await tx.orderItem.createMany({
            data: secureOrderItems.map((item) => ({
              orderId: createdOrder.id,
              ticketId: ticket.id,
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              lineTotal: new Prisma.Decimal(item.lineTotal),
              status: 'ACTIVE'
            }))
          })

          return createdOrder
        })
      } catch (err: any) {
        if (err.code === 'P2002') {
          attempts++
          continue
        }
        throw err
      }
    }

    if (!order) {
      throw new Error('System exhausted unique tracking identifiers. Please try again.')
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order Dispatch Error:', error)
    return NextResponse.json({ error: 'Failed to dispatch order to system backbone' }, { status: 500 })
  }
}
