import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      orders,
      recentOrders,
      trendingOrders,
      staff,
      auditLogs,
      expensesThisMonth,
      recentExpenses,
      recentPayments,
      todayPaymentsData,
      todayExpensesData,
    ] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items:   true,
          waiter:  { select: { name: true } },
          cashier: { select: { name: true } },
        },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          items:    true,
          waiter:   { select: { name: true } },
          cashier:  { select: { name: true } },
          payments: true,
        },
      }),
      prisma.order.findMany({
        where:   { createdAt: { gte: thirtyDaysAgo } },
        include: { items: true },
      }),
      prisma.user.findMany({
        select:  { id: true, name: true, role: true, isActive: true },
        orderBy: { name: 'asc' },
      }),
      prisma.auditLog.findMany({
        take:    10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.expense.findMany({
        where:  { date: { gte: monthStart } },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        take:    6,
        orderBy: { createdAt: 'desc' },
        include: {
          category:   { select: { name: true } },
          recordedBy: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        take:    6,
        orderBy: { createdAt: 'desc' },
        include: {
          cashier: { select: { name: true } },
          order:   { select: { orderNumber: true, total: true } },
        },
      }),
      // Today's payments — for method split + top cashier
      prisma.payment.findMany({
        where:   { createdAt: { gte: today } },
        include: { cashier: { select: { id: true, name: true } } },
      }),
      // Today's expenses — for net profit + strip
      prisma.expense.findMany({
        where:  { date: { gte: today } },
        select: { amount: true },
      }),
    ]);

    // ── Core stats ──────────────────────────────────────────────
    const todayOrders         = orders.filter(o => new Date(o.createdAt) >= today);
    const yesterdayOrders     = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= yesterday && d < today;
    });
    const paidOrders          = todayOrders.filter(o => o.paymentStatus === 'PAID');
    const yesterdayPaidOrders = yesterdayOrders.filter(o => o.paymentStatus === 'PAID');

    const grossRevenue        = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const netRevenue          = paidOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0);
    const taxToday            = paidOrders.reduce((s, o) => s + Number(o.vatAmount || 0) + Number(o.nhilAmount || 0) + Number(o.getfundAmount || 0), 0);

    const prevGross           = yesterdayPaidOrders.reduce((s, o) => s + Number(o.total), 0);
    const prevNet             = yesterdayPaidOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0);
    const prevTax             = yesterdayPaidOrders.reduce((s, o) => s + Number(o.vatAmount || 0) + Number(o.nhilAmount || 0) + Number(o.getfundAmount || 0), 0);

    const calcDeltaPct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

    const totalExpensesThisMonth = expensesThisMonth.reduce((s, e) => s + Number(e.amount), 0);

    // ── Live kitchen / cashier status ────────────────────────────
    // Kitchen statuses (COOKING/READY) now live on OrderTicket, not Order.
    // Count tickets in relevant states for the live status strip.
    const cookingCount = 0; // calculated from tickets if needed
    const readyCount   = 0; // calculated from tickets if needed
    const unpaidCount  = todayOrders.filter(o =>
      o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED'
    ).length;

    // ── Today's expenses ─────────────────────────────────────────
    const todayExpensesTotal = todayExpensesData.reduce((s, e) => s + Number(e.amount), 0);
    const netToday           = grossRevenue - todayExpensesTotal;

    // ── Payment method split (today) ─────────────────────────────
    const cashToday = todayPaymentsData
      .filter(p => p.method === 'CASH').reduce((s, p) => s + Number(p.amount), 0);
    const momoToday = todayPaymentsData
      .filter(p => p.method === 'MOMO').reduce((s, p) => s + Number(p.amount), 0);
    const cardToday = todayPaymentsData
      .filter(p => p.method === 'CARD').reduce((s, p) => s + Number(p.amount), 0);

    // ── Top performers ────────────────────────────────────────────
    // Top waiter (by orders placed today)
    const waiterMap = new Map<string, { name: string; orders: number; total: number }>();
    todayOrders.forEach((o: any) => {
      if (!o.waiterId || !o.waiter) return;
      const prev = waiterMap.get(o.waiterId) || { name: o.waiter.name, orders: 0, total: 0 };
      waiterMap.set(o.waiterId, { ...prev, orders: prev.orders + 1, total: prev.total + Number(o.total) });
    });
    const topWaiters = Array.from(waiterMap.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 4);

    // Top cashier (by payments processed today)
    const cashierMap = new Map<string, { name: string; payments: number; total: number }>();
    todayPaymentsData.forEach((p: any) => {
      if (!p.cashier) return;
      const prev = cashierMap.get(p.cashierId) || { name: p.cashier.name, payments: 0, total: 0 };
      cashierMap.set(p.cashierId, { ...prev, payments: prev.payments + 1, total: prev.total + Number(p.amount) });
    });
    const topCashier = Array.from(cashierMap.values())
      .sort((a, b) => b.total - a.total)[0] || null;

    // ── Weekly totals ─────────────────────────────────────────────
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const weeklyTotals = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const dayTotal = orders
        .filter(o => {
          const d = new Date(o.createdAt);
          return d >= dayStart && d < dayEnd && o.paymentStatus === 'PAID';
        })
        .reduce((s, o) => s + Number(o.total), 0);
      return {
        day:     dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        total:   dayTotal,
        isToday: dayStart.toDateString() === today.toDateString(),
      };
    });

    const weekTotal = weeklyTotals.reduce((s, d) => s + d.total, 0);

    // ── Activity feed ─────────────────────────────────────────────
    const activityFeed = [
      ...recentOrders.slice(0, 4).map((o: any) => ({
        id:   'order-' + o.id,
        kind: o.status === 'CANCELLED' ? 'warn' : 'ok',
        who:  o.waiter?.name || 'Staff',
        what: o.status === 'CANCELLED'
          ? `Voided order ${o.orderNumber}`
          : `New order ${o.orderNumber} · ₵${Number(o.total).toFixed(2)}`,
        time: o.createdAt.toISOString(),
      })),
      ...recentExpenses.map((e: any) => ({
        id:   'exp-' + e.id,
        kind: 'edit',
        who:  e.recordedBy?.name || 'Staff',
        what: `${e.category?.name || 'Expense'}: ${e.description} · ₵${Number(e.amount).toFixed(2)}`,
        time: e.createdAt.toISOString(),
      })),
      ...recentPayments.map((p: any) => ({
        id:   'pay-' + p.id,
        kind: 'ok',
        who:  p.cashier?.name || 'Staff',
        what: `Payment for ${p.order?.orderNumber || 'order'} · ₵${Number(p.amount).toFixed(2)}`,
        time: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    // Normalize lists before returning to prevent raw Decimal serialization
    const normalizedRecentOrders = recentOrders.map(order => ({
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      vatAmount: Number(order.vatAmount || 0),
      nhilAmount: Number(order.nhilAmount || 0),
      getfundAmount: Number(order.getfundAmount || 0),
      serviceAmount: Number(order.serviceAmount || 0),
      discountAmount: Number(order.discountAmount || 0),
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
    }))

    const normalizedTrendingOrders = trendingOrders.map(order => ({
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
    }))

    return NextResponse.json({
      // Core financials
      revenue:           grossRevenue,
      netYield:          netRevenue,
      taxYield:          taxToday,
      ordersCount:       todayOrders.length,
      expensesThisMonth: totalExpensesThisMonth,
      // New fields
      taxToday,
      netToday,
      todayExpensesTotal,
      // Live status
      cookingCount,
      readyCount,
      unpaidCount,
      // Payment split
      cashToday,
      momoToday,
      cardToday,
      // Top performers
      topWaiters,
      topCashier,
      // Deltas
      deltas: {
        revenuePct:    calcDeltaPct(grossRevenue, prevGross),
        netYieldPct:   calcDeltaPct(netRevenue, prevNet),
        taxYieldPct:   calcDeltaPct(taxToday, prevTax),
        ordersCountPct: calcDeltaPct(todayOrders.length, yesterdayOrders.length),
      },
      // Lists
      recentOrders: normalizedRecentOrders,
      trendingOrders: normalizedTrendingOrders,
      staffList:    staff,
      auditLogs,
      weeklyTotals,
      weekTotal,
      activityFeed,
    });
  } catch (error) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
