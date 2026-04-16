import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  user: defineTable({
    userId: v.string(), // matches Better Auth user.id
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
    // App-specific fields (not from Better Auth)
    role: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    telegram: v.optional(v.string()),
    totalPoints: v.optional(v.number()),
  })
    .index('by_email', ['email'])
    .index('by_userId', ['userId']),

  // User Settings Profile extended
  userSettings: defineTable({
    userId: v.string(),
    emailNotifications: v.boolean(),
    aiSuggestions: v.boolean(),
  }).index('by_user', ['userId']),

  // Boards (Workspaces)
  boards: defineTable({
    title: v.string(),
    description: v.string(),
    ownerId: v.string(),
    inviteToken: v.optional(v.string()),
    filesData: v.optional(v.any()), // Migrated from JSON
    linksData: v.optional(v.any()),
    notesData: v.optional(v.any()),
  })
    .index('by_owner', ['ownerId'])
    .index('by_invite', ['inviteToken']),

  boardMembers: defineTable({
    boardId: v.id('boards'),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('owner'), v.literal('member')),
    joinedAt: v.number(),
  })
    .index('by_board', ['boardId'])
    .index('by_user', ['userId']),

  // Documents & Notes (Contains Vector Search target)
  notes: defineTable({
    boardId: v.id('boards'),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    sourceFileId: v.optional(v.string()),
    sourceFileName: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())), // Native Vector embedding
  })
    .index('by_board', ['boardId'])
    .index('by_author', ['authorId'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['boardId'],
    })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 3072,
      filterFields: ['boardId'],
    }),

  links: defineTable({
    boardId: v.id('boards'),
    url: v.string(),
    title: v.string(),
    description: v.string(),
    scrapedContent: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed'),
      ),
    ),
    authorId: v.string(),
    authorName: v.string(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index('by_board', ['boardId'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['boardId'],
    })
    .searchIndex('search_description', {
      searchField: 'description',
      filterFields: ['boardId'],
    })
    .searchIndex('search_scraped', {
      searchField: 'scrapedContent',
      filterFields: ['boardId'],
    })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 3072,
      filterFields: ['boardId'],
    }),

  // Uploaded Files Meta
  fileMetas: defineTable({
    boardId: v.id('boards'),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    storageId: v.id('_storage'), // Convex native storage ID
    url: v.string(),
    uploadedBy: v.string(),
    extractedContent: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())), // Vector embedding for file content
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('extracting'),
        v.literal('summarizing'),
        v.literal('embedding'),
        v.literal('completed'),
        v.literal('failed'),
      ),
    ),
    statusMessage: v.optional(v.string()),
  })
    .index('by_board', ['boardId'])
    .index('by_uploader', ['uploadedBy'])
    .index('by_status', ['status'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['boardId'],
    })
    .searchIndex('search_content', {
      searchField: 'extractedContent',
      filterFields: ['boardId'],
    })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 3072,
      filterFields: ['boardId'],
    }),

  // File Extraction Event Log (for real-time UI toasts)
  fileExtractionEvents: defineTable({
    userId: v.string(),
    boardId: v.id('boards'),
    fileId: v.id('fileMetas'),
    fileName: v.string(),
    status: v.string(), // "started", "extracting", "summarizing", "embedding", "completed", "failed"
    message: v.string(),
    read: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_board', ['boardId'])
    .index('by_file', ['fileId'])
    .index('by_user_read', ['userId', 'read']),

  aiSummaries: defineTable({
    boardId: v.id('boards'),
    content: v.string(),
    generatedBy: v.string(),
  }).index('by_board', ['boardId']),

  pendingInvites: defineTable({
    boardId: v.id('boards'),
    email: v.string(),
    invitedBy: v.string(),
    message: v.optional(v.string()),
  })
    .index('by_board', ['boardId'])
    .index('by_email', ['email']),

  messages: defineTable({
    boardId: v.id('boards'),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    createdAt: v.number(),
    replyToId: v.optional(v.id('messages')),
    audioUrl: v.optional(v.string()), // For voice messages
    audioStorageId: v.optional(v.id('_storage')),
  })
    .index('by_board', ['boardId'])
    .index('by_reply', ['replyToId'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['boardId'],
    }),

  answers: defineTable({
    boardId: v.id('boards'),
    messageId: v.id('messages'),
    markedById: v.string(),
    markedAt: v.number(),
  })
    .index('by_board', ['boardId'])
    .index('by_message', ['messageId']),

  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal('board_invite'),
      v.literal('board_joined'),
      v.literal('message_mention'),
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
  }).index('by_user', ['userId']),

  // ========== TWO-FACTOR AUTHENTICATION (2FA) ==========
  userAuthFactors: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal('totp'),
      v.literal('sms'),
      v.literal('email'),
      v.literal('backup_codes'),
    ),
    secret: v.optional(v.string()), // Base32-encoded secret for TOTP
    phoneNumber: v.optional(v.string()), // For SMS 2FA
    backupCodes: v.optional(v.array(v.string())), // Recovery codes
    verified: v.boolean(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  // ========== TEAMS & RBAC ==========
  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(),
    createdAt: v.number(),
    settings: v.object({
      allowPublicBoards: v.boolean(),
      requireTwoFactor: v.boolean(),
      dataRetentionDays: v.optional(v.number()),
    }),
  }).index('by_owner', ['ownerId']),

  teamMembers: defineTable({
    teamId: v.id('teams'),
    userId: v.string(),
    role: v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('member'),
      v.literal('viewer'),
    ),
    permissions: v.optional(v.array(v.string())), // Custom per-user overrides
    joinedAt: v.number(),
    invitedBy: v.optional(v.string()),
  })
    .index('by_team', ['teamId'])
    .index('by_user', ['userId']),

  teamInvites: defineTable({
    teamId: v.id('teams'),
    email: v.string(),
    role: v.string(),
    invitedBy: v.string(),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    accepted: v.boolean(),
  })
    .index('by_team', ['teamId'])
    .index('by_email', ['email']),

  // ========== AUDIT LOGGING ==========
  auditLogs: defineTable({
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
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index('by_user', ['userId'])
    .index('by_resource', ['resourceType', 'resourceId'])
    .index('by_timestamp', ['timestamp'])
    .index('by_team', ['teamId']),
})
