import { NextResponse } from 'next/server'
import { runSeed } from '@wds/db/seed'

export const dynamic = 'force-dynamic'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_URL is not configured in environment',
      },
      { status: 500 }
    )
  }

  try {
    await runSeed(dbUrl)
    return NextResponse.json({
      success: true,
      message: 'Successfully populated Thai Watsadu WDS sample seed data!',
      details: {
        customers: 20,
        products: 15,
        leads: 20,
        followUps: 6,
        siteVisits: 5,
        quotations: 11,
        orders: 6,
        deliveries: 6,
      },
    })
  } catch (error: any) {
    console.error('[Seed Error]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}
