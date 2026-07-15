import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all'
    const categoryId = searchParams.get('categoryId') || ''
    const recurring = searchParams.get('recurring') || ''
    const customStart = searchParams.get('startDate')
    const customEnd = searchParams.get('endDate')

    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (period === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customEnd)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'today') {
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
    }

    const where: any = {}
    if (startDate && endDate) where.date = { gte: startDate, lte: endDate }
    if (categoryId) where.categoryId = categoryId
    if (recurring === 'true') where.isRecurring = true
    if (recurring === 'false') where.isRecurring = false

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: 'desc' },
    })

    const normalizedExpenses = expenses.map(e => ({
      ...e,
      amount: Number(e.amount)
    }))

    const total = normalizedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const recurringTotal = normalizedExpenses.filter(e => e.isRecurring).reduce((sum, e) => sum + e.amount, 0)
    const oneOffTotal = normalizedExpenses.filter(e => !e.isRecurring).reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({ expenses: normalizedExpenses, total, recurringTotal, oneOffTotal })
  } catch (error) {
    console.error('Expenses GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, description, date, isRecurring, categoryId } = body

    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: 'Category required' }, { status: 400 })
    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description: description.trim(),
        date: new Date(date),
        isRecurring: !!isRecurring,
        categoryId,
        recordedById: (session.user as any).id,
      },
      include: {
        category: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    })

    const normalizedExpense = {
      ...expense,
      amount: Number(expense.amount)
    }

    return NextResponse.json(normalizedExpense, { status: 201 })
  } catch (error) {
    console.error('Expenses POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
