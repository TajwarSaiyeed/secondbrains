'use client'

import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NoteSourceItem, LinkSourceItem, FileSourceItem } from './source-item'
import { AddNoteForm } from './add-note-form'
import { AddLinkForm } from './add-link-form'
import { AddFileForm } from './add-file-form'
import { DataDetailsModal } from './data-details-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Link as LinkIcon, Files, Plus } from 'lucide-react'

interface SourcesPanelProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  boardId: string
  notes: any[]
  links: any[]
  files: any[]
  sourceCount: number
}

export function SourcesPanel({
  activeTab,
  setActiveTab,
  boardId,
  notes,
  links,
  files,
  sourceCount,
}: SourcesPanelProps) {
  // Auto‑scroll to the selected form when the tab changes
  useEffect(() => {
    const formId = `add-${activeTab}-form`
    const formEl = document.getElementById(formId)
    formEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeTab])

  return (
    <div className="notebook-panel">
      <div className="notebook-panel-header">
        <div className="flex items-center gap-2">
          <Files className="h-4 w-4" />
          <span className="text-sm font-semibold">Sources</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {sourceCount}
        </Badge>
      </div>

      <div className="notebook-panel-body">
        {/* Add Source Button */}
        <Button
          variant="outline"
          size="sm"
          className="mb-3 w-full gap-1.5 text-xs"
          onClick={() => {
            const formEl = document.getElementById(`add-${activeTab}-form`)
            formEl?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            })
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add source
        </Button>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" title="Notes">
              <FileText className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger value="links" title="Links">
              <LinkIcon className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger value="files" title="Files">
              <Files className="h-3.5 w-3.5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-3 space-y-1">
            <div id="add-notes-form" className="mb-3">
              <AddNoteForm boardId={boardId} />
            </div>
            {notes.map((note) => (
              <div key={note._id} className="group relative">
                <NoteSourceItem note={note as any} onClick={() => {}} />
                <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <DataDetailsModal
                    title={`Note by ${note.authorName}`}
                    type="note"
                    content={note.content}
                  />
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-xs italic">
                No notes yet. Add one above.
              </p>
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-3 space-y-1">
            <div id="add-links-form" className="mb-3">
              <AddLinkForm boardId={boardId} />
            </div>
            {links.map((link) => (
              <div key={link._id} className="group relative">
                <LinkSourceItem link={link as any} onClick={() => {}} />
                <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <DataDetailsModal
                    title={link.title || 'Untitled Link'}
                    type="link"
                    content={link.url}
                    metadata={{
                      title: link.title,
                      status: link.status,
                    }}
                  />
                </div>
              </div>
            ))}
            {links.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-xs italic">
                No links yet. Add one above.
              </p>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-3 space-y-1">
            <div id="add-files-form" className="mb-3">
              <AddFileForm boardId={boardId} />
            </div>
            {files.map((file) => (
              <div key={file._id} className="group relative">
                <FileSourceItem file={file as any} onClick={() => {}} />
                <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <DataDetailsModal
                    title={file.name}
                    type="file"
                    content={
                      file.extractedContent || 'No content extracted yet.'
                    }
                    metadata={{ size: file.size, type: file.type }}
                  />
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-xs italic">
                No files yet. Upload one above.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
