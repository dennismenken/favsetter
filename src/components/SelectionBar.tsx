'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink, Tag, Trash2, X, Loader2 } from 'lucide-react';

interface SelectionBarProps {
  count: number;
  busy?: boolean;
  onClear: () => void;
  onOpenInTabs: () => void;
  onAddTags: () => void;
  onDelete: () => void;
}

export function SelectionBar({
  count,
  busy = false,
  onClear,
  onOpenInTabs,
  onAddTags,
  onDelete,
}: SelectionBarProps) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 max-w-[calc(100%-2rem)]">
      <div className="card-glass relative flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_24px_64px_-16px_oklch(0_0_0/_0.7)]">
        <span className="font-mono text-xs uppercase tracking-wider text-foreground/90 px-2">
          <span className="text-[oklch(0.82_0.16_200)] font-semibold">{count}</span> selected
        </span>

        <span className="hidden sm:inline-block h-5 w-px bg-[oklch(1_0_0/_0.10)]" aria-hidden />

        <Button size="sm" onClick={onOpenInTabs} disabled={busy}>
          <ExternalLink className="w-3.5 h-3.5" />
          Open in tabs
        </Button>
        <Button size="sm" variant="outline" onClick={onAddTags} disabled={busy}>
          <Tag className="w-3.5 h-3.5" />
          Add tags
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} disabled={busy}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete
        </Button>

        <span className="hidden sm:inline-block h-5 w-px bg-[oklch(1_0_0/_0.10)]" aria-hidden />

        <Button size="sm" variant="ghost" onClick={onClear} disabled={busy} aria-label="Clear selection">
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
