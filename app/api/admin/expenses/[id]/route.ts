import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import prisma from '../../../../../lib/prisma'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expense DELETE error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
