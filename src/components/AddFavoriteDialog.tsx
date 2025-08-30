'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export function AddFavoriteDialog({ onFavoriteAdded }: AddFavoriteDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), rating, tags }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add favorite');
      }

      const { favorite } = await response.json() as { favorite: ApiFavoriteData };
      onFavoriteAdded(normalizeFavorite(favorite));
      toast.success('Favorite added successfully');
      
      // Reset form
      setUrl('');
      setRating(null);
      setTags([]);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add favorite');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="space-y-2">
        <Label>Rating (optional)</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(rating === star ? null : star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= (rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              />
            </button>
          ))}
          {rating && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="ml-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Favorite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Favorite</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <TagInput
            label="Tags (optional)"
            value={tags}
            onChange={setTags}
            placeholder="Add tags..."
          />
          
          {renderStarRating()}
          
          <div className="flex justify-end gap-2">
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Favorite'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}