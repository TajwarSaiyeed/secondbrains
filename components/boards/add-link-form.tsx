'use client'

import type React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X } from 'lucide-react'
import { useMutation, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useSession } from '@/lib/auth-client'

interface AddLinkFormProps {
  boardId: string
}

export function AddLinkForm({ boardId }: AddLinkFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const insertLink = useMutation(api.links.insertLinkAction)
  const triggerWebScrape = useAction(api.inngestTrigger.triggerWebScrape)
  const { data: session } = useSession()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const newLinkId = await insertLink({
        boardId: boardId as any,
        url,
        title,
        description,
        authorId: session?.user?.id || '',
      })

      if (session?.user?.id) {
        await triggerWebScrape({
          url,
          boardId: boardId as any,
          authorId: session.user.id,
          linkId: newLinkId,
        })
      }

      setUrl('')
      setTitle('')
      setDescription('')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link')
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
        Add Link
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Add New Link</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Link title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the link..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={isLoading}
            />
          </div>
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
            <Button
              type="submit"
              disabled={isLoading || !url.trim() || !title.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Link'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
