'use client'

import type React from 'react'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  X,
  File,
  ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface QueuedFile {
  file: File
  id: string
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

export function AddFileForm({ boardId }: { boardId: string }) {
  const [dragActive, setDragActive] = useState(false)
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFileMetaData = useMutation(api.files.saveFileMetaData)

  const MAX_FILES = 30 // Limit to 30 files at a time

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      addFilesToQueue(newFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      addFilesToQueue(newFiles)
    }
  }

  const uploadFile = async (queuedFile: QueuedFile) => {
    try {
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === queuedFile.id ? { ...f, status: 'uploading' } : f,
        ),
      )

      const uploadUrl = await generateUploadUrl()

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': queuedFile.file.type },
        body: queuedFile.file,
      })

      if (!response.ok) throw new Error('Upload failed')

      const { storageId } = await response.json()

      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === queuedFile.id ? { ...f, status: 'processing' } : f,
        ),
      )

      await saveFileMetaData({
        boardId: boardId as any,
        name: queuedFile.file.name,
        size: queuedFile.file.size,
        type: queuedFile.file.type,
        storageId: storageId,
      })
    } catch (err) {
      console.error(err)
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === queuedFile.id
            ? { ...f, status: 'error', error: (err as Error).message }
            : f,
        ),
      )
    }
  }

  const processQueue = async () => {
    setIsProcessing(true)
    const waitingFiles = queuedFiles.filter((f) => f.status === 'waiting')
    for (const file of waitingFiles) {
      await uploadFile(file)
    }
    setIsProcessing(false)
  }

  const addFilesToQueue = (newFiles: File[]) => {
    const currentCount = queuedFiles.filter(
      (f) => f.status !== 'completed' && f.status !== 'error',
    ).length
    const remainingSlots = MAX_FILES - currentCount

    if (remainingSlots <= 0) {
      setError(
        `Maximum ${MAX_FILES} files can be uploaded at once. Please wait for current uploads to complete.`,
      )
      return
    }

    const filesToAdd = newFiles.slice(0, remainingSlots)
    const newQueuedFiles: QueuedFile[] = filesToAdd.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'waiting',
      progress: 0,
    }))

    setQueuedFiles((prev) => [...prev, ...newQueuedFiles])
    setError('')

    if (remainingSlots < newFiles.length) {
      setError(
        `Only ${filesToAdd.length} files added. Maximum ${MAX_FILES} files can be uploaded at once.`,
      )
    }
  }

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((qf) => qf.id !== id))
  }

  const updateFileStatus = (id: string, updates: Partial<QueuedFile>) => {
    setQueuedFiles((prev) =>
      prev.map((qf) => (qf.id === id ? { ...qf, ...updates } : qf)),
    )
  }

  const canUpload =
    queuedFiles.filter((f) => f.status !== 'completed' && f.status !== 'error')
      .length > 0 && !isProcessing

  function getFileIcon(file: File) {
    if (file.type.startsWith('image/'))
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (file.type === 'application/pdf')
      return <FileText className="h-4 w-4 text-red-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getStatusIcon(status: QueuedFile['status']) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  function getStatusText(file: QueuedFile) {
    if (file.error) return file.error
    switch (file.status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Waiting...'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-cyan-600" />
          Upload Files (Max {MAX_FILES} at a time)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20">
            {error}
          </div>
        )}

        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragActive
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20'
              : 'border-gray-300 hover:border-cyan-400 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            Drag and drop up to {MAX_FILES} files here, or click to select
          </p>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button
              className="gap-1 bg-transparent dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={
                queuedFiles.filter(
                  (f) => f.status !== 'completed' && f.status !== 'error',
                ).length >= MAX_FILES
              }
            >
              <span>Choose Files</span>
            </Button>
          </Label>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            name="files"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.csv,.xlsx"
          />
        </div>

        {queuedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Queue ({queuedFiles.length})
            </Label>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {queuedFiles.map((queuedFile) => (
                <div
                  key={queuedFile.id}
                  className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {getFileIcon(queuedFile.file)}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {queuedFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(queuedFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(queuedFile.status)}
                      {queuedFile.status === 'waiting' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(queuedFile.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress
                      value={queuedFile.progress}
                      className="h-2 flex-1"
                    />
                    <span className="min-w-0 text-xs text-gray-600">
                      {getStatusText(queuedFile)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full bg-cyan-600 hover:bg-cyan-700"
          disabled={!canUpload}
          onClick={processQueue}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing{' '}
              {
                queuedFiles.filter(
                  (f) => f.status === 'uploading' || f.status === 'processing',
                ).length
              }{' '}
              files...
            </>
          ) : (
            `Upload ${
              queuedFiles.filter((f) => f.status === 'waiting').length > 0
                ? `${queuedFiles.filter((f) => f.status === 'waiting').length} File${
                    queuedFiles.filter((f) => f.status === 'waiting').length > 1
                      ? 's'
                      : ''
                  }`
                : 'Files'
            }`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
