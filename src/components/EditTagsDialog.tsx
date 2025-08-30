'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/TagInput';
import { Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TagType {
  id: string;
  name: string;
  color?: string;
}

interface EditTagsDialogProps {
  favoriteId: string;
  currentTags: TagType[];
  onTagsUpdated: (favoriteId: string, newTags: TagType[]) => void;
  children: React.ReactNode;
}

export function EditTagsDialog({ favoriteId, currentTags, onTagsUpdated, children }: EditTagsDialogProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(currentTags.map(tag => tag.name));
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tags');
      }

      const { favorite } = await response.json();
      onTagsUpdated(favoriteId, favorite.tags);
      toast.success('Tags updated successfully');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset tags to current state when opening
      setTags(currentTags.map(tag => tag.name));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Edit Tags
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Add or remove tags..."
          />
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Tags'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 