import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchStudioAffiliation, respondToAffiliation, studioKeys } from '@/lib/services/studio';
import type { PedidoDecision, StudioAffiliation, StudioArtistRow } from '@/lib/types/studio';

export interface UseStudioAffiliationResult {
  /** Pedidos ainda aguardando decisão (`status === 'pendente'`). */
  pending: StudioAffiliation['pedidos'];
  /** Todo o histórico de pedidos (inclui aceitos/rejeitados). */
  pedidos: StudioAffiliation['pedidos'];
  /** Roster de tatuadores afiliados ao estúdio. */
  partners: StudioArtistRow[];
  isLoading: boolean;
  isError: boolean;
  /** Id do pedido sendo processado, ou `null`. */
  respondingId: string | null;
  respond: (pedidoId: string, decision: PedidoDecision) => Promise<StudioAffiliation>;
  refetch: () => void;
}

/**
 * Afiliação do estúdio: pedidos pendentes + roster de parceiros.
 *
 * Envolve `GET /api/studios/affiliation` (React Query) e a mutation
 * `PATCH /api/studios/affiliation` (aceitar/rejeitar). O servidor devolve o
 * agregado atualizado, que substitui o cache da query.
 */
export function useStudioAffiliation(): UseStudioAffiliationResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: studioKeys.affiliation(),
    queryFn: fetchStudioAffiliation,
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ pedidoId, decision }: { pedidoId: string; decision: PedidoDecision }) =>
      respondToAffiliation(pedidoId, decision),
    onSuccess: (data) => queryClient.setQueryData(studioKeys.affiliation(), data),
  });

  const pedidos = query.data?.pedidos ?? [];
  const partners = query.data?.partners ?? [];

  return {
    pedidos,
    pending: pedidos.filter((pedido) => pedido.status === 'pendente'),
    partners,
    isLoading: query.isLoading,
    isError: query.isError,
    respondingId: mutation.isPending ? (mutation.variables?.pedidoId ?? null) : null,
    respond: mutation.mutateAsync,
    refetch: () => void query.refetch(),
  };
}
