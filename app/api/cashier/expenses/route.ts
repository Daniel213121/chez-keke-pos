import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: today, lte: endOfDay } },
      include: {
        category: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses.map(e => ({ ...e, amount: Number(e.amount) })))
  } catch (error) {
    console.error('Cashier expenses GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || (role !== 'CASHIER' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, description, date, isRecurring, categoryId } = body

    if (!amount || parseFloat(amount) <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
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
        category: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    })

    return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 })
  } catch (error) {
    console.error('Cashier expenses POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
