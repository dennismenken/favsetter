import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? (body.ids as unknown[]).filter((x): x is string => typeof x === 'string')
      : null;
    const rawTags = Array.isArray(body?.tags)
      ? (body.tags as unknown[])
          .filter((x): x is string => typeof x === 'string')
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }
    if (!rawTags || rawTags.length === 0) {
      return NextResponse.json({ error: 'tags must be a non-empty array' }, { status: 400 });
    }

    const tagNames = Array.from(new Set(rawTags));

    const ownedFavorites = await prisma.favorite.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });
    const favoriteIds = ownedFavorites.map((f) => f.id);

    if (favoriteIds.length === 0) {
      return NextResponse.json({ error: 'No matching favorites' }, { status: 404 });
    }

    const tagIds: string[] = [];
    for (const name of tagNames) {
      let tag = await prisma.tag.findUnique({
        where: { name_userId: { name, userId: user.id } },
      });
      if (!tag) {
        tag = await prisma.tag.create({ data: { name, userId: user.id } });
      }
      tagIds.push(tag.id);
    }

    const allLinks = favoriteIds.flatMap((favoriteId) =>
      tagIds.map((tagId) => ({ favoriteId, tagId }))
    );

    // Filter out links that already exist (SQLite via the driver adapter
    // does not support `skipDuplicates`, so we dedupe explicitly).
    const existingLinks = await prisma.favoriteTag.findMany({
      where: {
        favoriteId: { in: favoriteIds },
        tagId: { in: tagIds },
      },
      select: { favoriteId: true, tagId: true },
    });
    const existingKeys = new Set(
      existingLinks.map((l) => `${l.favoriteId}|${l.tagId}`)
    );
    const newLinks = allLinks.filter(
      (l) => !existingKeys.has(`${l.favoriteId}|${l.tagId}`)
    );

    const created = newLinks.length === 0
      ? { count: 0 }
      : await prisma.favoriteTag.createMany({ data: newLinks });

    return NextResponse.json({
      updated: favoriteIds.length,
      tags: tagNames,
      addedLinks: created.count,
    });
  } catch (error) {
    console.error('Bulk tag failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
