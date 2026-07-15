import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { Prisma } from '@prisma/client'

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string; id?: string } | undefined)?.role
    const userId = (session?.user as { role?: string; id?: string } | undefined)?.id
    if (!session || !userId || !role || !['ADMIN', 'WAITER', 'CASHIER'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body

    // ── ACTION 1: REOPEN ORDER SESSION ─────────────────────────────────
    if (action === 'REOPEN') {
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      if (order.paymentStatus === 'PAID') return NextResponse.json({ error: 'Cannot reopen a settled order' }, { status: 400 })

      const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: { status: 'OPEN' }
        })
        await tx.auditLog.create({
          data: {
            userId,
            orderId: id,
            action: 'REOPEN_BILL',
            details: `Order session ${order.orderNumber} reopened by ${session.user?.name || 'Staff'}`
          }
        })
        return o
      })
      return NextResponse.json(updated)
    }

    // ── ACTION 2: TRANSFER TABLE SESSION ───────────────────────────────
    if (action === 'TRANSFER') {
      const { targetTableId } = body
      if (!targetTableId) return NextResponse.json({ error: 'Target table is required' }, { status: 400 })

      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

      const [targetTable, activeTargetSession] = await Promise.all([
        prisma.table.findUnique({ where: { id: targetTableId } }),
        prisma.order.findFirst({
          where: {
            tableId: targetTableId,
            paymentStatus: 'UNPAID',
            status: { in: ['OPEN', 'AWAITING_PAYMENT'] },
            deletedAt: null
          }
        })
      ])

      if (!targetTable) return NextResponse.json({ error: 'Target table not found' }, { status: 404 })
      if (activeTargetSession) return NextResponse.json({ error: 'Target table is already occupied' }, { status: 400 })

      const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: {
            tableId: targetTableId,
            tableNumber: targetTable.name
          }
        })
        await tx.auditLog.create({
          data: {
            userId,
            orderId: id,
            action: 'TRANSFER_TABLE',
            details: `Order ${order.orderNumber} transferred from ${order.tableNumber || 'none'} to ${targetTable.name}`
          }
        })
        return o
      })
      return NextResponse.json(updated)
    }

    // ── ACTION 3: MERGE TABLE SESSIONS ─────────────────────────────────
    if (action === 'MERGE') {
      const { sourceOrderId } = body
      if (!sourceOrderId) return NextResponse.json({ error: 'Source order is required' }, { status: 400 })
      if (sourceOrderId === id) return NextResponse.json({ error: 'Cannot merge an order into itself' }, { status: 400 })

      const [sourceOrder, targetOrder] = await Promise.all([
        prisma.order.findUnique({ where: { id: sourceOrderId }, include: { tickets: true } }),
        prisma.order.findUnique({ where: { id }, include: { tickets: true } })
      ])

      if (!sourceOrder || sourceOrder.deletedAt) return NextResponse.json({ error: 'Source order not found' }, { status: 404 })
      if (!targetOrder || targetOrder.deletedAt) return NextResponse.json({ error: 'Target order not found' }, { status: 404 })

      if (sourceOrder.paymentStatus === 'PAID' || targetOrder.paymentStatus === 'PAID') {
        return NextResponse.json({ error: 'Cannot merge settled orders' }, { status: 400 })
      }

      const merged = await prisma.$transaction(async (tx) => {
        // Concurrency lock
        await tx.$executeRawUnsafe(`SELECT id FROM "Order" WHERE id IN ('${id}', '${sourceOrderId}') FOR UPDATE`)

        // Get max ticket number from target order
        const maxTicket = await tx.orderTicket.aggregate({
          where: { orderId: id },
          _max: { ticketNumber: true }
        })
        let currentTicketNum = maxTicket._max.ticketNumber || 0

        // Migrate all tickets from source to target, updating ticket numbers to avoid duplicates
        for (const ticket of sourceOrder.tickets) {
          currentTicketNum += 1
          await tx.orderTicket.update({
            where: { id: ticket.id },
            data: {
              orderId: id,
              ticketNumber: currentTicketNum
            }
          })
        }

        // Migrate all items from source to target
        await tx.orderItem.updateMany({
          where: { orderId: sourceOrderId },
          data: { orderId: id }
        })

        // Soft-delete source order
        await tx.order.update({
          where: { id: sourceOrderId },
          data: { deletedAt: new Date(), status: 'CANCELLED' }
        })

        // Recalculate target order totals
        const allTargetItems = await tx.orderItem.findMany({
          where: { orderId: id, status: 'ACTIVE', deletedAt: null }
        })
        const newSubtotal = allTargetItems.reduce((sum, item) => sum + Number(item.lineTotal), 0)

        const updated = await tx.order.update({
          where: { id },
          data: {
            subtotal: new Prisma.Decimal(newSubtotal),
            total: new Prisma.Decimal(newSubtotal)
          }
        })

        await tx.auditLog.create({
          data: {
            userId,
            orderId: id,
            action: 'MERGE_TABLES',
            details: `Merged order ${sourceOrder.orderNumber} (table ${sourceOrder.tableNumber || 'none'}) into ${targetOrder.orderNumber} (table ${targetOrder.tableNumber || 'none'})`
          }
        })

        return updated
      })

      return NextResponse.json(merged)
    }

    // ── ACTION 4: VOID ITEM LEVEL ──────────────────────────────────────
    if (action === 'VOID_ITEM') {
      const { orderItemId, quantityToVoid } = body
      if (!orderItemId) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

      const item = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: true }
      })

      if (!item || item.deletedAt) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      if (item.order.paymentStatus === 'PAID') return NextResponse.json({ error: 'Cannot void items on a settled order' }, { status: 400 })

      const voidQty = quantityToVoid && typeof quantityToVoid === 'number' && quantityToVoid > 0 ? quantityToVoid : item.quantity
      if (voidQty > item.quantity) {
        return NextResponse.json({ error: 'Cannot void more than the ordered quantity' }, { status: 400 })
      }

      const result = await prisma.$transaction(async (tx) => {
        // Concurrency lock
        await tx.$executeRawUnsafe(`SELECT id FROM "Order" WHERE id = '${item.orderId}' FOR UPDATE`)

        if (voidQty === item.quantity) {
          // Void the whole item
          await tx.orderItem.update({
            where: { id: orderItemId },
            data: { status: 'VOIDED' }
          })
        } else {
          // Partial void: reduce quantity and lineTotal
          const newQuantity = item.quantity - voidQty
          const unitPrice = Number(item.unitPrice)
          const newLineTotal = newQuantity * unitPrice

          await tx.orderItem.update({
            where: { id: orderItemId },
            data: { 
              quantity: newQuantity,
              lineTotal: new Prisma.Decimal(newLineTotal)
            }
          })

          // Create a record for the voided portion for auditing
          await tx.orderItem.create({
            data: {
              orderId: item.orderId,
              ticketId: item.ticketId,
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: voidQty,
              unitPrice: item.unitPrice,
              lineTotal: new Prisma.Decimal(voidQty * unitPrice),
              status: 'VOIDED'
            }
          })
        }

        // Recalculate order totals
        const allActiveItems = await tx.orderItem.findMany({
          where: { orderId: item.orderId, status: 'ACTIVE', deletedAt: null }
        })
        const newSubtotal = allActiveItems.reduce((sum, activeItem) => sum + Number(activeItem.lineTotal), 0)

        const updated = await tx.order.update({
          where: { id: item.orderId },
          data: {
            subtotal: new Prisma.Decimal(newSubtotal),
            total: new Prisma.Decimal(newSubtotal)
          }
        })

        await tx.auditLog.create({
          data: {
            userId,
            orderId: item.orderId,
            action: 'VOID_ITEM',
            details: `Voided ${voidQty}x of item: ${item.name}`
          }
        })

        return updated
      })

      return NextResponse.json(result)
    }

    // ── ACTION 5: STANDARD ORDER STATUS LIFECYCLE UPDATE ───────────────
    const { status } = body
    if (!status) {
      return NextResponse.json({ error: 'Status or action is required' }, { status: 400 })
    }

    // Map lowercase statuses from frontend to Prisma Enums
    const statusMap: Record<string, any> = {
      'pending':   'OPEN',
      'cooking':   'OPEN',
      'ready':     'AWAITING_PAYMENT',
      'delivered': 'AWAITING_PAYMENT',
      'served':    'AWAITING_PAYMENT',
      'cancelled': 'CANCELLED',
    }

    const prismaStatus = statusMap[status.toLowerCase()]
    if (!prismaStatus) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update ticket statuses accordingly
    if (status.toLowerCase() === 'cooking') {
      await prisma.orderTicket.updateMany({
        where: { orderId: id, status: 'PENDING', deletedAt: null },
        data: { status: 'COOKING' }
      })
    } else if (status.toLowerCase() === 'ready') {
      await prisma.orderTicket.updateMany({
        where: { orderId: id, status: { in: ['PENDING', 'COOKING'] }, deletedAt: null },
        data: { status: 'READY' }
      })
    } else if (status.toLowerCase() === 'served') {
      await prisma.orderTicket.updateMany({
        where: { orderId: id, status: { in: ['PENDING', 'COOKING', 'READY'] }, deletedAt: null },
        data: { status: 'SERVED' }
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: prismaStatus },
      include: {
        items: {
          where: { status: 'ACTIVE', deletedAt: null }
        },
        tickets: {
          where: { deletedAt: null }
        },
        waiter: {
          select: { name: true }
        }
      }
    })

    // If the order was cancelled (voided) notify SSE subscribers
    try {
      if (prismaStatus === 'CANCELLED' && (globalThis as any)['__sse_pos_order_send']) {
        ;(globalThis as any)['__sse_pos_order_send']('order-voided', { id: updatedOrder.id })
      }
    } catch (err) {
      console.error('SSE notify error', err)
    }

    // Map back to snake_case for consistency
    const mappedOrder = {
      id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      order_status: deriveOrderStatus(updatedOrder.status, updatedOrder.tickets),
      payment_status: updatedOrder.paymentStatus.toLowerCase(),
      created_at: updatedOrder.createdAt.toISOString(),
      total: Number(updatedOrder.total),
      notes: updatedOrder.notes,
      cashier_name: updatedOrder.waiter?.name || 'Staff',
      items: updatedOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
    }

    return NextResponse.json(mappedOrder)
  } catch (error) {
    console.error('Update Order Error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
