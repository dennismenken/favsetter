'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FavoriteCard } from '@/components/FavoriteCard';
import { AddFavoriteDialog } from '@/components/AddFavoriteDialog';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { BulkAddTagsDialog } from '@/components/BulkAddTagsDialog';
import { SelectionBar } from '@/components/SelectionBar';
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
import { Logo } from '@/components/Logo';
import { Heart, Search, LogOut, User, Globe, X, Tag as TagIcon, Settings, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { FavoriteData, TagData, normalizeFavorite, ApiFavoriteData } from '@/types/models';
import { tagChipClass } from '@/lib/tagColor';

interface Tag extends TagData { _count?: { favorites: number } }

type Favorite = FavoriteData;

export default function DashboardPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<'and' | 'or'>('and');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkTagsOpen, setBulkTagsOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
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
    fetchTags();
  };

  const handleBulkImported = () => {
    fetchFavorites();
    fetchTags();
  };

  const handleFavoriteUpdate = (id: string, updates: Partial<Favorite>) => {
    setFavorites(prev =>
      prev.map(fav => fav.id === id ? { ...fav, ...updates } : fav)
    );
    if (updates.tags !== undefined) {
      fetchTags();
    }
  };

  const handleFavoriteDelete = (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
    setSelectedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const filteredFavorites = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return favorites.filter((favorite) => {
      const matchesSearch =
        favorite.title?.toLowerCase().includes(q) ||
        favorite.domain.toLowerCase().includes(q) ||
        favorite.url.toLowerCase().includes(q) ||
        favorite.tags?.some((tag) => tag.name.toLowerCase().includes(q));

      const matchesTags =
        selectedTags.length === 0
          ? true
          : tagMatchMode === 'and'
          ? selectedTags.every((selectedTag) =>
              favorite.tags?.some((tag) => tag.name === selectedTag)
            )
          : selectedTags.some((selectedTag) =>
              favorite.tags?.some((tag) => tag.name === selectedTag)
            );

      return matchesSearch && matchesTags;
    });
  }, [favorites, searchQuery, selectedTags, tagMatchMode]);

  const groupedFavorites = useMemo(() => {
    return filteredFavorites.reduce((groups, favorite) => {
      const domain = favorite.domain;
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(favorite);
      return groups;
    }, {} as Record<string, Favorite[]>);
  }, [filteredFavorites]);

  const sortedDomains = useMemo(
    () =>
      Object.keys(groupedFavorites).sort(
        (a, b) => groupedFavorites[b].length - groupedFavorites[a].length
      ),
    [groupedFavorites]
  );

  // URLs that appear more than once for this user are surfaced on each
  // matching card so existing duplicates can be spotted and cleaned up.
  const duplicateUrls = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of favorites) counts.set(f.url, (counts.get(f.url) ?? 0) + 1);
    const dupes = new Set<string>();
    for (const [url, count] of counts) if (count > 1) dupes.add(url);
    return dupes;
  }, [favorites]);

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

  const handleSelectChange = (id: string, on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleOpenInTabs = () => {
    const urls = favorites.filter((f) => selectedIds.has(f.id)).map((f) => f.url);
    let opened = 0;
    let blocked = 0;
    for (const url of urls) {
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (w) opened++;
      else blocked++;
    }
    if (blocked > 0) {
      toast.warning(
        `Opened ${opened}, ${blocked} blocked. Allow popups for this site to open all tabs.`
      );
    } else if (opened > 0) {
      toast.success(`Opened ${opened} tab${opened === 1 ? '' : 's'}`);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const response = await fetch('/api/favorites/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete');
      }
      const result = (await response.json()) as { deleted: number };
      setFavorites((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      clearSelection();
      setBulkDeleteOpen(false);
      toast.success(`Deleted ${result.deleted} favorite${result.deleted === 1 ? '' : 's'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkTagsApplied = () => {
    fetchFavorites();
    fetchTags();
    clearSelection();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-14 rounded-xl border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)] backdrop-blur-md">
            <Logo className="w-8 h-8 text-[oklch(0.82_0.16_200)] animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">Loading your vault…</p>
        </div>
      </div>
    );
  }

  const totalRated = favorites.filter(f => typeof f.rating === 'number').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[oklch(1_0_0/_0.07)] bg-[oklch(0.16_0.04_265/_0.72)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center size-9 rounded-lg border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)] shadow-[0_0_24px_-8px_oklch(0.82_0.16_200/_0.4)]">
                <Logo className="w-5 h-5 text-[oklch(0.82_0.16_200)]" />
              </span>
              <div className="leading-none">
                <p className="text-base font-bold tracking-tight text-brand-gradient">FavSetter</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-mono mt-0.5">
                  Personal vault
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero / Stats */}
        <section className="grid gap-6 lg:grid-cols-[2fr_3fr] items-stretch">
          <div className="card-glass relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -top-20 -right-20 size-64 rounded-full blur-3xl opacity-50"
                 style={{ background: 'radial-gradient(circle, oklch(0.82 0.16 200 / 0.45), transparent 70%)' }} aria-hidden />
            <p className="font-eyebrow flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Your vault
            </p>
            <h2 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">
              <span className="text-brand-gradient">{favorites.length}</span>{' '}
              <span className="text-foreground/85">{favorites.length === 1 ? 'link' : 'links'}</span>{' '}
              <span className="text-muted-foreground font-normal">across</span>{' '}
              <span className="text-foreground/85">{Object.keys(groupedFavorites).length}</span>{' '}
              <span className="text-muted-foreground font-normal">{Object.keys(groupedFavorites).length === 1 ? 'domain' : 'domains'}</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              {totalRated > 0
                ? `You've rated ${totalRated} of them. Keep curating.`
                : 'Save what matters. Rate what you love. Find it again instantly.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatTile
              label="Favorites"
              value={favorites.length}
              accent="cyan"
              icon={<Heart className="w-4 h-4" />}
            />
            <StatTile
              label="Domains"
              value={Object.keys(groupedFavorites).length}
              accent="magenta"
              icon={<Globe className="w-4 h-4" />}
            />
            <StatTile
              label="Showing"
              value={filteredFavorites.length}
              accent="amber"
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* Action Bar */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Search title, domain, tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/_0.08)] transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <BulkImportDialog onImported={handleBulkImported} />
            <AddFavoriteDialog onFavoriteAdded={handleFavoriteAdded} />
          </div>
        </section>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-eyebrow flex items-center gap-1.5">
                <TagIcon className="w-3 h-3" /> Filter by tag
              </p>
              <div
                className="inline-flex items-center rounded-md border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.03)] p-0.5"
                role="group"
                aria-label="Tag match mode"
              >
                <button
                  type="button"
                  onClick={() => setTagMatchMode('and')}
                  aria-pressed={tagMatchMode === 'and'}
                  title="Show favorites that have all selected tags"
                  className={`px-2 py-0.5 text-[0.65rem] font-mono uppercase tracking-wider rounded transition-colors ${
                    tagMatchMode === 'and'
                      ? 'bg-[oklch(0.82_0.16_200/_0.20)] text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Match all
                </button>
                <button
                  type="button"
                  onClick={() => setTagMatchMode('or')}
                  aria-pressed={tagMatchMode === 'or'}
                  title="Show favorites that have any of the selected tags"
                  className={`px-2 py-0.5 text-[0.65rem] font-mono uppercase tracking-wider rounded transition-colors ${
                    tagMatchMode === 'or'
                      ? 'bg-[oklch(0.82_0.16_200/_0.20)] text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Match any
                </button>
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearTagFilters}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear {selectedTags.length}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const active = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.name)}
                    data-active={active}
                    aria-pressed={active}
                    className={tagChipClass(tag.name)}
                  >
                    <span className="leading-none">{tag.name}</span>
                    {tag._count && (
                      <span className="opacity-60 font-normal leading-none tabular-nums">
                        {tag._count.favorites}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Favorites */}
        {filteredFavorites.length === 0 ? (
          <div className="card-glass relative text-center py-16 px-6">
            <div className="inline-flex items-center justify-center size-14 rounded-xl border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)] mb-5">
              <Heart className="w-6 h-6 text-muted-foreground/70" />
            </div>
            <h3 className="font-display text-2xl mb-2">
              {searchQuery || selectedTags.length > 0 ? 'Nothing matches.' : 'The vault is empty.'}
            </h3>
            <p className="text-muted-foreground mb-7 max-w-sm mx-auto">
              {searchQuery || selectedTags.length > 0
                ? 'Try a different keyword or clear your filters.'
                : 'Drop in your first link and watch it get organised.'}
            </p>
            {!searchQuery && selectedTags.length === 0 && (
              <div className="inline-flex">
                <AddFavoriteDialog onFavoriteAdded={handleFavoriteAdded} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {sortedDomains.map((domain, idx) => (
              <section key={domain}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="inline-flex items-center justify-center size-8 rounded-md border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)]">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground/90">
                    {domain}
                  </h2>
                  <span className="font-mono text-[0.7rem] text-muted-foreground/80 px-2 py-0.5 rounded-md border border-[oklch(1_0_0/_0.08)] bg-[oklch(1_0_0/_0.03)]">
                    {groupedFavorites[domain].length}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-[oklch(1_0_0/_0.08)] to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedFavorites[domain].map(favorite => (
                    <FavoriteCard
                      key={favorite.id}
                      favorite={favorite}
                      duplicate={duplicateUrls.has(favorite.url)}
                      selected={selectedIds.has(favorite.id)}
                      onSelectChange={handleSelectChange}
                      onUpdate={handleFavoriteUpdate}
                      onDelete={handleFavoriteDelete}
                    />
                  ))}
                </div>

                {idx !== sortedDomains.length - 1 && (
                  <Separator className="mt-10 bg-[oklch(1_0_0/_0.05)]" />
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className={`border-t border-[oklch(1_0_0/_0.05)] py-8 mt-16 ${selectedIds.size > 0 ? 'mb-24' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground/60 font-mono">
          <span>FavSetter</span>
          <span>Stay curious.</span>
        </div>
      </footer>

      <SelectionBar
        count={selectedIds.size}
        busy={bulkBusy || bulkTagsOpen || bulkDeleteOpen}
        onClear={clearSelection}
        onOpenInTabs={handleOpenInTabs}
        onAddTags={() => setBulkTagsOpen(true)}
        onDelete={() => setBulkDeleteOpen(true)}
      />

      <BulkAddTagsDialog
        open={bulkTagsOpen}
        ids={Array.from(selectedIds)}
        onOpenChange={setBulkTagsOpen}
        onApplied={handleBulkTagsApplied}
      />

      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => { if (!bulkBusy) setBulkDeleteOpen(open); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} favorite{selectedIds.size === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected entries from your vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              disabled={bulkBusy}
            >
              {bulkBusy ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: 'cyan' | 'magenta' | 'amber';
  icon: React.ReactNode;
}) {
  const accentColor =
    accent === 'cyan' ? 'oklch(0.82 0.16 200)'
    : accent === 'magenta' ? 'oklch(0.68 0.27 350)'
    : 'oklch(0.84 0.17 85)';
  return (
    <div className="card-glass card-glow-hover relative p-4 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center justify-center size-8 rounded-md border"
          style={{
            color: accentColor,
            borderColor: `color-mix(in oklab, ${accentColor} 35%, transparent)`,
            background: `color-mix(in oklab, ${accentColor} 10%, transparent)`,
          }}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="font-display text-3xl leading-none" style={{ color: accentColor }}>
          {value}
        </p>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground mt-2">
          {label}
        </p>
      </div>
    </div>
  );
}
