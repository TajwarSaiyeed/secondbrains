'use client'

import type React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useSession } from '@/lib/auth-client'

interface AddNoteFormProps {
  boardId: string
}

export function AddNoteForm({ boardId }: AddNoteFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const createNote = useMutation(api.notes.createNote)
  const { data: session } = useSession()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await createNote({
        boardId: boardId as any,
        content,
        authorId: session?.user?.id || '',
        authorName: session?.user?.name || 'Anonymous',
      })
      setContent('')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full gap-2 dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
      >
        <Plus className="h-4 w-4" />
        Add Note
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Add New Note</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="dark:text-white dark:hover:border-rose-500 dark:hover:bg-transparent dark:hover:text-rose-500"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
