import { NextResponse } from 'next/server'
import os from 'os'

export async function GET() {
  let convexStatus: 'connected' | 'disconnected' = 'connected'
  let convexError: string | null = null

  // Basic connectivity check: verify NEXT_PUBLIC_CONVEX_URL is configured
  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured')
    }
    // Additional validation: ensure it's a valid URL
    new URL(process.env.NEXT_PUBLIC_CONVEX_URL)
  } catch (e) {
    convexStatus = 'disconnected'
    convexError =
      e instanceof Error ? e.message : 'Invalid Convex configuration'
  }

  const memoryUsage = process.memoryUsage()
  const healthInfo = {
    status: convexStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    backend: {
      type: 'Convex',
      status: convexStatus,
      url: process.env.NEXT_PUBLIC_CONVEX_URL ? 'configured' : 'missing',
      error: convexError,
    },
    memory: {
      usedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      totalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      externalMb: Math.round(memoryUsage.external / 1024 / 1024),
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      loadAverage: os.loadavg(),
    },
    deployment: {
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'localhost',
    },
  }

  return NextResponse.json(healthInfo, {
    status: convexStatus === 'connected' ? 200 : 503,
  })
}
