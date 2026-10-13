import { ApiError, api } from '@/lib/api';
import { agendamentos as seedAgendamentos } from '@/data/agenda-seed';
import { depositAmount } from '@/lib/agenda-timeline';
import type { AgendaPayment, Agendamento } from '@/lib/types/agenda';

export interface AgendamentosApiResponse {
  sucesso?: boolean;
  items?: Agendamento[];
  erro?: string;
}

export const agendaKeys = {
  all: ['agendamentos'] as const,
  list: () => ['agendamentos', 'list'] as const,
};

/**
 * GET /api/agendamentos -> `{ sucesso, items }`.
 *
 * TODO(migracao): o backend ainda responde `[]` (sem GET real — ver
 * `docs/expo-migration-backlog.json`). Enquanto isso, caímos no seed local para
 * manter a timeline navegável. Remover o fallback quando o GET existir.
 */
export async function fetchAgendamentos(): Promise<Agendamento[]> {
  try {
    const payload = await api.get<AgendamentosApiResponse>('/api/agendamentos');
    if (payload.sucesso === false) {
      throw new ApiError(payload.erro ?? 'agenda.loadError', 400, payload);
    }
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      return payload.items;
    }
  } catch {
    // Sem GET real / rede indisponível -> mantém a agenda demonstrável.
  }
  return seedAgendamentos;
}

/**
 * Deriva a lista de pagamentos a partir dos agendamentos: cada sessão gera um
 * sinal (25%) e um saldo restante (75%). O status acompanha o fluxo do
 * agendamento — o saldo só é considerado pago quando a sessão é concluída.
 */
export function derivePayments(agendamentos: Agendamento[]): AgendaPayment[] {
  return agendamentos.flatMap((agendamento) => {
    const depositCents = depositAmount(agendamento.totalCents);
    const balanceCents = agendamento.totalCents - depositCents;
    const depositPaid = agendamento.depositPaidCents > 0;
    const completed = agendamento.status === 'concluido';
    const refunded = agendamento.status === 'cancelado' && depositPaid;

    return [
      {
        id: `${agendamento.id}_deposit`,
        agendamentoId: agendamento.id,
        kind: 'deposit',
        amountCents: depositCents,
        status: refunded ? 'reembolsado' : depositPaid ? 'pago' : 'pendente',
        paidAt: depositPaid ? agendamento.createdAt : null,
        createdAt: agendamento.createdAt,
      },
      {
        id: `${agendamento.id}_balance`,
        agendamentoId: agendamento.id,
        kind: 'balance',
        amountCents: balanceCents,
        status: completed ? 'pago' : 'pendente',
        paidAt: completed ? agendamento.scheduledAt : null,
        createdAt: agendamento.createdAt,
      },
    ] satisfies AgendaPayment[];
  });
}
