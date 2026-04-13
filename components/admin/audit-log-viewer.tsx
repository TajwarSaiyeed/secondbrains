'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface AuditLogViewerProps {
  teamId: string
}

export function AuditLogViewer({ teamId }: AuditLogViewerProps) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [action, setAction] = useState<string>('')
  const [status, setStatus] = useState<'success' | 'failure' | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Get audit stats
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
  const stats = useQuery(api.audit.getAuditStats, {
    teamId: teamId as any,
    days: daysMap[dateRange],
  })

  // Get team audit log
  const logs = useQuery(api.audit.getTeamAuditLog, {
    teamId: teamId as any,
    action: action || undefined,
    limit: 1000, // Fetch more for client-side filtering
  })

  const exportData = useQuery(api.audit.exportAuditLog, {
    teamId: teamId as any,
  })

  // Filter logs client-side
  const filteredLogs = logs
    ?.filter((log) => {
      if (status && log.status !== status) return false
      if (
        searchQuery &&
        !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.userId.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
    .slice((page - 1) * pageSize, page * pageSize)

  const handleExport = () => {
    if (!exportData) {
      toast.error('Failed to load export data')
      return
    }

    try {
      const element = document.createElement('a')
      element.setAttribute(
        'href',
        `data:text/csv;charset=utf-8,${encodeURIComponent(exportData.csv)}`,
      )
      element.setAttribute('download', exportData.filename)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      toast.success(`Exported ${exportData.totalRecords} records`)
    } catch (err) {
      toast.error('Failed to export')
    }
  }

  if (!stats || !logs) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-gray-500">
              Last {daysMap[dateRange]} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successRate}
            </div>
            <p className="text-xs text-gray-500">
              {stats.successfulActions} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedActions}
            </div>
            <p className="text-xs text-gray-500">Actions that failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Top Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="truncate text-lg font-bold">
              {stats.topActions[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-gray-500">
              {stats.topActions[0]?.count || 0} times
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topActions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Log</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by action, user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="h-9"
              />
            </div>

            <Select
              value={dateRange}
              onValueChange={(v: any) => setDateRange(v)}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as any)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log._id} className="border-gray-100">
                        <TableCell className="text-xs whitespace-nowrap text-gray-500">
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.action}
                        </TableCell>
                        <TableCell className="truncate text-xs">
                          {log.userId.substring(0, 20)}...
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="rounded bg-gray-100 px-2 py-1">
                            {log.resourceType}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Success</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Failed</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {log.errorMessage ? (
                            <span className="line-clamp-1 max-w-xs text-red-600">
                              {log.errorMessage}
                            </span>
                          ) : (
                            <span className="text-gray-400">No errors</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-gray-600">
                  Showing {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, logs.length)} of {logs.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage(
                        Math.min(page + 1, Math.ceil(logs.length / pageSize)),
                      )
                    }
                    disabled={page >= Math.ceil(logs.length / pageSize)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
