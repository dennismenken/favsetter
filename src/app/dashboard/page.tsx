'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FavoriteCard } from '@/components/FavoriteCard';
import { AddFavoriteDialog } from '@/components/AddFavoriteDialog';
import { Heart, Search, LogOut, User, Globe, X, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FavoriteData, TagData, normalizeFavorite, ApiFavoriteData } from '@/types/models';

interface Tag extends TagData { _count?: { favorites: number } }

type Favorite = FavoriteData;

export default function DashboardPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchFavorites();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites((data.favorites as ApiFavoriteData[]).map(f => normalizeFavorite(f)));
    } catch (error) {
      toast.error('Failed to load favorites');
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const handleFavoriteAdded = (newFavorite: FavoriteData) => {
    setFavorites(prev => [newFavorite, ...prev]);
    // Refresh tags to include any new ones
    fetchTags();
  };

  const handleFavoriteUpdate = (id: string, updates: Partial<Favorite>) => {
    setFavorites(prev => 
      prev.map(fav => fav.id === id ? { ...fav, ...updates } : fav)
    );
    // Refresh tags if tags were updated
    if (updates.tags !== undefined) {
      fetchTags();
    }
  };

  const handleFavoriteDelete = (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  // Filter favorites based on search query and selected tags
  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = 
      favorite.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.tags?.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(selectedTag => 
        favorite.tags?.some(tag => tag.name === selectedTag)
      );

    return matchesSearch && matchesTags;
  });

  // Group favorites by domain
  const groupedFavorites = filteredFavorites.reduce((groups, favorite) => {
    const domain = favorite.domain;
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(favorite);
    return groups;
  }, {} as Record<string, Favorite[]>);

  // Sort domains by number of favorites (descending)
  const sortedDomains = Object.keys(groupedFavorites).sort(
    (a, b) => groupedFavorites[b].length - groupedFavorites[a].length
  );

  const getTagColor = (tag: string) => {
    // Generate a consistent color based on tag name
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-red-100 text-red-800 border-red-200',
    ];
    
    const hash = tag.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const toggleTagFilter = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-red-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">FavSetter</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-1" />
                User
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <AddFavoriteDialog onFavoriteAdded={handleFavoriteAdded} />
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TagIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearTagFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.name)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedTags.includes(tag.name)
                      ? `${getTagColor(tag.name)} ring-2 ring-offset-1 ring-blue-500`
                      : `${getTagColor(tag.name)} hover:ring-2 hover:ring-offset-1 hover:ring-gray-300`
                  }`}
                >
                  {tag.name}
                  {tag._count && (
                    <span className="ml-1 opacity-75">
                      ({tag._count.favorites})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Favorites</p>
                <p className="text-2xl font-bold">{favorites.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Globe className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Unique Domains</p>
                <p className="text-2xl font-bold">{Object.keys(groupedFavorites).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Search className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Showing</p>
                <p className="text-2xl font-bold">{filteredFavorites.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No favorites found' : 'No favorites yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start building your collection by adding your first favorite link'
              }
            </p>
            {!searchQuery && (
              <AddFavoriteDialog onFavoriteAdded={handleFavoriteAdded} />
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDomains.map(domain => (
              <div key={domain}>
                <div className="flex items-center mb-4">
                  <Globe className="w-5 h-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {domain}
                  </h2>
                  <span className="ml-2 text-sm text-gray-500">
                    ({groupedFavorites[domain].length})
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {groupedFavorites[domain].map(favorite => (
                    <FavoriteCard
                      key={favorite.id}
                      favorite={favorite}
                      onUpdate={handleFavoriteUpdate}
                      onDelete={handleFavoriteDelete}
                    />
                  ))}
                </div>
                
                {domain !== sortedDomains[sortedDomains.length - 1] && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}