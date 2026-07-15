import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'GLOBAL' },
      update: {},
      create: {
        id: 'GLOBAL',
        storeName: 'Chez Keke',
        storeTagline: 'The Spirit of Africa in Every Grain',
        isTaxEnabled: false,
        isInclusive: false,
        vatRate: 15.0,
        nhilRate: 2.5,
        getfundRate: 2.5,
        serviceCharge: 5.0,
        discountRate: 0,
      }
    })

    return NextResponse.json({
      isTaxEnabled: settings.isTaxEnabled,
      isInclusive: settings.isInclusive,
      vatRate: settings.vatRate,
      nhilRate: settings.nhilRate,
      getfundRate: settings.getfundRate,
      serviceCharge: settings.serviceCharge,
      discountRate: settings.discountRate ?? 0,
    })
  } catch (error) {
    console.error('Fetch cashier settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}
