'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      toast.success('Welcome back.');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient grid + halos */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, oklch(0.82 0.16 200 / 0.35), transparent 70%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[520px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, oklch(0.68 0.27 350 / 0.35), transparent 70%)' }}
        aria-hidden
      />

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-3">
            <span
              className="inline-flex items-center justify-center size-12 rounded-xl border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.04)] backdrop-blur-md shadow-[0_0_32px_-8px_oklch(0.82_0.16_200/_0.5)]"
            >
              <Logo className="w-7 h-7 text-[oklch(0.82_0.16_200)]" />
            </span>
          </div>
          <div className="space-y-2">
            <p className="font-eyebrow">Personal bookmarks vault</p>
            <h1 className="font-display text-5xl text-brand-gradient">FavSetter</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              The links you actually love, organised in one midnight-blue vault.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="gap-1">
            <p className="font-eyebrow">Sign in</p>
            <CardTitle className="text-2xl">Enter the vault</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full group"
                size="lg"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/70 font-mono">
          v1 — built for one user, with care.
        </p>
      </div>
    </div>
  );
}
