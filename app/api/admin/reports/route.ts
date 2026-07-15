import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period          = searchParams.get('period') || 'all'
    const customStartDate = searchParams.get('startDate')
    const customEndDate   = searchParams.get('endDate')

    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined
    let prevStartDate: Date | undefined
    let prevEndDate: Date | undefined

    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate); startDate.setHours(0, 0, 0, 0)
      endDate   = new Date(customEndDate);   endDate.setHours(23, 59, 59, 999)
    } else if (period === 'today') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0)
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999)
      // Previous: yesterday
      prevStartDate = new Date(now); prevStartDate.setDate(prevStartDate.getDate() - 1); prevStartDate.setHours(0, 0, 0, 0)
      prevEndDate   = new Date(now); prevEndDate.setDate(prevEndDate.getDate() - 1);     prevEndDate.setHours(23, 59, 59, 999)
    } else if (period === 'week') {
      startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0, 0, 0, 0)
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999)
      // Previous: last week
      prevStartDate = new Date(startDate); prevStartDate.setDate(prevStartDate.getDate() - 7)
      prevEndDate   = new Date(startDate); prevEndDate.setDate(prevEndDate.getDate() - 1); prevEndDate.setHours(23, 59, 59, 999)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0); endDate.setHours(23, 59, 59, 999)
      // Previous: last month
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevEndDate   = new Date(now.getFullYear(), now.getMonth(), 0);  prevEndDate.setHours(23, 59, 59, 999)
    }

    const whereClause: any = {}
    if (startDate && endDate) whereClause.createdAt = { gte: startDate, lte: endDate }
    else if (startDate)       whereClause.createdAt = { gte: startDate }

    const expenseWhere: any = {}
    if (startDate && endDate) expenseWhere.date = { gte: startDate, lte: endDate }
    else if (startDate)       expenseWhere.date = { gte: startDate }

    // ── Parallel data fetches ─────────────────────────────────────
    const [expensesList, orders, prevOrders] = await Promise.all([
      prisma.expense.findMany({
        where: expenseWhere,
        include: { category: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: { include: { menuItem: { select: { category: true } } } },
          waiter:   { select: { name: true } },
          cashier:  { select: { name: true } },
          payments: true,
          table:    { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      // Previous period — lightweight, just totals
      (prevStartDate && prevEndDate)
        ? prisma.order.findMany({
            where: { createdAt: { gte: prevStartDate, lte: prevEndDate }, paymentStatus: 'PAID' },
            select: { total: true },
          })
        : Promise.resolve([]),
    ])

    // ── Expenses ──────────────────────────────────────────────────
    const totalExpenses  = expensesList.reduce((s: number, e: any) => s + Number(e.amount), 0)
    const expenseByCat   = expensesList.reduce((acc: Record<string, number>, e: any) => {
      acc[e.category.name] = (acc[e.category.name] || 0) + Number(e.amount); return acc
    }, {})
    const expenseBreakdown = Object.entries(expenseByCat)
      .map(([label, total]) => ({ label, total: total as number, pct: totalExpenses > 0 ? ((total as number) / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)

    // ── Core order sets ───────────────────────────────────────────
    const paidOrders   = orders.filter(o => o.paymentStatus === 'PAID')
    const grossRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0)
    const netRevenue   = paidOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0)
    const totalOrders  = orders.length

    const vatYield      = paidOrders.reduce((s, o) => s + Number(o.vatAmount || 0), 0)
    const nhilYield     = paidOrders.reduce((s, o) => s + Number(o.nhilAmount || 0), 0)
    const getfundYield  = paidOrders.reduce((s, o) => s + Number(o.getfundAmount || 0), 0)
    const serviceYield  = paidOrders.reduce((s, o) => s + Number(o.serviceAmount || 0), 0)
    const netProfit     = grossRevenue - totalExpenses

    // ── 1. AOV ────────────────────────────────────────────────────
    const aov = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0

    // ── 2. Period-over-period comparison ──────────────────────────
    const prevRevenue    = (prevOrders as any[]).reduce((s, o) => s + Number(o.total), 0)
    const prevOrderCount = (prevOrders as any[]).length
    const revenueDelta   = prevRevenue    > 0 ? ((grossRevenue      - prevRevenue)    / prevRevenue)    * 100 : null
    const ordersDelta    = prevOrderCount > 0 ? ((paidOrders.length - prevOrderCount) / prevOrderCount) * 100 : null

    // ── 3. Discount impact ────────────────────────────────────────
    const totalDiscounts  = paidOrders.reduce((s, o) => s + Number(o.discountAmount || 0), 0)
    const discountPct     = (grossRevenue + totalDiscounts) > 0
      ? (totalDiscounts / (grossRevenue + totalDiscounts)) * 100 : 0

    // ── 4. Void/cancel rate ───────────────────────────────────────
    const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length
    const voidRate       = orders.length > 0 ? (cancelledCount / orders.length) * 100 : 0

    // ── 5. Hourly distribution ────────────────────────────────────
    const hourlyMap: Record<number, { orders: number; revenue: number }> = {}
    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours()
      if (!hourlyMap[h]) hourlyMap[h] = { orders: 0, revenue: 0 }
      hourlyMap[h].orders++
      if (o.paymentStatus === 'PAID') hourlyMap[h].revenue += Number(o.total)
    })
    const hourlyDist = Array.from({ length: 24 }, (_, h) => ({
      hour:    h,
      label:   `${h.toString().padStart(2, '0')}:00`,
      orders:  hourlyMap[h]?.orders  || 0,
      revenue: hourlyMap[h]?.revenue || 0,
    })).filter(h => h.orders > 0)
    const busiestHour = hourlyDist.length > 0
      ? hourlyDist.sort((a, b) => b.revenue - a.revenue)[0].label : null

    // ── 6 & 7. Waiter leaderboard + day-of-week ───────────────────
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayMap: Record<number, { orders: number; revenue: number }> = {}
    const waiterMap: Record<string, { orders: number; revenue: number }> = {}

    orders.forEach(o => {
      // Day of week
      const d = new Date(o.createdAt).getDay()
      if (!dayMap[d]) dayMap[d] = { orders: 0, revenue: 0 }
      dayMap[d].orders++
      if (o.paymentStatus === 'PAID') dayMap[d].revenue += Number(o.total)

      // Waiter
      const wName = o.waiter?.name || 'Staff'
      if (!waiterMap[wName]) waiterMap[wName] = { orders: 0, revenue: 0 }
      waiterMap[wName].orders++
      if (o.paymentStatus === 'PAID') waiterMap[wName].revenue += Number(o.total)
    })

    const dayBreakdown = Array.from({ length: 7 }, (_, d) => ({
      day:     dayNames[d],
      orders:  dayMap[d]?.orders  || 0,
      revenue: dayMap[d]?.revenue || 0,
    })).filter(d => d.orders > 0)

    const waiterList     = Object.entries(waiterMap)
      .map(([name, data]) => ({ name, ...data, aov: data.orders > 0 ? data.revenue / data.orders : 0 }))
      .sort((a, b) => b.orders - a.orders)
    const maxWaiterRev   = Math.max(...waiterList.map(w => w.revenue), 1)
    const waitersWithPct = waiterList.map(w => ({ ...w, pct: (w.revenue / maxWaiterRev) * 100 }))

    // ── Status funnel ─────────────────────────────────────────
    // Session statuses: OPEN, AWAITING_PAYMENT, PAID, CANCELLED
    const served    = orders.filter(o => o.paymentStatus === 'PAID').length
    const pending   = orders.filter(o => o.status === 'OPEN' || o.status === 'AWAITING_PAYMENT').length
    const statusFunnel = totalOrders > 0 ? [
      { label: 'Paid',      count: served,        pct: Math.round((served        / totalOrders) * 100) },
      { label: 'Pending',   count: pending,       pct: Math.round((pending       / totalOrders) * 100) },
      { label: 'Cancelled', count: cancelledCount, pct: Math.round((cancelledCount / totalOrders) * 100) },
    ] : [
      { label: 'Paid',      count: served,        pct: 0 },
      { label: 'Pending',   count: pending,       pct: 0 },
      { label: 'Cancelled', count: cancelledCount, pct: 0 },
    ]

    // ── Payment methods ───────────────────────────────────────────
    const pmMap: Record<string, { count: number; revenue: number }> = {}
    orders.forEach(o => {
      const m = o.payments[0]?.method?.toLowerCase() || 'cash'
      if (!pmMap[m]) pmMap[m] = { count: 0, revenue: 0 }
      pmMap[m].count++
      if (o.paymentStatus === 'PAID') pmMap[m].revenue += Number(o.total)
    })
    const paymentBreakdown = Object.entries(pmMap).map(([method, data]) => ({
      label: method.toUpperCase(), count: data.count, revenue: data.revenue,
      pct: totalOrders > 0 ? Math.round((data.count / totalOrders) * 100) : 0,
    }))

    // ── Cashier performance ───────────────────────────────────────
    const cashierMap: Record<string, { revenue: number; orders: number }> = {}
    orders.forEach(o => {
      const n = o.cashier?.name || 'Staff'
      if (!cashierMap[n]) cashierMap[n] = { revenue: 0, orders: 0 }
      cashierMap[n].orders++
      if (o.paymentStatus === 'PAID') cashierMap[n].revenue += Number(o.total)
    })
    const cashierList  = Object.entries(cashierMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue)
    const maxCashierRev = cashierList[0]?.revenue || 1
    const staffWithPct  = cashierList.map(s => ({ ...s, pct: (s.revenue / maxCashierRev) * 100 }))

    // ── Table intelligence ────────────────────────────────────────
    const tableMap: Record<string, { revenue: number; orders: number }> = {}
    orders.forEach(o => {
      const t = o.table?.name || o.tableNumber || 'Takeaway'
      if (!tableMap[t]) tableMap[t] = { revenue: 0, orders: 0 }
      tableMap[t].orders++
      if (o.paymentStatus === 'PAID') tableMap[t].revenue += Number(o.total)
    })
    const tableList    = Object.entries(tableMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue)
    const maxTableRev  = tableList[0]?.revenue || 1
    const tablesWithPct = tableList.map(t => ({ ...t, pct: (t.revenue / maxTableRev) * 100 }))

    // ── 8 & 9. Top items with revenuePerUnit ──────────────────────
    const itemMap: Record<string, { quantity: number; revenue: number }> = {}
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!itemMap[item.name]) itemMap[item.name] = { quantity: 0, revenue: 0 }
        itemMap[item.name].quantity += item.quantity
        itemMap[item.name].revenue  += Number(item.lineTotal)
      })
    })
    const topItemsRaw = Object.entries(itemMap)
      .map(([name, data]) => ({ name, ...data, revenuePerUnit: data.quantity > 0 ? data.revenue / data.quantity : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
    const maxItemRev   = topItemsRaw[0]?.revenue || 1
    const itemsWithPct = topItemsRaw.map(i => ({ ...i, pct: (i.revenue / maxItemRev) * 100 }))

    // ── Category breakdown ────────────────────────────────────────
    const catMap: Record<string, { revenue: number; count: number }> = {}
    orders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.menuItem?.category?.name || 'Unknown'
        if (!catMap[cat]) catMap[cat] = { revenue: 0, count: 0 }
        catMap[cat].revenue += Number(item.lineTotal)
        catMap[cat].count   += item.quantity
      })
    })
    const totalCatRev   = Object.values(catMap).reduce((s, c) => s + Number(c.revenue), 0) || 1
    const categoryBreakdown = Object.entries(catMap)
      .map(([label, data]) => ({ label, ...data, pct: (data.revenue / totalCatRev) * 100 }))
      .sort((a, b) => b.revenue - a.revenue)

    // ── Effective tax rate ────────────────────────────────────────
    const effectiveTaxRate = grossRevenue > 0
      ? ((vatYield + nhilYield + getfundYield) / grossRevenue) * 100 : 0

    return NextResponse.json({
      kpis: {
        grossRevenue, netRevenue, totalOrders,
        paidOrders: paidOrders.length,
        vatYield, nhilYield, getfundYield, serviceYield,
        totalExpenses, netProfit,
        // New
        aov,
        revenueDelta,
        ordersDelta,
        totalDiscounts,
        discountPct,
        voidRate,
        effectiveTaxRate,
        busiestHour,
      },
      expenseBreakdown,
      statusFunnel,
      paymentMethods:    paymentBreakdown,
      staffPerformance:  staffWithPct,
      waiterActivity:    waitersWithPct,   // now has revenue + aov
      tableIntelligence: tablesWithPct,
      topItems:          itemsWithPct,     // now has revenuePerUnit
      categoryBreakdown,
      hourlyDist,
      dayBreakdown,
    })

  } catch (error) {
    console.error('Reports API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
