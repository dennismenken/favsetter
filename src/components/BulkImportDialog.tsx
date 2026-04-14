'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkImportDialogProps {
  onImported: () => void;
}

interface BulkImportResult {
  total: number;
  added: number;
  duplicates: number;
  invalid: number;
  failed: number;
}

export function BulkImportDialog({ onImported }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const urls = useMemo(
    () => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    [text]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urls.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Bulk import failed');
      }

      const result = (await response.json()) as BulkImportResult;
      const parts = [`${result.added} added`];
      if (result.duplicates > 0) parts.push(`${result.duplicates} already exist`);
      if (result.invalid > 0) parts.push(`${result.invalid} invalid`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);
      toast.success(parts.join(', '));

      onImported();
      setText('');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (isLoading) return;
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Favorites</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-urls">URLs (one per line)</Label>
            <textarea
              id="bulk-urls"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'https://example.com\nhttps://another.com'}
              rows={10}
              disabled={isLoading}
              className="flex min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-gray-500">
              {urls.length === 0
                ? 'No URLs entered yet.'
                : urls.length === 1
                ? '1 URL detected.'
                : `${urls.length} URLs detected.`}{' '}
              Rating and tags can be added per entry later.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || urls.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                `Import${urls.length > 0 ? ` (${urls.length})` : ''}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
