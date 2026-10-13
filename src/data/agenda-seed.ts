import type { Agendamento } from '@/lib/types/agenda';

/**
 * Seed de agendamentos usada enquanto o backend não expõe `GET /api/agendamentos`
 * (bloqueador conhecido: `agendamentoService.getAgendamentos()` retorna `[]`).
 * Espelha o shape canônico de `lib/types/agenda.ts` para que a troca pelo dado
 * real seja transparente.
 */
export const agendamentos: Agendamento[] = [
  {
    id: 'ag_1001',
    artista: {
      id: 'a1',
      name: 'Rafa Ink',
      avatarUrl: null,
      initial: 'R',
      studioName: 'Ink House SP',
    },
    estilo: 'realismo',
    bodyPart: 'antebraco',
    sessionDuration: 'h2to4',
    scheduledAt: '2026-11-05T15:00:00.000Z',
    createdAt: '2026-10-01T12:30:00.000Z',
    status: 'confirmado',
    totalCents: 120000,
    depositPaidCents: 30000,
  },
  {
    id: 'ag_1002',
    artista: {
      id: 'a2',
      name: 'Marina Costa',
      avatarUrl: null,
      initial: 'M',
      studioName: null,
    },
    estilo: 'fineLine',
    bodyPart: 'pulso',
    sessionDuration: 'ate1h',
    scheduledAt: '2026-10-28T11:00:00.000Z',
    createdAt: '2026-10-08T09:10:00.000Z',
    status: 'sinal_pago',
    totalCents: 48000,
    depositPaidCents: 12000,
  },
  {
    id: 'ag_1003',
    artista: {
      id: 'a3',
      name: 'Diego Pires',
      avatarUrl: null,
      initial: 'D',
      studioName: 'Old School BH',
    },
    estilo: 'oldSchool',
    bodyPart: 'braco',
    sessionDuration: 'h4to6',
    scheduledAt: '2026-09-20T13:00:00.000Z',
    createdAt: '2026-09-02T16:45:00.000Z',
    status: 'concluido',
    totalCents: 90000,
    depositPaidCents: 22500,
  },
  {
    id: 'ag_1004',
    artista: {
      id: 'a1',
      name: 'Rafa Ink',
      avatarUrl: null,
      initial: 'R',
      studioName: 'Ink House SP',
    },
    estilo: 'geometrico',
    bodyPart: 'costas',
    sessionDuration: 'fullDay',
    scheduledAt: '2026-12-12T10:00:00.000Z',
    createdAt: '2026-10-12T18:05:00.000Z',
    status: 'pendente',
    totalCents: 260000,
    depositPaidCents: 0,
  },
  {
    id: 'ag_1005',
    artista: {
      id: 'a2',
      name: 'Marina Costa',
      avatarUrl: null,
      initial: 'M',
      studioName: null,
    },
    estilo: 'aquarela',
    bodyPart: 'coxa',
    sessionDuration: 'h2to4',
    scheduledAt: '2026-10-10T14:00:00.000Z',
    createdAt: '2026-09-25T10:00:00.000Z',
    status: 'cancelado',
    totalCents: 70000,
    depositPaidCents: 17500,
  },
];
