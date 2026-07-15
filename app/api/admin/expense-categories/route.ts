import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const exists = await prisma.expenseCategory.findUnique({ where: { name: name.trim() } })
    if (exists) return NextResponse.json({ error: 'Category already exists' }, { status: 409 })

    const category = await prisma.expenseCategory.create({
      data: { name: name.trim(), isDefault: false },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
