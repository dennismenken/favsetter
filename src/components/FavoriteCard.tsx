'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditTagsDialog } from '@/components/EditTagsDialog';
import { ExternalLink, Star, MoreVertical, Trash2, Tag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TagType {
  id: string;
  name: string;
  color?: string;
}

interface Favorite {
  id: string;
  url: string;
  domain: string;
  title?: string;
  description?: string;
  rating?: number;
  tags?: TagType[];
  createdAt: string;
}

interface FavoriteCardProps {
  favorite: Favorite;
  onUpdate: (id: string, updates: Partial<Favorite>) => void;
  onDelete: (id: string) => void;
}

export function FavoriteCard({ favorite, onUpdate, onDelete }: FavoriteCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

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

      const { favorite: updatedFavorite } = await response.json();
      onUpdate(favorite.id, updatedFavorite);
      toast.success('Rating updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update rating');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteFavorite = async () => {
    if (!confirm('Are you sure you want to delete this favorite?')) return;

    try {
      const response = await fetch(`/api/favorites/${favorite.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete favorite');
      }

      onDelete(favorite.id);
      toast.success('Favorite deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete favorite');
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => updateRating(star)}
            disabled={isUpdating}
            className="p-0.5 hover:scale-110 transition-transform disabled:cursor-not-allowed"
          >
            <Star
              className={`w-4 h-4 ${
                star <= (favorite.rating || 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            />
          </button>
        ))}
        {favorite.rating && (
          <span className="text-sm text-muted-foreground ml-2">
            {favorite.rating}/5
          </span>
        )}
      </div>
    );
  };

  const getTagColor = (tag: string) => {
    // Generate a consistent color based on tag name
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-red-100 text-red-800',
    ];
    
    const hash = tag.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-6 text-foreground truncate">
              {favorite.title || 'Untitled'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {favorite.domain}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  Edit Tags
                </DropdownMenuItem>
              </EditTagsDialog>
              <DropdownMenuItem onClick={deleteFavorite} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {favorite.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {favorite.description}
          </p>
        )}
        
        {/* Tags */}
        {favorite.tags && favorite.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {favorite.tags.map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag.name)}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {renderStars()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(favorite.url, '_blank')}
            className="shrink-0"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 