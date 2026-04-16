'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info, Code, FileText, Fingerprint } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface DataDetailsModalProps {
  title: string
  type: 'note' | 'link' | 'file'
  content: string
  chunks?: string[]
  embedding?: number[]
  metadata?: any
}

export function DataDetailsModal({
  title,
  type,
  content,
  chunks = [],
  embedding = [],
  metadata = {},
}: DataDetailsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="View Details"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="text-primary h-5 w-5" />
            Data Item Details
          </DialogTitle>
          <DialogDescription>
            Technical properties, chunks, and embeddings for "{title}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="chunks" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chunks">Chunks ({chunks.length})</TabsTrigger>
            <TabsTrigger value="embeddings">Embedding Vector</TabsTrigger>
            <TabsTrigger value="raw">Raw Content</TabsTrigger>
          </TabsList>

          <TabsContent value="chunks" className="space-y-4 pt-4">
            {chunks.length > 0 ? (
              chunks.map((chunk, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded-md border p-3 text-sm"
                >
                  <Badge variant="outline" className="mb-2">
                    Chunk {index + 1}
                  </Badge>
                  <p className="whitespace-pre-wrap">{chunk}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-8 text-center">
                No chunks generated yet.
              </p>
            )}
          </TabsContent>

          <TabsContent value="embeddings" className="pt-4">
            <div className="max-h-[300px] overflow-x-auto rounded-md bg-slate-950 p-4 font-mono text-[10px] text-slate-50">
              {embedding.length > 0 ? (
                `[${embedding.join(', ')}]`
              ) : (
                <p className="text-slate-400">No embedding vector found.</p>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Dimensions: {embedding.length}
            </p>
          </TabsContent>

          <TabsContent value="raw" className="pt-4">
            <div className="bg-muted max-h-[300px] overflow-y-auto rounded-md border p-4 text-sm whitespace-pre-wrap">
              {content}
            </div>
            {metadata && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold">Metadata</h4>
                <pre className="bg-muted overflow-x-auto rounded p-2 text-xs">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
