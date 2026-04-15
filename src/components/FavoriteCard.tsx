'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { EditTagsDialog } from '@/components/EditTagsDialog';
import { ExternalLink, Star, MoreVertical, Trash2, Tag, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FavoriteData, normalizeFavorite, ApiFavoriteData } from '@/types/models';
import { tagChipClass } from '@/lib/tagColor';

interface FavoriteCardProps {
  favorite: FavoriteData;
  duplicate?: boolean;
  onUpdate: (id: string, updates: Partial<FavoriteData>) => void;
  onDelete: (id: string) => void;
}

export function FavoriteCard({ favorite, duplicate = false, onUpdate, onDelete }: FavoriteCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateRating = async (rating: number) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/favorites/${favorite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update rating');
      }

      const { favorite: updatedFavorite } = await response.json() as { favorite: ApiFavoriteData };
      onUpdate(favorite.id, normalizeFavorite(updatedFavorite));
      toast.success('Rating updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update rating');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteFavorite = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/favorites/${favorite.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete favorite');
      }
      onDelete(favorite.id);
      toast.success('Favorite deleted');
      setConfirmDeleteOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete favorite');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStars = () => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (favorite.rating || 0);
        return (
          <button
            key={star}
            onClick={() => updateRating(star)}
            disabled={isUpdating}
            aria-label={`Rate ${star} of 5`}
            className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                filled
                  ? 'fill-[oklch(0.84_0.17_85)] text-[oklch(0.84_0.17_85)] drop-shadow-[0_0_6px_oklch(0.84_0.17_85/_0.6)]'
                  : 'text-muted-foreground/40 hover:text-[oklch(0.84_0.17_85)]'
              }`}
            />
          </button>
        );
      })}
      {typeof favorite.rating === 'number' && favorite.rating > 0 && (
        <span className="text-[0.7rem] font-mono text-muted-foreground ml-1.5 tabular-nums">
          {favorite.rating}/5
        </span>
      )}
    </div>
  );

  return (
    <>
    <Card className="group min-w-0 card-glow-hover">
      <CardHeader className="pb-3 grid-cols-[minmax(0,1fr)]">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-6 text-foreground tracking-tight truncate">
              {favorite.title || 'Untitled'}
            </h3>
            <div className="mt-1 flex items-center gap-2 min-w-0">
              <p className="text-[0.7rem] font-mono text-muted-foreground/80 truncate">
                {favorite.domain}
              </p>
              {duplicate && (
                <span
                  className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-mono font-semibold uppercase tracking-wider text-[oklch(0.84_0.17_85)] border border-[oklch(0.84_0.17_85/0.45)] bg-[oklch(0.84_0.17_85/0.10)]"
                  title="Another favorite has the same URL"
                >
                  <Copy className="w-2.5 h-2.5" />
                  Duplicate
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditTagsDialog
                favoriteId={favorite.id}
                currentTags={favorite.tags || []}
                onTagsUpdated={(id, newTags) => onUpdate(id, { tags: newTags })}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Tag className="mr-2 h-4 w-4" />
                  Edit tags
                </DropdownMenuItem>
              </EditTagsDialog>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmDeleteOpen(true);
                }}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {favorite.description && (
          <p className="text-[0.8rem] text-muted-foreground/85 mb-4 line-clamp-2 leading-relaxed">
            {favorite.description}
          </p>
        )}
        {favorite.tags && favorite.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {favorite.tags.map(tag => (
              <span key={tag.id} className={tagChipClass(tag.name)}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          {renderStars()}
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
            <a href={favorite.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              Visit
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={confirmDeleteOpen} onOpenChange={(open) => !isDeleting && setConfirmDeleteOpen(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this favorite?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{favorite.title || favorite.url}</span> will be permanently removed from your vault.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              deleteFavorite();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
