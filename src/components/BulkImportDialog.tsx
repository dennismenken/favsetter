'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkImportDialogProps {
  onImported: () => void;
}

interface DuplicateEntry {
  url: string;
  existing: { id: string; url: string; title: string | null };
}

interface BulkImportResult {
  total: number;
  added: number;
  duplicates: DuplicateEntry[];
  invalid: number;
  failed: number;
}

type Step = 'edit' | 'duplicates';

function summary(result: BulkImportResult, extra?: { added?: number }) {
  const totalAdded = result.added + (extra?.added ?? 0);
  const parts = [`${totalAdded} added`];
  if (result.duplicates.length > 0) parts.push(`${result.duplicates.length} duplicate${result.duplicates.length === 1 ? '' : 's'}`);
  if (result.invalid > 0) parts.push(`${result.invalid} invalid`);
  if (result.failed > 0) parts.push(`${result.failed} failed`);
  return parts.join(', ');
}

export function BulkImportDialog({ onImported }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('edit');
  const [firstResult, setFirstResult] = useState<BulkImportResult | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());

  const urls = useMemo(
    () => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    [text]
  );

  const reset = () => {
    setText('');
    setStep('edit');
    setFirstResult(null);
    setSelectedDuplicates(new Set());
  };

  const handleOpenChange = (next: boolean) => {
    if (isLoading) return;
    if (!next) reset();
    setOpen(next);
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urls.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, force: false }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Bulk import failed');
      }

      const result = (await response.json()) as BulkImportResult;
      setFirstResult(result);

      if (result.added > 0) onImported();

      if (result.duplicates.length === 0) {
        toast.success(summary(result));
        setOpen(false);
        reset();
        return;
      }

      // Move to duplicates review with everything pre-checked.
      setSelectedDuplicates(new Set(result.duplicates.map((d) => d.url)));
      setStep('duplicates');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipDuplicates = () => {
    if (firstResult) toast.success(summary(firstResult));
    setOpen(false);
    reset();
  };

  const handleAddSelectedDuplicates = async () => {
    if (!firstResult) return;
    const picked = Array.from(selectedDuplicates);

    if (picked.length === 0) {
      handleSkipDuplicates();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: picked, force: true }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Bulk import failed');
      }

      const second = (await response.json()) as BulkImportResult;
      if (second.added > 0) onImported();
      toast.success(summary(firstResult, { added: second.added }));
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDuplicate = (url: string) => {
    setSelectedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleAllDuplicates = (allChecked: boolean) => {
    if (!firstResult) return;
    setSelectedDuplicates(
      allChecked ? new Set() : new Set(firstResult.duplicates.map((d) => d.url))
    );
  };

  const allChecked =
    firstResult !== null &&
    firstResult.duplicates.length > 0 &&
    selectedDuplicates.size === firstResult.duplicates.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4" />
          Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === 'edit' ? (
          <>
            <DialogHeader>
              <p className="font-eyebrow">Batch entry</p>
              <DialogTitle>Bulk import favorites</DialogTitle>
              <DialogDescription className="sr-only">
                Paste one URL per line. Duplicates and invalid URLs are flagged so you can review them before importing.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInitialSubmit} className="space-y-5">
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
                  <span className="text-muted-foreground/60">Possible duplicates are flagged before they get added.</span>
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
          </>
        ) : (
          <>
            <DialogHeader>
              <p className="font-eyebrow flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Review duplicates
              </p>
              <DialogTitle>
                {firstResult?.added ?? 0} added · {firstResult?.duplicates.length ?? 0} possible duplicate
                {(firstResult?.duplicates.length ?? 0) === 1 ? '' : 's'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Possible duplicates were skipped. Pick which ones to add anyway.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These URLs look similar to favorites already in your vault. All are checked by default — uncheck the ones you want to skip.
              </p>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => toggleAllDuplicates(allChecked)}
                  className="font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  {allChecked ? 'Uncheck all' : 'Check all'}
                </button>
                <span className="font-mono text-muted-foreground/70">
                  {selectedDuplicates.size} / {firstResult?.duplicates.length ?? 0} selected
                </span>
              </div>

              <ul className="divide-y divide-[oklch(1_0_0/_0.06)] -my-2 max-h-[40dvh] overflow-y-auto rounded-md border border-[oklch(1_0_0/_0.08)] bg-[oklch(1_0_0/_0.02)]">
                {firstResult?.duplicates.map((dup) => {
                  const checked = selectedDuplicates.has(dup.url);
                  return (
                    <li key={dup.url} className="px-3 py-2.5">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDuplicate(dup.url)}
                          disabled={isLoading}
                          className="mt-1 size-4 accent-[oklch(0.82_0.16_200)] cursor-pointer"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-mono text-[0.72rem] text-foreground break-all">{dup.url}</p>
                          <p className="text-[0.7rem] text-muted-foreground/80">
                            matches:{' '}
                            <span className="text-foreground/85">{dup.existing.title || 'Untitled'}</span>{' '}
                            <span className="font-mono text-muted-foreground/60 break-all">
                              ({dup.existing.url})
                            </span>
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipDuplicates}
                disabled={isLoading}
              >
                Skip duplicates
              </Button>
              <Button
                type="button"
                onClick={handleAddSelectedDuplicates}
                disabled={isLoading || selectedDuplicates.size === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Add {selectedDuplicates.size}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
