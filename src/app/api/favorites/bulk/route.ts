import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { fetchUrlMetadata } from '@/lib/metadata';

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

    const existing = valid.length === 0
      ? []
      : await prisma.favorite.findMany({
          where: { userId: user.id, url: { in: valid } },
          select: { url: true },
        });
    const existingSet = new Set(existing.map((e) => e.url));
    const newUrls = valid.filter((u) => !existingSet.has(u));

    const prepared = await runWithConcurrency(newUrls, CONCURRENCY, async (url) => {
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
      duplicates: existingSet.size,
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
