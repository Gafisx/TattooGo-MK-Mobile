import { ApiError, api } from '@/lib/api';
import type { GaleriaItem, GaleriaQuery } from '@/lib/types/galeria';

export const GALERIA_LIMIT_DEFAULT = 48;
export const GALERIA_LIMIT_MAX = 60;

export interface GaleriaApiResponse {
  sucesso?: boolean;
  items?: GaleriaItem[];
  erro?: string;
}

/**
 * Query-string builder for `GET /api/galeria`. Mirrors the web hook:
 * the healing filter is only sent when narrowed ('healed' -> true,
 * 'fresh' -> false); 'all' sends nothing.
 */
export function buildGaleriaQueryParams(query: GaleriaQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.style) params.set('style', query.style);
  if (query.bodyPart) params.set('bodyPart', query.bodyPart);
  if (query.healed === 'healed') params.set('healed', 'true');
  if (query.healed === 'fresh') params.set('healed', 'false');
  return params;
}

export const galeriaKeys = {
  all: ['galeria'] as const,
  list: (query: GaleriaQuery) =>
    ['galeria', query.style ?? '', query.bodyPart ?? '', query.healed ?? 'all'] as const,
};

/**
 * GET /api/galeria -> `{ sucesso, items }`.
 * TODO(migracao): o backend também aceita aliases (estilo/body_part/isHealed...).
 * O cliente mobile envia a forma canônica, como faz o web.
 */
export async function fetchGaleria(query: GaleriaQuery): Promise<GaleriaItem[]> {
  const params = buildGaleriaQueryParams(query);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const payload = await api.get<GaleriaApiResponse>(`/api/galeria${suffix}`, { auth: false });
  if (payload.sucesso === false) {
    throw new ApiError(payload.erro ?? 'gallery.loadError', 400, payload);
  }
  return Array.isArray(payload.items) ? payload.items : [];
}

/** POST /api/portfolio/like/:id -> `{ likes_count }`. */
export async function likeArtwork(id: string): Promise<number | null> {
  const payload = await api.post<{ likes_count?: number }>(`/api/portfolio/like/${id}`);
  return typeof payload.likes_count === 'number' ? payload.likes_count : null;
}
