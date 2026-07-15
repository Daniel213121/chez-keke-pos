import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data: any = {}

    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.basePrice === 'number') data.basePrice = body.basePrice
    if (typeof body.categoryId === 'string') data.categoryId = body.categoryId
    if (Array.isArray(body.images)) data.images = body.images

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const item = await prisma.menuItem.update({ where: { id }, data })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
