'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Search,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const results = useQuery(
    api.globalSearch.performGlobalSearch,
    searchQuery.trim() !== '' ? { searchQuery } : 'skip', // Skip the query if empty
  )

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
    setSearchQuery('')
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="bg-muted/50 text-muted-foreground relative h-9 w-full justify-start rounded-[0.5rem] text-sm font-normal shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search secondbrains...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-6 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {searchQuery.trim() === '' && (
            <CommandEmpty>Type to search...</CommandEmpty>
          )}
          {searchQuery.trim() !== '' && results === undefined && (
            <CommandEmpty>
              <div className="flex items-center justify-center p-4">
                <Loader2 className="text-muted-foreground mr-2 h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            </CommandEmpty>
          )}
          {results &&
            results.notes.length === 0 &&
            results.messages.length === 0 &&
            results.links.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

          {results && results.notes.length > 0 && (
            <CommandGroup heading="Notes">
              {results.notes.map((note) => (
                <CommandItem
                  key={note._id}
                  value={note._id + note.content}
                  onSelect={() => {
                    runCommand(() => router.push(`/board/${note.boardId}`))
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="truncate">
                      {note.content.substring(0, 50)}...
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.notes.length > 0 && <CommandSeparator />}

          {results && results.links.length > 0 && (
            <CommandGroup heading="Links">
              {results.links.map((link) => (
                <CommandItem
                  key={link._id}
                  value={link._id + link.title}
                  onSelect={() => {
                    runCommand(() => router.push(`/board/${link.boardId}`))
                  }}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="truncate font-medium">{link.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.links.length > 0 && <CommandSeparator />}

          {results && results.messages.length > 0 && (
            <CommandGroup heading="Discussions">
              {results.messages.map((msg) => (
                <CommandItem
                  key={msg._id}
                  value={msg._id + msg.content}
                  onSelect={() => {
                    runCommand(() => router.push(`/board/${msg.boardId}`))
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="truncate text-sm">
                      {msg.content.substring(0, 50)}...
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
