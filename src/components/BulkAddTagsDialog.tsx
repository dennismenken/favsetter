'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/TagInput';
import { Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface BulkAddTagsDialogProps {
  open: boolean;
  ids: string[];
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}

export function BulkAddTagsDialog({ open, ids, onOpenChange, onApplied }: BulkAddTagsDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) setTags([]);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tags.length === 0 || ids.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites/bulk-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, tags }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to add tags');
      }
      const result = (await response.json()) as { updated: number; tags: string[] };
      toast.success(
        `Added ${result.tags.length} tag${result.tags.length === 1 ? '' : 's'} to ${result.updated} favorite${result.updated === 1 ? '' : 's'}`
      );
      onApplied();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add tags');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isLoading) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="font-eyebrow flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Bulk edit
          </p>
          <DialogTitle>
            Add tags to {ids.length} favorite{ids.length === 1 ? '' : 's'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tags are added without removing any existing tags on the selected favorites.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <TagInput
            label="Tags to add"
            value={tags}
            onChange={setTags}
            placeholder="e.g. archive, todo"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || tags.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
