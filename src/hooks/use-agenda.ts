import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { agendaKeys, derivePayments, fetchAgendamentos } from '@/lib/services/agendamentos';
import type { AgendaPayment, Agendamento } from '@/lib/types/agenda';

export interface UseAgendaResult {
  agendamentos: Agendamento[];
  payments: AgendaPayment[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * React Query wrapper around `GET /api/agendamentos`. Deriva a carteira de
 * pagamentos (sinal + saldo) a partir dos agendamentos enquanto não existe um
 * endpoint dedicado de pagamentos.
 */
export function useAgenda(): UseAgendaResult {
  const query = useQuery({
    queryKey: agendaKeys.list(),
    queryFn: fetchAgendamentos,
    staleTime: 30 * 1000,
  });

  const data = query.data;
  const agendamentos = useMemo(() => data ?? [], [data]);
  const payments = useMemo(() => derivePayments(agendamentos), [agendamentos]);

  return {
    agendamentos,
    payments,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
