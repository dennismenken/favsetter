import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { rating, tags } = await request.json();

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    interface UpdateShape {
      rating?: number | null;
      tags?: { create: { tagId: string }[] };
    }
    const updateData: UpdateShape = {};
    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (Array.isArray(tags)) {
      const tagIds: string[] = [];
      for (const tagName of tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const trimmedName = tagName.trim();
          let tag = await prisma.tag.findUnique({
            where: { name_userId: { name: trimmedName, userId: user.id } }
          });
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: trimmedName, userId: user.id }
            });
          }
          tagIds.push(tag.id);
        }
      }

      await prisma.favoriteTag.deleteMany({ where: { favoriteId: id } });

      if (tagIds.length > 0) {
        updateData.tags = { create: tagIds.map(tagId => ({ tagId })) };
      }
    }

    const favorite = await prisma.favorite.update({
      where: { id },
      data: updateData as Prisma.FavoriteUpdateInput,
      include: { tags: { include: { tag: true } } }
    });

    const favoriteWithTags = {
      ...favorite,
      tags: favorite.tags.map(ft => ft.tag)
    };

    return NextResponse.json({ favorite: favoriteWithTags });
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingFavorite = await prisma.favorite.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    await prisma.favorite.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}