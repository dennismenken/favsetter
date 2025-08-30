export interface TagData {
  id: string;
  name: string;
  color?: string; // null normalized to undefined
}

export interface FavoriteData {
  id: string;
  url: string;
  domain: string;
  title?: string;
  description?: string;
  rating?: number; // null normalized out
  tags?: TagData[];
  createdAt: string;
  updatedAt?: string;
}

// Raw API shapes (allow nulls)
export interface ApiTagData {
  id: string;
  name: string;
  color?: string | null;
}
export interface ApiFavoriteData {
  id: string;
  url: string;
  domain: string;
  title?: string | null;
  description?: string | null;
  rating: number | null;
  tags?: ApiTagData[];
  createdAt: string;
  updatedAt: string;
}

export function normalizeFavorite(api: ApiFavoriteData): FavoriteData {
  return {
    id: api.id,
    url: api.url,
    domain: api.domain,
    title: api.title ?? undefined,
    description: api.description ?? undefined,
    rating: api.rating ?? undefined,
    tags: api.tags?.map(t => ({ id: t.id, name: t.name, color: t.color ?? undefined }))
  , createdAt: api.createdAt, updatedAt: api.updatedAt };
}
