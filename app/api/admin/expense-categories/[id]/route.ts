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

    const category = await prisma.expenseCategory.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (category.isDefault) return NextResponse.json({ error: 'Cannot delete default categories' }, { status: 403 })

    const linkedCount = await prisma.expense.count({ where: { categoryId: id } })
    if (linkedCount > 0) {
      return NextResponse.json({ error: `Cannot delete — ${linkedCount} expense(s) use this category` }, { status: 409 })
    }

    await prisma.expenseCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
