import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPortfolioWork,
  fetchMyPortfolio,
  portfolioKeys,
  requestUploadPresign,
  uploadImageToStorage,
} from '@/lib/services/portfolio';
import type { PortfolioDraft, PortfolioWork } from '@/lib/types/portfolio';

/** React Query wrapper around `GET /api/tatuador/portfolio`. */
export function useMyPortfolio() {
  return useQuery({
    queryKey: portfolioKeys.all,
    queryFn: fetchMyPortfolio,
    staleTime: 30 * 1000,
  });
}

/**
 * Fluxo completo de publicação (espelha o web):
 *  1. `POST /api/upload/presign` -> URL assinada + key
 *  2. `PUT <uploadUrl>`         -> binário da imagem no storage
 *  3. `POST /api/tatuador/portfolio` -> persiste o item com a `imageUrl` final
 *
 * A key do objeto é usada como fallback de `imageUrl` quando o backend ainda
 * não resolve a URL pública no presign.
 */
export function usePublishPortfolioWork() {
  const queryClient = useQueryClient();

  return useMutation<PortfolioWork | null, Error, PortfolioDraft>({
    mutationFn: async (draft) => {
      if (!draft.style || !draft.bodyPart || !draft.sessionDuration) {
        throw new Error('portfolio.upload.missingFields');
      }

      const presign = await requestUploadPresign({
        fileName: draft.fileName,
        contentType: draft.contentType,
        fileSize: draft.fileSize,
      });

      await uploadImageToStorage(presign.uploadUrl, draft.uri, draft.contentType);

      return createPortfolioWork({
        imageUrl: presign.publicUrl ?? presign.key,
        key: presign.key,
        style: draft.style,
        bodyPart: draft.bodyPart,
        sessionDuration: draft.sessionDuration,
        isHealed: draft.isHealed,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}
