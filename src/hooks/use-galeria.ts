import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchGaleria, galeriaKeys } from '@/lib/services/galeria';
import type { GaleriaHealingFilter, GaleriaQuery } from '@/lib/types/galeria';

/**
 * React Query wrapper around `GET /api/galeria`.
 *
 * queryKey: ['galeria', style, bodyPart, healed]  (same as web)
 * staleTime: 30s + keepPreviousData (filtros trocam sem "piscar").
 */
export function useGaleria(query: GaleriaQuery) {
  const healed: GaleriaHealingFilter = query.healed ?? 'all';

  return useQuery({
    queryKey: galeriaKeys.list({ ...query, healed }),
    queryFn: () => fetchGaleria(query),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
