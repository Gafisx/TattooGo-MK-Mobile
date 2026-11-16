import { ApiError, api, endpoints } from '@/lib/api';
import { depositAmount } from '@/lib/agenda-timeline';
import type { AgendaArtist, AgendaPayment, Agendamento, AgendamentoStatus } from '@/lib/types/agenda';

export interface AgendamentosApiResponse {
  sucesso?: boolean;
  items?: Agendamento[];
  agendamentos?: Agendamento[];
  erro?: string;
}

export const agendaKeys = {
  all: ['agendamentos'] as const,
  list: () => ['agendamentos', 'list'] as const,
};

/**
 * Normaliza estados vindos do backend Express/Prisma para os canônicos do app.
 * Suporta estados como AGUARDANDO_SINAL, SINAL_PAGO, CONFIRMADO, CONCLUIDO e CANCELADO.
 */
export function normalizeAgendamentoStatus(raw: unknown): AgendamentoStatus {
  if (typeof raw !== 'string') return 'pendente';
  const val = raw.trim().toLowerCase();
  switch (val) {
    case 'aguardando_sinal':
    case 'aguardando-sinal':
    case 'pendente':
    case 'pending':
      return 'pendente';
    case 'sinal_pago':
    case 'sinal-pago':
    case 'deposit_paid':
      return 'sinal_pago';
    case 'confirmado':
    case 'confirmed':
      return 'confirmado';
    case 'concluido':
    case 'concluído':
    case 'finalizado':
    case 'completed':
      return 'concluido';
    case 'cancelado':
    case 'cancelled':
    case 'canceled':
      return 'cancelado';
    default:
      return 'pendente';
  }
}

/**
 * Normaliza os agendamentos brutos retornados pelo BFF/Express para o contrato `Agendamento`.
 */
export function parseAgendamento(raw: unknown, index: number): Agendamento {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const status = normalizeAgendamentoStatus(record.status);

  const artistaRaw =
    typeof record.artista === 'object' && record.artista !== null
      ? (record.artista as Record<string, unknown>)
      : typeof record.artist === 'object' && record.artist !== null
      ? (record.artist as Record<string, unknown>)
      : typeof record.tatuador === 'object' && record.tatuador !== null
      ? (record.tatuador as Record<string, unknown>)
      : {};

  const artistaName =
    typeof artistaRaw.name === 'string'
      ? artistaRaw.name
      : typeof artistaRaw.nome === 'string'
      ? artistaRaw.nome
      : 'Artista';

  const initial =
    typeof artistaRaw.initial === 'string'
      ? artistaRaw.initial
      : artistaName.charAt(0).toUpperCase();

  const studioName =
    typeof artistaRaw.studioName === 'string'
      ? artistaRaw.studioName
      : typeof (artistaRaw.studio as Record<string, unknown>)?.name === 'string'
      ? ((artistaRaw.studio as Record<string, unknown>).name as string)
      : typeof (artistaRaw.estudio as Record<string, unknown>)?.nome === 'string'
      ? ((artistaRaw.estudio as Record<string, unknown>).nome as string)
      : null;

  const artista: AgendaArtist = {
    id: String(artistaRaw.id ?? `artist-${index + 1}`),
    name: artistaName,
    avatarUrl:
      typeof artistaRaw.avatarUrl === 'string'
        ? artistaRaw.avatarUrl
        : typeof artistaRaw.avatar_url === 'string'
        ? artistaRaw.avatar_url
        : null,
    initial,
    studioName,
  };

  const totalCents = Number(
    record.totalCents ?? record.total_cents ?? record.valorTotal ?? record.priceCents ?? 0
  );

  const depositPaidCents = Number(
    record.depositPaidCents ??
      record.deposit_paid_cents ??
      record.sinalPagoCents ??
      (status !== 'pendente' && status !== 'cancelado' ? Math.round(totalCents * 0.25) : 0)
  );

  return {
    id: String(record.id ?? `agendamento-${index + 1}`),
    artista,
    estilo: String(record.estilo ?? record.style ?? 'Realismo'),
    bodyPart: String(record.bodyPart ?? record.body_part ?? record.localCorpo ?? 'Antebraço'),
    sessionDuration: String(record.sessionDuration ?? record.session_duration ?? record.duracao ?? '3-4h'),
    scheduledAt: String(record.scheduledAt ?? record.scheduled_at ?? record.data ?? new Date().toISOString()),
    createdAt: String(record.createdAt ?? record.created_at ?? new Date().toISOString()),
    status,
    totalCents,
    depositPaidCents,
  };
}

/**
 * GET /api/agendamentos -> `{ sucesso, items }`.
 * Consome diretamente os dados reais do BFF sem recorrer a seeds quando a API responder.
 */
export async function fetchAgendamentos(): Promise<Agendamento[]> {
  const payload = await api.get<unknown>(endpoints.bookings.list());

  if (Array.isArray(payload)) {
    return payload.map(parseAgendamento);
  }

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (record.sucesso === false) {
      throw new ApiError(
        typeof record.erro === 'string' ? record.erro : 'agenda.loadError',
        400,
        payload
      );
    }
    if (Array.isArray(record.items)) {
      return record.items.map(parseAgendamento);
    }
    if (Array.isArray(record.agendamentos)) {
      return record.agendamentos.map(parseAgendamento);
    }
    if (Array.isArray(record.data)) {
      return record.data.map(parseAgendamento);
    }
  }

  return [];
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
