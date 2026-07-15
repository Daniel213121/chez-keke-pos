import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [categories, items, tables] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.menuItem.findMany({
        include: { category: true },
        orderBy: { name: 'asc' }
      }),
      prisma.table.findMany({
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({ categories, items, tables })
  } catch (error) {
    console.error('Failed to fetch menu data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
