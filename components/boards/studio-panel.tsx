'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Headphones,
  Presentation,
  Video,
  GitBranch,
  FileBarChart,
  CreditCard,
  HelpCircle,
  BarChart3,
  Table2,
  Sparkles,
  ChevronRight,
  StickyNote,
  Plus,
} from 'lucide-react'
import { AISummaryCard } from '@/components/boards/ai-summary-card'

interface StudioTile {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  available: boolean
}

const studioTiles: StudioTile[] = [
  {
    id: 'audio-overview',
    label: 'Audio Overview',
    icon: <Headphones className="h-4 w-4" />,
    color: 'text-purple-500',
    available: false,
  },
  {
    id: 'slide-deck',
    label: 'Slide Deck',
    icon: <Presentation className="h-4 w-4" />,
    color: 'text-blue-500',
    available: false,
  },
  {
    id: 'video-overview',
    label: 'Video Overview',
    icon: <Video className="h-4 w-4" />,
    color: 'text-cyan-500',
    available: false,
  },
  {
    id: 'mind-map',
    label: 'Mind Map',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'text-green-500',
    available: false,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileBarChart className="h-4 w-4" />,
    color: 'text-orange-500',
    available: false,
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'text-pink-500',
    available: false,
  },
  {
    id: 'quiz',
    label: 'Quiz',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'text-amber-500',
    available: false,
  },
  {
    id: 'infographic',
    label: 'Infographic',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'text-indigo-500',
    available: false,
  },
  {
    id: 'data-table',
    label: 'Data Table',
    icon: <Table2 className="h-4 w-4" />,
    color: 'text-teal-500',
    available: false,
  },
]

interface StudioPanelProps {
  boardId: string
  aiSummary?: {
    id: string
    content: string
    generatedAt: string
    generatedBy: string
  }
  sourceCount: number
}

export function StudioPanel({
  boardId,
  aiSummary,
  sourceCount,
}: StudioPanelProps) {
  const [generatedItems, setGeneratedItems] = useState<string[]>([])

  const handleTileClick = (tile: StudioTile) => {
    if (!tile.available) {
      toast.info(`${tile.label} coming soon!`)
      return
    }
    // TODO: trigger generation for this tile
  }

  return (
    <div className="notebook-panel">
      {/* Panel Header */}
      <div className="notebook-panel-header">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary h-4 w-4" />
          <span className="text-sm font-semibold">Studio</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Beta
        </Badge>
      </div>

      {/* Panel Body */}
      <div className="notebook-panel-body space-y-4">
        {/* Studio Action Tiles */}
        <div className="studio-grid">
          {studioTiles.map((tile) => (
            <button
              key={tile.id}
              className="studio-tile group"
              onClick={() => handleTileClick(tile)}
            >
              <div className={`studio-tile-icon ${tile.color}`}>
                {tile.icon}
              </div>
              <div className="flex flex-1 items-center justify-between">
                <span className="text-foreground text-xs font-medium">
                  {tile.label}
                </span>
                <ChevronRight className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>

        <Separator />

        {/* AI Summary Section */}
        <AISummaryCard boardId={boardId} aiSummary={aiSummary} />

        {/* Empty State / Generated Content */}
        {generatedItems.length === 0 && (
          <div className="py-4 text-center">
            <Sparkles className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
            <p className="text-primary text-xs font-medium italic">
              Studio output will be saved here.
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              After adding sources, click to add Audio Overview, Study Guide,
              Mind Map, and more!
            </p>
          </div>
        )}

        {/* Add Note Button */}
        <Button
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={() => toast.info('Switch to Sources panel to add a note')}
        >
          <StickyNote className="h-3.5 w-3.5" />
          Add note
        </Button>
      </div>
    </div>
  )
}
