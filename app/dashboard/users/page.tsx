'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Search,
  Crown,
  Shield,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

function formatRole(role?: string) {
  if (!role || role === 'user')
    return {
      label: 'User',
      icon: <User className="h-3 w-3" />,
      variant: 'secondary' as const,
    }
  if (role === 'admin')
    return {
      label: 'Admin',
      icon: <Shield className="h-3 w-3" />,
      variant: 'default' as const,
    }
  if (role === 'super_admin')
    return {
      label: 'Super Admin',
      icon: <Crown className="h-3 w-3" />,
      variant: 'destructive' as const,
    }
  return {
    label: role,
    icon: <User className="h-3 w-3" />,
    variant: 'outline' as const,
  }
}

export default function UsersPage() {
  const { data: session } = useAuth()
  const users = useQuery(api.users.listWithCounts)
  const [search, setSearch] = useState('')

  if (!session && session !== undefined) {
    redirect('/login')
  }

  const filtered = useMemo(() => {
    if (!users) return []
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q),
    )
  }, [users, search])

  if (!users) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-10 w-1/3" />
        <Skeleton className="mb-8 h-10 w-1/2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-4 h-14 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Users className="text-primary h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {users.length} registered user{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[260px]">User</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Boards</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No users found matching &quot;{search}&quot;
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const roleInfo = formatRole(u.role)
                const initials = u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {u.image ? (
                            <AvatarImage src={u.image} alt={u.name} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate text-sm md:table-cell">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={roleInfo.variant}
                        className="gap-1 text-xs"
                      >
                        {roleInfo.icon}
                        {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3 text-sm">
                        <span
                          className="text-muted-foreground"
                          title="Boards owned"
                        >
                          <Crown className="text-primary mr-0.5 inline h-3.5 w-3.5" />
                          {u.ownedBoards}
                        </span>
                        <span
                          className="text-muted-foreground"
                          title="Total boards"
                        >
                          <Users className="text-muted-foreground mr-0.5 inline h-3.5 w-3.5" />
                          {u.totalBoards}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {formatDistanceToNow(new Date(u.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard?userId=${u.userId}`}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Boards
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
