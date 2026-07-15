import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, basePrice, categoryId, images } = await req.json()

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 })
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        basePrice,
        categoryId,
        images: images || [],
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
