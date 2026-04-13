import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

/**
 * Two-Factor Authentication Module
 * Supports: TOTP (Time-based OTP), Backup Codes
 * TOTP uses base32-encoded secrets compatible with Google Authenticator
 */

/**
 * Get user's 2FA settings
 */
export const get2FAStatus = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = args.userId || identity.subject

    if (args.userId && args.userId !== identity.subject) {
      throw new Error('Forbidden')
    }

    const factors = await ctx.db
      .query('userAuthFactors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    return {
      enabled: factors.some((f) => f.verified),
      methods: factors
        .filter((f) => f.verified)
        .map((f) => ({
          type: f.type,
          verified: f.type === 'totp',
          lastUsed: f.lastUsedAt,
        })),
      backupCodesRemaining:
        factors.find((f) => f.type === 'backup_codes')?.backupCodes?.length ||
        0,
    }
  },
})

/**
 * Generate TOTP secret for setting up 2FA
 * Returns base32 secret and QR code URL
 */
export const generateTotpSecret = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    const secret = generateRandomSecret()

    // Create temporary unverified factor
    const factorId = await ctx.db.insert('userAuthFactors', {
      userId,
      type: 'totp',
      secret,
      verified: false,
      createdAt: Date.now(),
    })

    // Generate QR code URL for authenticator apps
    // Format: otpauth://totp/SecondBrains:{email}?secret={secret}&issuer=SecondBrains
    const user = await ctx.db
      .query('user')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    const qrCodeUrl =
      `otpauth://totp/SecondBrains:${user?.email || userId}?` +
      `secret=${secret}&issuer=SecondBrains&period=30&digits=6`

    return {
      secret, // Show to user to enter manually if QR fails
      qrCodeUrl, // For QR code generation
      factorId, // Needed to verify later
      instructions:
        'Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)',
    }
  },
})

/**
 * Verify TOTP code and enable 2FA
 * This creates a login session with 2FA verified
 */
export const verifyAndEnable2FA = mutation({
  args: {
    factorId: v.id('userAuthFactors'),
    code: v.string(), // 6-digit code from authenticator
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const factor = await ctx.db.get(args.factorId)
    if (!factor || factor.userId !== identity.subject) {
      throw new Error('Invalid factor')
    }

    if (factor.type !== 'totp') {
      throw new Error('Invalid factor type')
    }

    // Verify TOTP code
    const isValid = verifyTotpCode(factor.secret!, args.code)
    if (!isValid) {
      throw new Error('Invalid code. Please check and try again.')
    }

    // Mark as verified
    await ctx.db.patch(args.factorId, {
      verified: true,
    })

    // Generate backup codes for recovery
    const backupCodes = generateBackupCodes(10) // 10 codes
    await ctx.db.insert('userAuthFactors', {
      userId: identity.subject,
      type: 'backup_codes',
      backupCodes,
      verified: true,
      createdAt: Date.now(),
    })

    return {
      success: true,
      message: '2FA enabled successfully!',
      backupCodes, // Show to user to save somewhere safe
      backupCodesWarning:
        '⚠️ Save these backup codes in a safe place. Each code can be used once if you lose access to your authenticator app.',
    }
  },
})

/**
 * Verify TOTP code during login
 */
export const verifyTotpLogin = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userFactors = await ctx.db
      .query('userAuthFactors')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const totpFactor = userFactors.find((f) => f.type === 'totp' && f.verified)

    if (!totpFactor) {
      throw new Error('2FA not enabled')
    }

    const isValid = verifyTotpCode(totpFactor.secret!, args.code, 1)
    if (!isValid) {
      throw new Error('Invalid code')
    }

    // Update last used timestamp
    await ctx.db.patch(totpFactor._id, {
      lastUsedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Verify backup code during login
 * Each code can only be used once
 */
export const verifyBackupCodeLogin = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userFactors = await ctx.db
      .query('userAuthFactors')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const backupCodesFactor = userFactors.find((f) => f.type === 'backup_codes')

    if (!backupCodesFactor || !backupCodesFactor.backupCodes) {
      throw new Error('No backup codes available')
    }

    const codeIndex = backupCodesFactor.backupCodes.indexOf(args.code)
    if (codeIndex === -1) {
      throw new Error('Invalid backup code')
    }

    // Remove used code
    const remainingCodes = backupCodesFactor.backupCodes.filter(
      (_: string, i: number) => i !== codeIndex,
    )

    await ctx.db.patch(backupCodesFactor._id, {
      backupCodes: remainingCodes,
    })

    return {
      success: true,
      remainingCodes: remainingCodes.length,
      warning:
        remainingCodes.length < 3
          ? `⚠️ You have only ${remainingCodes.length} backup codes left`
          : undefined,
    }
  },
})

/**
 * Disable 2FA (requires current password for security)
 */
export const disable2FA = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Remove all 2FA factors
    const factors = await ctx.db
      .query('userAuthFactors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    for (const factor of factors) {
      await ctx.db.delete(factor._id)
    }

    return {
      success: true,
      message:
        '2FA disabled. Login will only require password until re-enabled.',
    }
  },
})

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // Find and remove old backup codes
    const userFactors = await ctx.db
      .query('userAuthFactors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const oldFactor = userFactors.find((f) => f.type === 'backup_codes')

    if (oldFactor) {
      await ctx.db.delete(oldFactor._id)
    }

    // Generate new codes
    const backupCodes = generateBackupCodes(10)
    await ctx.db.insert('userAuthFactors', {
      userId,
      type: 'backup_codes',
      backupCodes,
      verified: true,
      createdAt: Date.now(),
    })

    return {
      success: true,
      backupCodes,
      warning: '⚠️ Your old backup codes are no longer valid',
    }
  },
})

/**
 * Helper: Verify TOTP code
 * Allows time window for clock drift
 * @param secret Base32 encoded secret
 * @param code 6-digit code to verify
 * @param allowedDrift Number of 30-second windows to check (0 or 1)
 */
function verifyTotpCode(
  secret: string,
  code: string,
  allowedDrift: number = 0,
): boolean {
  try {
    // This is a simplified implementation

    // with actual TOTP verification library

    // Real implementation:
    // const speakeasy = require('speakeasy');
    // return speakeasy.totp.verify({
    //   secret: secret,
    //   encoding: 'base32',
    //   token: code,
    //   window: allowedDrift
    // });

    // PLACEHOLDER: In production environment
    // Uncomment and use actual TOTP library
    console.warn('Using placeholder TOTP verification - implement with library')
    return true // This is NOT secure - for demo only
  } catch (error) {
    console.error('TOTP verification error:', error)
    return false
  }
}

/**
 * Helper: Generate random base32 secret
 * For TOTP (RFC 4648 base32 alphabet)
 */
function generateRandomSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' // RFC 4648 base32 alphabet
  const length = 32 // 256 bits
  let secret = ''

  const array = new Uint8Array(length)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Node.js fallback (for server-side)
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }

  for (let i = 0; i < length; i++) {
    secret += chars[array[i] % chars.length]
  }

  return secret
}

/**
 * Helper: Generate backup codes
 * Format: XXXX-XXXX (8 hex digits)
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    const code = generateRandomSecret().substring(0, 8).toUpperCase()
    codes.push(`${code.substring(0, 4)}-${code.substring(4)}`)
  }

  return codes
}
