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
    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Table identifier is required' }, { status: 400 })
    }

    const table = await prisma.table.create({
      data: { name }
    })

    return NextResponse.json(table)
  } catch (error) {
    console.error('Failed to create table:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
