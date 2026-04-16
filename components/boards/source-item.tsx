'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Link as LinkIcon,
  File,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SourceItemBase {
  title: string
  subtitle?: string
  icon: React.ReactNode
  authorName: string
  createdAt: Date
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  className?: string
  onClick?: () => void
}

function SourceItem({
  title,
  subtitle,
  icon,
  authorName,
  createdAt,
  status,
  className,
  onClick,
}: SourceItemBase) {
  return (
    <div
      className={cn('source-item', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Icon */}
      <div className="source-icon bg-muted text-muted-foreground">{icon}</div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {authorName} · {formatDistanceToNow(createdAt, { addSuffix: true })}
        </p>
      </div>

      {/* Status indicator */}
      {status === 'pending' || status === 'processing' ? (
        <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
      ) : status === 'failed' ? (
        <AlertCircle className="text-destructive h-3.5 w-3.5" />
      ) : subtitle ? (
        <span className="text-muted-foreground text-xs">{subtitle}</span>
      ) : null}
    </div>
  )
}

// Convenience wrappers for each source type

export function NoteSourceItem({
  note,
  onClick,
}: {
  note: {
    _id?: string
    id?: string
    content: string
    authorName: string
    _creationTime?: number
    createdAt?: string
  }
  onClick?: () => void
}) {
  const preview =
    note.content.length > 60
      ? note.content.substring(0, 60) + '…'
      : note.content

  return (
    <SourceItem
      title={preview}
      icon={<FileText className="h-3.5 w-3.5" />}
      authorName={note.authorName}
      createdAt={new Date(note.createdAt || note._creationTime || Date.now())}
      onClick={onClick}
    />
  )
}

export function LinkSourceItem({
  link,
  onClick,
}: {
  link: {
    _id?: string
    id?: string
    url: string
    title: string
    authorName?: string
    _creationTime?: number
    createdAt?: string
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  }
  onClick?: () => void
}) {
  return (
    <SourceItem
      title={link.title || link.url}
      subtitle={link.status === 'completed' ? undefined : link.status}
      icon={<LinkIcon className="h-3.5 w-3.5" />}
      authorName={link.authorName || 'Unknown'}
      createdAt={new Date(link._creationTime || link.createdAt || Date.now())}
      status={link.status}
      onClick={onClick}
    />
  )
}

export function FileSourceItem({
  file,
  onClick,
}: {
  file: {
    _id?: string
    id?: string
    name: string
    type: string
    uploadedBy: string
    uploadedAt?: string
    _creationTime?: number
  }
  onClick?: () => void
}) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileText className="h-3.5 w-3.5" />
    if (type.includes('pdf') || type.includes('document'))
      return <FileText className="h-3.5 w-3.5" />
    if (type.startsWith('video/')) return <FileText className="h-3.5 w-3.5" />
    if (type.startsWith('audio/')) return <FileText className="h-3.5 w-3.5" />
    return <File className="h-3.5 w-3.5" />
  }

  return (
    <SourceItem
      title={file.name}
      icon={getFileIcon(file.type)}
      authorName={file.uploadedBy}
      createdAt={new Date(file._creationTime || file.uploadedAt || Date.now())}
      onClick={onClick}
    />
  )
}
