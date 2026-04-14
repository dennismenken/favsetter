'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
          <Upload className="w-4 h-4" />
          Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <p className="font-eyebrow">Batch entry</p>
          <DialogTitle>Bulk import favorites</DialogTitle>
          <DialogDescription className="sr-only">
            Paste one URL per line. Duplicates and invalid URLs are skipped. Rating and tags can be added per entry later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="bulk-urls"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              URLs <span className="lowercase tracking-normal text-muted-foreground/60">(one per line)</span>
            </Label>
            <textarea
              id="bulk-urls"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'https://example.com\nhttps://another.com'}
              rows={10}
              disabled={isLoading}
              className="flex min-h-[200px] w-full rounded-lg border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.03)] px-3.5 py-2.5 text-sm font-mono shadow-[inset_0_1px_0_0_oklch(1_0_0/_0.04)] outline-none transition-[color,background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground/60 hover:border-[oklch(1_0_0/_0.16)] focus-visible:border-[oklch(0.82_0.16_200/_0.6)] focus-visible:bg-[oklch(1_0_0/_0.05)] focus-visible:shadow-[inset_0_1px_0_0_oklch(1_0_0/_0.06),0_0_0_4px_oklch(0.82_0.16_200/_0.18),0_0_24px_-6px_oklch(0.82_0.16_200/_0.4)] disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed"
            />
            <p className="text-xs text-muted-foreground font-mono">
              {urls.length === 0
                ? 'No URLs entered yet.'
                : urls.length === 1
                ? '1 URL detected.'
                : `${urls.length} URLs detected.`}{' '}
              <span className="text-muted-foreground/60">Rating and tags can be added per entry later.</span>
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {urls.length > 0 ? `Import ${urls.length}` : 'Import'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
