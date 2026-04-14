'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Tag as TagIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving…' : 'Change password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Manage Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tagsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading tags…
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-gray-500">No tags yet.</p>
            ) : (
              <ul className="divide-y">
                {tags.map((tag) => {
                  const usage = tag._count?.favorites ?? 0;
                  const isDeleting = deletingTagId === tag.id;
                  return (
                    <li key={tag.id} className="flex items-center justify-between py-2 gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tag.name}</p>
                        <p className="text-xs text-gray-500">
                          {usage === 1 ? '1 favorite' : `${usage} favorites`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={isDeleting}
                        aria-label={`Delete tag ${tag.name}`}
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
      </div>
    </div>
  );
}
