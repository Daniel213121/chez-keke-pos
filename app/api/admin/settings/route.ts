import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { z } from 'zod'

const settingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  storeTagline: z.string().optional(),
  isTaxEnabled: z.boolean().optional(),
  isInclusive: z.boolean().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  nhilRate: z.number().min(0).max(100).optional(),
  getfundRate: z.number().min(0).max(100).optional(),
  serviceCharge: z.number().min(0).max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
})

// GET: Fetch global settings (tax config, store identity)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert to ensure the GLOBAL row always exists
    const settings = await prisma.settings.upsert({
      where: { id: 'GLOBAL' },
      update: {},
      create: {
        id: 'GLOBAL',
        storeName: 'Chez Keke',
        storeTagline: 'The Spirit of Africa in Every Grain',
        isTaxEnabled: false, // Default OFF for new restaurants
        isInclusive: false,
        vatRate: 15.0,
        nhilRate: 2.5,
        getfundRate: 2.5,
        serviceCharge: 5.0,
        discountRate: 0,
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Fetch Settings Error:', error)
    return NextResponse.json({ error: 'Failed to load system configuration' }, { status: 500 })
  }
}

// PATCH: Update global settings
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate with Zod
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid settings values', 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 })
    }

    const updated = await prisma.settings.update({
      where: { id: 'GLOBAL' },
      data
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update Settings Error:', error)
    return NextResponse.json({ error: 'Failed to update system configuration' }, { status: 500 })
  }
}
