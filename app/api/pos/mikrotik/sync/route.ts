import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'

// A simple hardcoded token to prevent unauthorized access.
// The router must include this in the URL to get the data.
const SYNC_TOKEN = 'keke-wifi-sync-2026'

export async function GET(req: Request) {
  try {
    // 1. Verify the secret token
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    
    if (token !== SYNC_TOKEN) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 2. Calculate the time window (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    // 3. Query Prisma for recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      select: {
        orderNumber: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 4. Format as a simple comma-separated string
    // e.g., "ORD-A1B2C3,ORD-D4E5F6"
    const orderNumbers = recentOrders.map(order => order.orderNumber).join(',')

    // 5. Return plain text (RouterOS parses this much easier than JSON)
    return new NextResponse(orderNumbers || 'NO_ORDERS', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        // Prevent caching so the router always gets fresh data
        'Cache-Control': 'no-store, max-age=0',
      },
    })

  } catch (error) {
    console.error('MikroTik Sync Error:', error)
    return new NextResponse('Error fetching orders', { status: 500 })
  }
}
