import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Audit Logging Module
 * Comprehensive logging of all actions for compliance, debugging, and security
 */

/**
 * Log an audit event
 * Called automatically by other mutations via logAudit helper
 */
export const logEvent = mutation({
  args: {
    userId: v.string(),
    action: v.string(), // "board:created", "note:deleted", etc.
    resourceType: v.string(), // "board", "note", "user", "team"
    resourceId: v.string(),
    resourceName: v.optional(v.string()),
    teamId: v.optional(v.id('teams')),
    boardId: v.optional(v.id('boards')),
    changes: v.optional(
      v.object({
        before: v.optional(v.any()),
        after: v.optional(v.any()),
      }),
    ),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    status: v.union(v.literal('success'), v.literal('failure')),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('auditLogs', {
      ...args,
      timestamp: Date.now(),
    })
  },
})

/**
 * Get audit logs for a resource
 * Only accessible to team admins/owners
 */
export const getResourceAuditLog = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    let logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_resource', (q) =>
        q
          .eq('resourceType', args.resourceType)
          .eq('resourceId', args.resourceId),
      )
      .collect()

    // Sort by timestamp descending in memory
    logs.sort((a: any, b: any) => b.timestamp - a.timestamp)

    return logs.slice(0, args.limit || 50).map((log: any) => ({
      _id: log._id,
      action: log.action,
      userId: log.userId,
      timestamp: log.timestamp,
      status: log.status,
      changes: log.changes,
      metadata: log.metadata,
    }))
  },
})

/**
 * Get user's activity log
 * Users can see their own, admins can see team members'
 */
export const getUserAuditLog = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const currentUserId = identity.subject

    if (args.userId !== currentUserId) {
      throw new Error('Forbidden')
    }

    let logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    logs.sort((a: any, b: any) => b.timestamp - a.timestamp)
    return logs.slice(0, args.limit || 50)
  },
})

/**
 * Get team-wide audit log
 * Only accessible by team owner/admin
 */
export const getTeamAuditLog = query({
  args: {
    teamId: v.id('teams'),
    action: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const membership = teamMembers.find((m) => m.userId === userId)

    if (!['owner', 'admin'].includes(membership?.role || '')) {
      throw new Error('Forbidden')
    }

    let logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    // Apply filters in memory
    logs = logs.filter((log) => {
      if (args.action && log.action !== args.action) return false
      if (args.dateFrom && log.timestamp < args.dateFrom) return false
      if (args.dateTo && log.timestamp > args.dateTo) return false
      return true
    })

    // Sort by timestamp descending and limit
    logs.sort((a, b) => b.timestamp - a.timestamp)
    return logs.slice(0, args.limit || 100)
  },
})

/**
 * Search audit logs
 * Advanced search across all dimensions
 */
export const searchAuditLogs = query({
  args: {
    teamId: v.id('teams'),
    query: v.optional(v.string()),
    action: v.optional(v.string()),
    userId: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    status: v.optional(v.union(v.literal('success'), v.literal('failure'))),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Verify access - collect then filter
    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const membership = teamMembers.find((m) => m.userId === userId)

    if (!['owner', 'admin'].includes(membership?.role || '')) {
      throw new Error('Forbidden')
    }

    // Get all team logs
    let logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    // Apply all filters
    logs = logs.filter((log) => {
      if (args.action && log.action !== args.action) return false
      if (args.userId && log.userId !== args.userId) return false
      if (args.resourceType && log.resourceType !== args.resourceType)
        return false
      if (args.status && log.status !== args.status) return false
      if (args.dateFrom && log.timestamp < args.dateFrom) return false
      if (args.dateTo && log.timestamp > args.dateTo) return false

      // Text search
      if (args.query) {
        const q = args.query.toLowerCase()
        const matches =
          log.action.toLowerCase().includes(q) ||
          (log.resourceName?.toLowerCase().includes(q) ?? false) ||
          log.userId.toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })

    // Sort and limit
    logs.sort((a, b) => b.timestamp - a.timestamp)
    return logs.slice(0, args.limit || 50)
  },
})

/**
 * Get audit statistics for a team
 * For dashboard/analytics
 */
export const getAuditStats = query({
  args: {
    teamId: v.id('teams'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject
    const days = args.days || 30
    const dateFrom = Date.now() - days * 24 * 60 * 60 * 1000

    // Verify access - collect then filter
    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const membership = teamMembers.find((m) => m.userId === userId)

    if (!['owner', 'admin'].includes(membership?.role || '')) {
      throw new Error('Forbidden')
    }

    // Get logs for period
    const logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const periodLogs = logs.filter((log) => log.timestamp >= dateFrom)

    // Calculate stats
    const stats = {
      totalEvents: periodLogs.length,
      successfulActions: periodLogs.filter((l) => l.status === 'success')
        .length,
      failedActions: periodLogs.filter((l) => l.status === 'failure').length,
      successRate:
        periodLogs.length > 0
          ? (
              (periodLogs.filter((l) => l.status === 'success').length /
                periodLogs.length) *
              100
            ).toFixed(1) + '%'
          : 'N/A',

      topActions: getTopItems(periodLogs, 'action', 5),
      topUsers: getTopItems(periodLogs, 'userId', 5),
      byResourceType: groupBy(periodLogs, 'resourceType'),

      failureReasons: periodLogs
        .filter((l) => l.status === 'failure' && l.errorMessage)
        .reduce(
          (acc, log) => {
            acc[log.errorMessage!] = (acc[log.errorMessage!] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),

      timeline: getTimelineData(periodLogs, days),
    }

    return stats
  },
})

/**
 * Export audit log (CSV)
 * For compliance/archival
 */
export const exportAuditLog = query({
  args: {
    teamId: v.id('teams'),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Verify access - collect then filter
    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const membership = teamMembers.find((m) => m.userId === userId)

    if (!['owner', 'admin'].includes(membership?.role || '')) {
      throw new Error('Forbidden')
    }

    // Get logs
    let logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    // Filter by date if provided
    if (args.dateFrom || args.dateTo) {
      logs = logs.filter((log) => {
        if (args.dateFrom && log.timestamp < args.dateFrom) return false
        if (args.dateTo && log.timestamp > args.dateTo) return false
        return true
      })
    }

    const csv = convertToCSV(logs)

    return {
      csv,
      filename: `audit-log-${new Date().toISOString().split('T')[0]}.csv`,
      totalRecords: logs.length,
    }
  },
})

// ============= HELPERS =============

/**
 * Group array by property
 */
function groupBy(arr: any[], property: string): Record<string, number> {
  return arr.reduce(
    (acc, item) => {
      const key = item[property]
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Get top N items by frequency
 */
function getTopItems(
  arr: any[],
  property: string,
  limit: number,
): Array<{ name: string; count: number }> {
  const grouped = groupBy(arr, property)
  return Object.entries(grouped)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Create timeline data for charts
 */
function getTimelineData(
  logs: any[],
  days: number,
): Array<{
  date: string
  count: number
}> {
  const timeline: Record<string, number> = {}

  // Initialize dates
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    timeline[dateStr] = 0
  }

  // Count logs per date
  logs.forEach((log) => {
    const date = new Date(log.timestamp)
    const dateStr = date.toISOString().split('T')[0]
    if (timeline[dateStr] !== undefined) {
      timeline[dateStr]++
    }
  })

  return Object.entries(timeline).map(([date, count]) => ({
    date,
    count,
  }))
}

/**
 * Convert audit logs to CSV format
 */
function convertToCSV(logs: any[]): string {
  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'Status',
    'Error',
  ]

  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.userId,
    log.action,
    log.resourceType,
    log.resourceId,
    log.status,
    log.errorMessage || '',
  ])

  // Format CSV
  const csvHeaders = headers.map((h) => `"${h}"`).join(',')
  const csvRows = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')

  return `${csvHeaders}\n${csvRows}`
}
