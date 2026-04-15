import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { fetchUrlMetadata } from '@/lib/metadata';
import { isPossibleDuplicateUrl } from '@/lib/duplicate';

const MAX_URLS = 200;
const CONCURRENCY = 8;

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const rawUrls: unknown = body?.urls;
    const force: boolean = body?.force === true;

    if (!Array.isArray(rawUrls)) {
      return NextResponse.json({ error: 'urls must be an array' }, { status: 400 });
    }

    const deduped = Array.from(new Set(
      rawUrls
        .filter((u): u is string => typeof u === 'string')
        .map((u) => u.trim())
        .filter(Boolean)
    ));

    if (deduped.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    if (deduped.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_URLS} URLs per import` },
        { status: 400 }
      );
    }

    const valid: string[] = [];
    const invalid: string[] = [];
    for (const url of deduped) {
      try {
        new URL(url);
        valid.push(url);
      } catch {
        invalid.push(url);
      }
    }

    type DuplicateEntry = {
      url: string;
      existing: { id: string; url: string; title: string | null };
    };

    const toImport: string[] = [];
    const duplicates: DuplicateEntry[] = [];

    if (force) {
      toImport.push(...valid);
    } else if (valid.length > 0) {
      const existing = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { id: true, url: true, title: true },
      });
      for (const url of valid) {
        const hit = existing.find((e) => isPossibleDuplicateUrl(e.url, url));
        if (hit) {
          duplicates.push({ url, existing: { id: hit.id, url: hit.url, title: hit.title } });
        } else {
          toImport.push(url);
        }
      }
    }

    const prepared = await runWithConcurrency(toImport, CONCURRENCY, async (url) => {
      const meta = await fetchUrlMetadata(url);
      return { url, meta };
    });

    let added = 0;
    const failed: string[] = [];
    for (const { url, meta } of prepared) {
      try {
        await prisma.favorite.create({
          data: {
            url,
            domain: meta.domain,
            title: meta.title,
            description: meta.description,
            userId: user.id,
          },
        });
        added++;
      } catch (error) {
        console.error('Bulk import: failed to insert', url, error);
        failed.push(url);
      }
    }

    return NextResponse.json({
      total: deduped.length,
      added,
      duplicates,
      invalid: invalid.length,
      failed: failed.length,
    });
  } catch (error) {
    console.error('Error bulk importing favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
