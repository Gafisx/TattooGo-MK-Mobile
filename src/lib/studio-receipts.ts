import { calculateSplits, type ReceiptModel, type ReceiptSplit } from '@/lib/finance';
import type { Agendamento, AgendamentoStatus } from '@/lib/types/agenda';

/**
 * Recibos do tatuador/estúdio (port da visão de Recebimentos do web).
 *
 * Cada agendamento já pago gera um recibo com o split financeiro do modelo
 * ativo (`solo` ou `estudio`) e um estado de escrow que decide em qual saldo a
 * parte do tatuador cai:
 *
 *  - `held`     -> valor retido à espera da conclusão da sessão.
 *  - `secured`  -> caução garantida (data travada pelo sinal).
 *  - `released` -> valor liberado, disponível para saque.
 *  - `refunded` -> sinal devolvido ao cliente (não entra em nenhum saldo).
 */

export type EscrowStatus = 'held' | 'secured' | 'released' | 'refunded';

export interface Receipt {
  id: string;
  agendamento: Agendamento;
  escrow: EscrowStatus;
  split: ReceiptSplit;
}

/**
 * Estado de escrow derivado do status canônico. `pendente` e `cancelado` não
 * geram recibo: nada foi efetivamente cobrado (ou o sinal já foi devolvido).
 */
const ESCROW_BY_STATUS: Partial<Record<AgendamentoStatus, EscrowStatus>> = {
  sinal_pago: 'held',
  confirmado: 'secured',
  concluido: 'released',
};

export function receiptEscrowStatus(status: AgendamentoStatus): EscrowStatus | null {
  return ESCROW_BY_STATUS[status] ?? null;
}

/** Constrói a lista de recibos (sessões concluídas/confirmadas) do modelo dado. */
export function buildReceipts(agendamentos: Agendamento[], model: ReceiptModel): Receipt[] {
  return agendamentos.flatMap((agendamento) => {
    const escrow = receiptEscrowStatus(agendamento.status);
    if (!escrow) return [];
    return [
      {
        id: agendamento.id,
        agendamento,
        escrow,
        split: calculateSplits(agendamento.totalCents, model),
      } satisfies Receipt,
    ];
  });
}

export interface ReceiptsSummary {
  /** Soma da parte do tatuador com escrow `held`. */
  held: number;
  /** Soma da parte do tatuador com escrow `released` (disponível). */
  released: number;
  /** Soma da parte do tatuador com escrow `secured` (cauções garantidas). */
  secured: number;
  /** Bruto total dos recibos elegíveis. */
  gross: number;
}

/** Consolida os recibos nos quatro saldos exibidos pelo `ReceiptsOverview`. */
export function summarizeReceipts(receipts: Receipt[]): ReceiptsSummary {
  return receipts.reduce<ReceiptsSummary>(
    (acc, receipt) => {
      acc.gross += receipt.split.grossCents;
      const share = receipt.split.tatuador;
      if (receipt.escrow === 'held') acc.held += share;
      else if (receipt.escrow === 'released') acc.released += share;
      else if (receipt.escrow === 'secured') acc.secured += share;
      return acc;
    },
    { held: 0, released: 0, secured: 0, gross: 0 },
  );
}
