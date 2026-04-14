'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Tag as TagIcon, Trash2, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { tagChipClass } from '@/lib/tagColor';

interface ManagedTag {
  id: string;
  name: string;
  color?: string | null;
  _count?: { favorites: number };
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<ManagedTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const router = useRouter();

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to load tags');
      const data = await response.json();
      setTags(data.tags);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load tags');
    } finally {
      setTagsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error('The new passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.status === 401) {
        toast.error('Please sign in again.');
        router.push('/login');
        return;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to change password');
      }
      toast.success('Password changed. Please sign in again.');
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tag: ManagedTag) => {
    const usage = tag._count?.favorites ?? 0;
    const message = usage > 0
      ? `Tag "${tag.name}" is used by ${usage} favorite${usage === 1 ? '' : 's'} and will also be removed from them. Continue?`
      : `Delete tag "${tag.name}"?`;
    if (!window.confirm(message)) return;

    setDeletingTagId(tag.id);
    try {
      const response = await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete tag');
      }
      setTags(prev => prev.filter(t => t.id !== tag.id));
      toast.success(`Tag "${tag.name}" deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tag');
    } finally {
      setDeletingTagId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[oklch(1_0_0/_0.07)] bg-[oklch(0.16_0.04_265/_0.72)] backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center size-9 rounded-lg border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)] shadow-[0_0_24px_-8px_oklch(0.82_0.16_200/_0.4)]">
                <Logo className="w-5 h-5 text-[oklch(0.82_0.16_200)]" />
              </span>
              <div className="leading-none">
                <p className="text-base font-bold tracking-tight text-brand-gradient">FavSetter</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-mono mt-0.5">
                  Settings
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
              Back to vault
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <p className="font-eyebrow">Account</p>
          <h1 className="font-display text-3xl mt-2">Settings</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Manage your password and the tags in your vault.
          </p>
        </div>

        <Card>
          <CardHeader className="gap-1">
            <p className="font-eyebrow flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" /> Security
            </p>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="current" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current password
                </Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new" className="text-xs uppercase tracking-wider text-muted-foreground">
                    New password
                  </Label>
                  <Input
                    id="new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <p className="font-eyebrow flex items-center gap-1.5">
              <TagIcon className="w-3 h-3" /> Library
            </p>
            <CardTitle>Manage tags</CardTitle>
          </CardHeader>
          <CardContent>
            {tagsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading tags…
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No tags yet. Add one when you save a favorite.</p>
            ) : (
              <ul className="divide-y divide-[oklch(1_0_0/_0.06)] -my-2">
                {tags.map((tag) => {
                  const usage = tag._count?.favorites ?? 0;
                  const isDeleting = deletingTagId === tag.id;
                  return (
                    <li
                      key={tag.id}
                      className="flex items-center justify-between py-3 gap-3 group"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <span className={tagChipClass(tag.name)}>{tag.name}</span>
                        <p className="text-xs text-muted-foreground font-mono tabular-nums">
                          {usage === 1 ? '1 favorite' : `${usage} favorites`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={isDeleting}
                        aria-label={`Delete tag ${tag.name}`}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
