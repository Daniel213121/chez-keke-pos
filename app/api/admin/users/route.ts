import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import bcrypt from 'bcryptjs'

// GET: Fetch all users with optional filtering
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || 'ALL'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {}

    // Add role filter if not 'ALL'
    if (role !== 'ALL') {
      where.role = role
    }

    // Add status filter
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Add search filter (name or email)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from response
        _count: {
          select: {
            ordersCreated: true,
            ordersHandled: true,
            paymentsProcessed: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Fetch Users Error:', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

// POST: Create a new user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, password, role } = body

    // Validation
    if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role.toUpperCase()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Create User Error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PATCH: Update user (including deactivation/reactivation)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, email, role, isActive, password } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name.trim()
    if (email !== undefined) {
      updateData.email = email.toLowerCase().trim()
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          id: { not: id }
        }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
    }
    if (role !== undefined) updateData.role = role.toUpperCase()
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      if (targetUser.role === 'ADMIN' || role?.toUpperCase() === 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin passwords cannot be reset from this panel' },
          { status: 403 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ordersCreated: true,
            ordersHandled: true,
            paymentsProcessed: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update User Error:', error)
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}