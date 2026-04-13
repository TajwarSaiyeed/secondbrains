import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

/**
 * Teams & RBAC (Role-Based Access Control) Module
 * Hierarchical roles: owner > admin > member > viewer
 */

// Default permissions per role
const ROLE_PERMISSIONS = {
  owner: [
    'team:manage',
    'team:invite',
    'team:settings',
    'board:create',
    'board:read',
    'board:write',
    'board:delete',
    'board:invite',
    'member:manage',
    'role:assign',
    'audit:view',
  ],
  admin: [
    'team:invite',
    'board:create',
    'board:read',
    'board:write',
    'board:delete',
    'board:invite',
    'member:manage',
    'audit:view',
  ],
  member: [
    'board:create',
    'board:read',
    'board:write',
    'board:invite', // Can only invite to their own boards
    'content:create',
    'content:read',
    'content:write',
    'content:delete', // Their own content
  ],
  viewer: ['board:read', 'content:read'],
}

/**
 * Create a new team
 */
export const createTeam = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Create team
    const teamId = await ctx.db.insert('teams', {
      name: args.name,
      description: args.description,
      ownerId: userId,
      createdAt: Date.now(),
      settings: {
        allowPublicBoards: false,
        requireTwoFactor: false,
      },
    })

    // Add creator as owner
    await ctx.db.insert('teamMembers', {
      teamId,
      userId,
      role: 'owner',
      joinedAt: Date.now(),
    })

    // Log audit
    await logAudit(ctx, {
      userId,
      action: 'team:created',
      resourceType: 'team',
      resourceId: teamId.toString(),
      resourceName: args.name,
      status: 'success',
    })

    return { teamId, name: args.name }
  },
})

/**
 * Get teams for current user
 */
export const getUserTeams = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Find all teams user is member of
    const memberships = await ctx.db
      .query('teamMembers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const teams = []
    for (const membership of memberships) {
      const team = await ctx.db.get(membership.teamId)
      if (team) {
        teams.push({
          _id: team._id,
          name: team.name,
          description: team.description,
          role: membership.role,
          memberCount: (
            await ctx.db
              .query('teamMembers')
              .withIndex('by_team', (q) => q.eq('teamId', team._id))
              .collect()
          ).length,
        })
      }
    }

    return teams
  },
})

/**
 * Get team members with roles
 */
export const getTeamMembers = query({
  args: { teamId: v.id('teams') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const userMembership = teamMembers.find(
      (m) => m.userId === identity.subject,
    )

    if (!userMembership) {
      throw new Error('Not a team member')
    }

    const members = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    return members.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
    }))
  },
})

/**
 * Invite user to team
 * Requires admin or owner role
 */
export const inviteTeamMember = mutation({
  args: {
    teamId: v.id('teams'),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('member'), v.literal('viewer')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Verify user has permission
    const userRole = await getUserRoleInTeam(ctx, args.teamId, userId)
    if (!['owner', 'admin'].includes(userRole)) {
      throw new Error('Only admins can invite members')
    }

    // Create invite record
    const inviteId = await ctx.db.insert('teamInvites', {
      teamId: args.teamId,
      email: args.email,
      role: args.role,
      invitedBy: userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      accepted: false,
      token: generateInviteToken(),
    })

    // Log audit
    await logAudit(ctx, {
      userId,
      action: 'team:member_invited',
      resourceType: 'team',
      resourceId: args.teamId.toString(),
      status: 'success',
      metadata: { invitedEmail: args.email, role: args.role },
    })

    return {
      inviteId,
      message: `Invitation sent to ${args.email}`,
    }
  },
})

/**
 * Change team member role
 * Requires owner permission
 */
export const updateTeamMemberRole = mutation({
  args: {
    teamId: v.id('teams'),
    userId: v.string(),
    newRole: v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('member'),
      v.literal('viewer'),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const currentUserId = identity.subject

    // Only owner can change roles
    const userRole = await getUserRoleInTeam(ctx, args.teamId, currentUserId)
    if (userRole !== 'owner') {
      throw new Error('Only team owner can change roles')
    }

    // Find member record
    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const member = teamMembers.find((m) => m.userId === args.userId)

    if (!member) {
      throw new Error('Member not found')
    }

    const oldRole = member.role

    // Update role
    await ctx.db.patch(member._id, {
      role: args.newRole,
    })

    // Log audit
    await logAudit(ctx, {
      userId: currentUserId,
      action: 'team:role_changed',
      resourceType: 'team',
      resourceId: args.teamId.toString(),
      status: 'success',
      metadata: {
        targetUserId: args.userId,
        oldRole,
        newRole: args.newRole,
      },
    })

    return {
      success: true,
      message: `${args.userId} is now a ${args.newRole}`,
    }
  },
})

/**
 * Remove team member
 * Requires owner permission
 */
export const removeTeamMember = mutation({
  args: {
    teamId: v.id('teams'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const currentUserId = identity.subject

    // Only owner can remove members
    const userRole = await getUserRoleInTeam(ctx, args.teamId, currentUserId)
    if (userRole !== 'owner') {
      throw new Error('Only team owner can remove members')
    }

    // Find and delete membership
    const teamMembers = await ctx.db
      .query('teamMembers')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .collect()

    const member = teamMembers.find((m) => m.userId === args.userId)

    if (!member) {
      throw new Error('Member not found')
    }

    await ctx.db.delete(member._id)

    // Log audit
    await logAudit(ctx, {
      userId: currentUserId,
      action: 'team:member_removed',
      resourceType: 'team',
      resourceId: args.teamId.toString(),
      status: 'success',
      metadata: { removedUserId: args.userId },
    })

    return { success: true }
  },
})

/**
 * Check if user has permission for action
 * Used in route protection
 */
export const hasPermission = query({
  args: {
    teamId: v.optional(v.id('teams')),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return false

    const userId = identity.subject

    if (!args.teamId) {
      // Global permission (user level)
      // Currently just check if authenticated
      return true
    }

    // Get user's role in team
    const role = await getUserRoleInTeam(ctx, args.teamId, userId)
    if (!role) return false

    // Check if role has permission
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
    return permissions.includes(args.permission)
  },
})

/**
 * Get audit log for team
 * Only owner/admin can view
 */
export const getTeamAuditLog = query({
  args: {
    teamId: v.id('teams'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Verify user has permission
    const userRole = await getUserRoleInTeam(ctx, args.teamId, userId)
    if (!['owner', 'admin'].includes(userRole)) {
      throw new Error('Forbidden')
    }

    const logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_team', (q) => q.eq('teamId', args.teamId))
      .order('desc')
      .take(args.limit || 50)

    return logs
  },
})

// ============= HELPERS =============

/**
 * Get user's role in a specific team
 */
async function getUserRoleInTeam(ctx: any, teamId: string, userId: string) {
  const members = await ctx.db
    .query('teamMembers')
    .withIndex('by_team', (q: any) => q.eq('teamId', teamId))
    .collect()

  const membership = members.find((m: any) => m.userId === userId)
  return membership?.role || null
}

/**
 * Log audit event
 */
async function logAudit(
  ctx: any,
  auditData: {
    userId: string
    action: string
    resourceType: string
    resourceId: string
    resourceName?: string
    status: 'success' | 'failure'
    metadata?: Record<string, any>
    errorMessage?: string
  },
) {
  return ctx.db.insert('auditLogs', {
    ...auditData,
    timestamp: Date.now(),
  })
}

/**
 * Generate random invite token
 */
function generateInviteToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}
