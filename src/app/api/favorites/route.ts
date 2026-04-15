import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { fetchUrlMetadata } from '@/lib/metadata';
import { isPossibleDuplicateUrl } from '@/lib/duplicate';
import { Favorite, FavoriteTag, Tag } from '@prisma/client';

interface FavoriteWithRelations extends Favorite {
  tags: (FavoriteTag & { tag: Tag })[];
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const favoritesWithTags = (favorites as FavoriteWithRelations[]).map(favorite => ({
      ...favorite,
      tags: favorite.tags.map(ft => ft.tag),
    }));

    return NextResponse.json({ favorites: favoritesWithTags });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, rating, tags = [], force = false } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (!force) {
      // Check for any existing favorite that is a possible duplicate
      // (exact match, or URL prefix match in either direction so common
      // tracking-parameter / fragment variants are caught).
      const candidates = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { id: true, url: true, title: true },
      });
      const match = candidates.find((c) => isPossibleDuplicateUrl(c.url, url));
      if (match) {
        return NextResponse.json(
          {
            error: 'Possible duplicate detected',
            duplicate: { id: match.id, url: match.url, title: match.title },
          },
          { status: 409 }
        );
      }
    }

    const metadata = await fetchUrlMetadata(url);

    const tagIds: string[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const trimmedName = tagName.trim();
          let tag = await prisma.tag.findUnique({
            where: { name_userId: { name: trimmedName, userId: user.id } }
          });
          if (!tag) {
            tag = await prisma.tag.create({ data: { name: trimmedName, userId: user.id } });
          }
          tagIds.push(tag.id);
        }
      }
    }

    const favorite = await prisma.favorite.create({
      data: {
        url,
        domain: metadata.domain,
        title: metadata.title,
        description: metadata.description,
        rating: rating ? parseInt(rating) : null,
        userId: user.id,
        tags: { create: tagIds.map(tagId => ({ tagId })) }
      },
      include: { tags: { include: { tag: true } } }
    });

    const favoriteWithTags = {
      ...favorite,
      tags: favorite.tags.map(ft => ft.tag)
    };

    return NextResponse.json({ favorite: favoriteWithTags });
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}