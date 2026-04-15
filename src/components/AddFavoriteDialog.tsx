'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/TagInput';
import { Star, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FavoriteData, normalizeFavorite, ApiFavoriteData } from '@/types/models';

interface AddFavoriteDialogProps {
  onFavoriteAdded: (favorite: FavoriteData) => void;
}

interface DuplicateMatch {
  id: string;
  url: string;
  title: string | null;
}

export function AddFavoriteDialog({ onFavoriteAdded }: AddFavoriteDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);

  const submit = async (force: boolean) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, rating, tags, force }),
      });

      if (response.status === 409) {
        const payload = await response.json().catch(() => ({}));
        if (payload?.duplicate) {
          setDuplicateMatch(payload.duplicate as DuplicateMatch);
          return;
        }
        throw new Error(payload?.error || 'Conflict');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to add favorite');
      }

      const { favorite } = await response.json() as { favorite: ApiFavoriteData };
      onFavoriteAdded(normalizeFavorite(favorite));
      toast.success(force ? 'Saved (duplicate confirmed).' : 'Saved to your vault.');

      setUrl('');
      setRating(null);
      setTags([]);
      setDuplicateMatch(null);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add favorite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  const renderStarRating = () => {
    return (
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Rating <span className="lowercase tracking-normal text-muted-foreground/60">(optional)</span>
        </Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (rating || 0);
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? null : star)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
                aria-label={`Rate ${star} of 5`}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    filled
                      ? 'fill-[oklch(0.84_0.17_85)] text-[oklch(0.84_0.17_85)] drop-shadow-[0_0_8px_oklch(0.84_0.17_85/_0.6)]'
                      : 'text-muted-foreground/40 hover:text-[oklch(0.84_0.17_85)]'
                  }`}
                />
              </button>
            );
          })}
          {rating && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { if (!isLoading) setOpen(next); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4" />
            Add favorite
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <p className="font-eyebrow">New entry</p>
            <DialogTitle>Add a favorite</DialogTitle>
            <DialogDescription className="sr-only">
              Save a link to your vault. Title and description are pulled from the page automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-xs uppercase tracking-wider text-muted-foreground">
                URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>

            <TagInput
              label="Tags (optional)"
              value={tags}
              onChange={setTags}
              placeholder="e.g. design, inspiration"
            />

            {renderStarRating()}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !url.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Save link
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!duplicateMatch}
        onOpenChange={(next) => { if (!next && !isLoading) setDuplicateMatch(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Possible duplicate detected. Add anyway?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>An existing favorite looks similar to this URL.</p>
                {duplicateMatch && (
                  <div className="rounded-md border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)] p-3 space-y-1">
                    <p className="text-foreground font-medium tracking-tight truncate">
                      {duplicateMatch.title || 'Untitled'}
                    </p>
                    <p className="font-mono text-[0.7rem] text-muted-foreground break-all">
                      {duplicateMatch.url}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submit(true);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Adding…' : 'Add anyway'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
