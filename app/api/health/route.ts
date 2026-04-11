import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import os from "os";

export async function GET() {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbError: string | null = null;
  let dbStats: {
    users?: number;
    boards?: number;
    notifications?: number;
    error?: string;
  } | null = null;

  try {
    // Check database connectivity by pinging it
    await prisma.$runCommandRaw({ ping: 1 });
    dbStatus = "connected";

    // Get database stats
    try {
      const [userCount, boardCount, notificationCount] = await Promise.all([
        prisma.user.count(),
        prisma.board.count(),
        prisma.notification.count(),
      ]);
      dbStats = {
        users: userCount,
        boards: boardCount,
        notifications: notificationCount,
      };
    } catch {
      // Don't fail the health check if stats collection fails
      dbStats = { error: "Could not fetch stats" };
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Unknown DB error";
  }

  const memoryUsage = process.memoryUsage();
  const healthInfo = {
    status: dbStatus === "connected" ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
    database: {
      status: dbStatus,
      error: dbError,
      stats: dbStats,
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
      region: process.env.VERCEL_REGION || "unknown",
      url: process.env.VERCEL_URL || "localhost",
    },
  };

  return NextResponse.json(healthInfo, {
    status: dbStatus === "connected" ? 200 : 503,
  });
}
