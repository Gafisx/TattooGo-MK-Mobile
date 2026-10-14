import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archivePortfolioWork,
  createPortfolioWork,
  fetchMyPortfolio,
  portfolioKeys,
  requestUploadPresign,
  updatePortfolioWork,
  uploadImageToStorage,
} from '@/lib/services/portfolio';
import type {
  PortfolioDraft,
  PortfolioUpdateInput,
  PortfolioWork,
} from '@/lib/types/portfolio';

/** React Query wrapper around `GET /api/tatuador/portfolio`. */
export function useMyPortfolio() {
  return useQuery({
    queryKey: portfolioKeys.all,
    queryFn: fetchMyPortfolio,
    staleTime: 30 * 1000,
  });
}

function useInvalidatePortfolio() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
  };
}

/**
 * Fluxo completo de publicação (espelha o web):
 *  1. `POST /api/upload/presign`      -> `{ presignedUrl, publicUrl }`
 *  2. `PUT <presignedUrl>` (S3)       -> binário da imagem no storage
 *  3. `POST /api/tatuador/portfolio`  -> persiste o item com a `publicUrl`
 */
export function usePublishPortfolioWork() {
  const invalidate = useInvalidatePortfolio();

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

      await uploadImageToStorage(presign.presignedUrl, draft.uri, draft.contentType);

      return createPortfolioWork({
        imageUrl: presign.publicUrl,
        style: draft.style,
        bodyPart: draft.bodyPart,
        sessionDuration: draft.sessionDuration,
        isHealed: draft.isHealed,
        notes: draft.notes,
      });
    },
    onSuccess: invalidate,
  });
}

/**
 * Curadoria de um item existente (`PATCH /api/tatuador/portfolio/:id`).
 *
 * A imagem é reenviada como `imageUrl` atual (substituição total), conforme o
 * contrato web; apenas os metadados (tags/healing/notes) são editados.
 */
export function useUpdatePortfolioWork() {
  const invalidate = useInvalidatePortfolio();

  return useMutation<PortfolioWork | null, Error, { id: string; input: PortfolioUpdateInput }>({
    mutationFn: ({ id, input }) => updatePortfolioWork(id, input),
    onSuccess: invalidate,
  });
}

/** Arquiva (remove) um item (`DELETE /api/tatuador/portfolio/:id`). */
export function useArchivePortfolioWork() {
  const invalidate = useInvalidatePortfolio();

  return useMutation<void, Error, string>({
    mutationFn: (id) => archivePortfolioWork(id),
    onSuccess: invalidate,
  });
}
