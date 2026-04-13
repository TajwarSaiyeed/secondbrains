# SecondBrains - Feature Implementation Guide

**Status**: Phase 1 Complete (2FA, Teams + RBAC, Audit Logging)  
**Date**: April 12, 2026

---

## 📦 Phase 1: Security & Access Control (COMPLETE ✅)

### Overview

Phase 1 focuses on enterprise-grade security and access control, enabling SecondBrains to be used in organizations with compliance requirements.

### Features Implemented

#### 1️⃣ Two-Factor Authentication (2FA)

**Files Created**:
- `convex/auth2fa.ts` - Backend mutations/queries
- `components/auth/two-factor-setup.tsx` - Frontend UI

**What's New**:
- TOTP (Time-based One-Time Password) support  
- Backup codes for account recovery
- Compatible with Google Authenticator, Authy, Microsoft Authenticator
- Automatic time-window verification (±30 seconds for clock drift)

**Database Tables**:
```typescript
userAuthFactors: {
  userId: string,
  type: "totp" | "backup_codes",
  secret?: string,           // Base32 secret for TOTP
  backupCodes?: string[],    // Recovery codes
  verified: boolean,
  lastUsedAt?: number
}
```

**Available Mutations**:
```typescript
generateTotpSecret()           // Create qr code + secret
verifyAndEnable2FA(factorId, code)  // Enable after verification
verifyTotpLogin(userId, code)  // During login
verifyBackupCodeLogin(userId, code) // Recovery login
disable2FA()                   // Remove all 2FA
regenerateBackupCodes()        // Generate new recovery codes
```

**Usage Example**:
```typescript
// In settings page
const [open, setOpen] = useState(false);

return (
  <>
    <Button onClick={() => setOpen(true)}>Enable 2FA</Button>
    <TwoFactorSetup 
      open={open} 
      onOpenChange={setOpen}
      onSuccess={() => {
        toast.success("2FA enabled!");
        fetchUserSettings();
      }}
    />
  </>
);
```

**Flow**:
```
1. User clicks "Enable 2FA"
↓
2. Component requests QR code via generateTotpSecret()
↓
3. User scans with authenticator app
↓
4. Enter 6-digit code to verify
↓
5. Backend validates & creates backup codes
↓
6. User saves backup codes
↓
7. 2FA now required at login
```

---

#### 2️⃣ Team Management + RBAC

**Files Created**:
- `convex/teams.ts` - Backend mutations/queries

**What's New**:
- Hierarchical roles: owner > admin > member > viewer
- Permission-based access control
- Team-wide settings (require 2FA, data retention)
- Granular member management

**Database Tables**:
```typescript
teams: {
  name: string,
  description?: string,
  ownerId: string,
  settings: {
    allowPublicBoards: boolean,
    requireTwoFactor: boolean,  // Team-wide 2FA mandate
    dataRetentionDays?: number
  }
}

teamMembers: {
  teamId: v.id("teams"),
  userId: string,
  role: "owner" | "admin" | "member" | "viewer",
  permissions?: string[],      // Per-user overrides
  joinedAt: number,
  invitedBy?: string
}

teamInvites: {
  teamId: v.id("teams"),
  email: string,
  role: string,
  token: string,               // Used in email link
  expiresAt: number,          // 7 days
  accepted: boolean
}
```

**Permission Matrix**:
```
┌────────────────┬───────┬───────┬────────┬────────┐
│ Permission     │ Owner │ Admin │ Member │ Viewer │
├────────────────┼───────┼───────┼────────┼────────┤
│ Manage Team    │  ✅   │       │        │        │
│ Invite Member  │  ✅   │  ✅   │        │        │
│ Change Role    │  ✅   │       │        │        │
│ Create Board   │  ✅   │  ✅   │  ✅    │        │
│ Delete Board   │  ✅   │  ✅   │   *    │        │
│ View Board     │  ✅   │  ✅   │  ✅    │  ✅    │
│ Edit Content   │  ✅   │  ✅   │  ✅ *  │        │
│ View Audit Log │  ✅   │  ✅   │        │        │
└────────────────┴───────┴───────┴────────┴────────┘
* = if they created it or have explicit permission
```

**Available Mutations**:
```typescript
createTeam(name, description)
inviteTeamMember(teamId, email, role)
updateTeamMemberRole(teamId, userId, newRole)
removeTeamMember(teamId, userId)
```

**Available Queries**:
```typescript
getUserTeams()                          // All teams user is in
getTeamMembers(teamId)                  // Team roster
hasPermission(teamId, permission)       // ACL check
getTeamAuditLog(teamId, limit)         // Team activity
```

**Implementation**:
```typescript
// Create team
const teamId = await createTeam({
  name: "Engineering Team",
  description: "Our backend team"
});

// Invite member
await inviteTeamMember({
  teamId,
  email: "alice@company.com",
  role: "member"
});

// Check permission before action
const canDelete = await hasPermission({
  teamId,
  permission: "board:delete"
});

if (!canDelete) {
  throw new Error("Permission denied");
}
```

---

#### 3️⃣ Audit Logging

**Files Created**:
- `convex/audit.ts` - Comprehensive audit infrastructure

**What's New**:
- Log every action (create, update, delete)
- Track who did what, when, and with what changes
- Export logs for compliance
- Advanced search and filtering
- Analytics dashboard with charts

**Database Table**:
```typescript
auditLogs: {
  userId: string,
  action: string,               // "board:created", "note:deleted"
  resourceType: string,         // "board", "note", "user"
  resourceId: string,
  resourceName?: string,
  teamId?: v.id("teams"),
  boardId?: v.id("boards"),
  changes?: {
    before: Record<string, any>,
    after: Record<string, any>
  },
  ipAddress?: string,
  userAgent?: string,
  status: "success" | "failure",
  errorMessage?: string,
  timestamp: number,
  metadata?: any
}
```

**Available Queries**:
```typescript
getResourceAuditLog(type, id, limit)       // History of a resource
getUserAuditLog(userId, limit)             // User activity log
getTeamAuditLog(teamId, action?, dateRange)  // Team-wide log
searchAuditLogs(teamId, filters)           // Advanced search
getAuditStats(teamId, days)                // Analytics & stats
exportAuditLog(teamId, dateFrom, dateTo)   // CSV export
```

**Example Usage**:
```typescript
// Get all board changes
const history = await getResourceAuditLog({
  resourceType: "board",
  resourceId: boardId,
  limit: 50
});

// See user activity
const userActions = await getUserAuditLog({
  userId: "user123"
});

// Export for compliance
const {csv, filename} = await exportAuditLog({
  teamId,
  dateFrom: timestamp,
  dateTo: Date.now()
});
```

**Audit Log Viewer Component**:
```typescript
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";

// In admin dashboard page
<AuditLogViewer teamId={teamId} />
```

**Features**:
- 📊 Real-time statistics (total events, success rate, top actions)
- 📈 Activity timeline chart
- 🔍 Advanced filtering (action, user, status, date range)
- 📥 CSV export
- 🔑 Role-based access (only owner/admin can view)

---

## 🔧 Integration Checklist

### Backend Integration

#### 1. Add to Convex Index
```typescript
// In convex/_generated/api.ts (auto-generated, but verify)
import { auth2fa } from "./auth2fa";
import { teams } from "./teams";
import { audit } from "./audit";
```

#### 2. Verify Schema Deploy
```bash
npx convex deploy
# Should show new tables:
# ✅ userAuthFactors
# ✅ teams
# ✅ teamMembers
# ✅ teamInvites
# ✅ auditLogs
```

#### 3. Update Environment Variables
```bash
# No new env vars needed for Phase 1
# (TOTP uses standard algorithms)
```

### Frontend Integration

#### 1. Add 2FA to Settings Page
```typescript
// app/settings/page.tsx

import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SettingsPage() {
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const status2FA = useQuery(api.auth2fa.get2FAStatus);

  return (
    <div>
      <h2>Security</h2>
      
      {!status2FA?.enabled ? (
        <>
          <p>2FA Disabled</p>
          <Button onClick={() => setTwoFactorOpen(true)}>
            Enable 2FA
          </Button>
        </>
      ) : (
        <>
          <p>✅ 2FA Enabled</p>
          <p>{status2FA.backupCodesRemaining} backup codes remaining</p>
          <Button onClick={() => setTwoFactorOpen(true)}>
            Regenerate Codes
          </Button>
        </>
      )}

      <TwoFactorSetup 
        open={twoFactorOpen}
        onOpenChange={setTwoFactorOpen}
      />
    </div>
  );
}
```

#### 2. Add Teams to Admin Dashboard
```typescript
// app/admin/teams/page.tsx

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TeamsPage() {
  const teams = useQuery(api.teams.getUserTeams);

  if (!teams) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div key={team._id} className="border p-4 rounded">
          <h3>{team.name}</h3>
          <p>{team.memberCount} members • Role: {team.role}</p>
          <Link href={`/admin/teams/${team._id}`}>
            Manage Team
          </Link>
        </div>
      ))}
    </div>
  );
}
```

#### 3. Add Audit Log Viewer to Admin
```typescript
// app/admin/audit-logs/page.tsx

import { AuditLogViewer } from "@/components/admin/audit-log-viewer";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AuditLogsPage() {
  const teams = useQuery(api.teams.getUserTeams);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  if (!teams?.length) return <div>No teams</div>;

  return (
    <div>
      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
        <SelectTrigger>
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t._id} value={t._id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTeam && <AuditLogViewer teamId={selectedTeam} />}
    </div>
  );
}
```

#### 4. Update Login Flow
```typescript
// app/(auth)/sign-in/page.tsx

// After password verification
const {requiredFactors} = await verifyPassword(email, password);

if (requiredFactors.includes("totp")) {
  // Show 2FA modal
  <div>
    <p>Enter code from authenticator</p>
    <Input 
      value={code}
      onChange={(e) => setCode(e.target.value)}
      maxLength={6}
    />
    <Button onClick={async () => {
      await verifyTotpLogin({userId: user.id, code});
      // Continue login
    }}>
      Verify
    </Button>
  </div>
}
```

---

## 📋 Testing Checklist

### 2FA Testing
- [ ] Generate TOTP secret and QR code
- [ ] Scan with authenticator app
- [ ] Verify 6-digit code
- [ ] Save backup codes
- [ ] Login requires TOTP code
- [ ] Backup code works as fallback
- [ ] Incorrect code rejected
- [ ] Disable 2FA works

### Teams Testing
- [ ] Create team
- [ ] Invite member via email
- [ ] Accept invite
- [ ] Change member role
- [ ] Verify permissions enforced
- [ ] Only owner can manage team
- [ ] Member can't delete board (unless owner)
- [ ] Viewer can only read

### Audit Logging Testing
- [ ] All mutations logged
- [ ] Success/failure tracked
- [ ] Changes tracked (before/after)
- [ ] Statistics calculated correctly
- [ ] Export to CSV works
- [ ] Search filters work
- [ ] Only team admins can view logs
- [ ] Timestamp accurate

---

## ⚙️ Configuration Options

### Team Settings
```typescript
// Create team with settings
const teamId = await createTeam({
  name: "Secure Team",
  description: "Enterprise team with 2FA required"
});

// Can be modified later
await updateTeamSettings({
  teamId,
  settings: {
    allowPublicBoards: false,    // Block public sharing
    requireTwoFactor: true,      // All members must use 2FA
    dataRetentionDays: 90        // Auto-delete old audit logs
  }
});
```

###  Audit Log Retention
```typescript
// Teams can set retention policy
const team = {
  settings: {
    dataRetentionDays: 365  // Keep 1 year of logs
  }
};

// Convex runs cleanup job (configure in settings)
// Older logs auto-deleted after retention period
```

---

## 🚀 Deployment Notes

### Production Checklist
- [ ] TOTP library installed: `npm install speakeasy qrcode`
- [ ] Test 2FA with real authenticator app
- [ ] Verify HTTPS enabled (required for security headers)
- [ ] Test audit log export performance
- [ ] Set up log archival (export to S3 daily)
- [ ] Review permission matrix with security team
- [ ] Test team invite email delivery
- [ ] Verify backup codes are secure

### Production Recommended Settings
```typescript
const PRODUCTION_SETTINGS = {
  requireTwoFactor: process.env.NODE_ENV === "production",
  dataRetentionDays: 365,
  auditEnabled: true,
  backupCodeCount: 10
};
```

---

## 📊 Metrics to Monitor

### 2FA Adoption
- % of users with 2FA enabled
- Failed login attempts (potential attacks)
- Backup code usage (users losing access)

### Team Management
- Number of active teams
- Members per team (distribution)
- Invite acceptance rate
- Permission violation attempts

### Audit Compliance
- Log retention compliance
- Fastest growing action types
- User activity patterns
- Failed operation root causes

---

## 🐛 Troubleshooting

### Issue: TOTP code not verifying
**Solutions**:
1. Check device time is accurate (within 30 seconds)
2. Verify secret correctly entered in authenticator
3. Try code from 30 seconds before/after current time
4. Regenerate QR code and rescan

### Issue: Backup codes not working
**Solutions**:
1. Each code can only be used once
2. Verify code format (should match secret)
3. If all used, regenerate via regenerateBackupCodes()
4. Save codes in secure password manager

### Issue: Team member can't access board
**Solutions**:
1. Check member role: `getTeamMembers(teamId)`
2. Verify permission: `hasPermission(teamId, "board:read")`
3. Check if user is in correct team
4. Audit log might show why: `getTeamAuditLog(teamId)`

### Issue: Audit logs not appearing
**Solutions**:
1. Verify you're team owner/admin
2. Check timestamp filters
3. Confirm action name matches (is it "board:created" or "board_created"?)
4. Check if action actually succeeded

---

## 🎯 Next Steps (Phase 2)

After Phase 1 stabilizes, Phase 2 includes:
- [ ] API Rate Limiting & Quotas
- [ ] Push Notifications (Web + Mobile)
- [ ] Multi-LLM Support

See ARCHITECTURE.md for detailed roadmap.

---

**Questions?** Check the troubleshooting sections in ARCHITECTURE.md or the API docs.
