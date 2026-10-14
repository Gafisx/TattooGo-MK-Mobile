import type { Pedido, StudioArtistRow } from '@/lib/types/studio';

/**
 * Seed local do roster do estúdio (pedidos + parceiros).
 *
 * Usado pelo service `lib/services/studio.ts` enquanto o backend não expõe
 * `GET /api/studios/affiliation` (mesmo padrão de `data/agenda-seed.ts`).
 * Espelha o shape canônico de `lib/types/studio.ts` para que a troca pelo dado
 * real seja transparente. Substituir por `lib/mocks/studio-*` quando existirem.
 */
export const studioPedidos: Pedido[] = [
  {
    id: 'pd_2001',
    artista: {
      id: 'a2',
      name: 'Marina Costa',
      avatarUrl: null,
      initial: 'M',
    },
    styles: ['fineLine', 'minimalista'],
    status: 'pendente',
    createdAt: '2026-10-11T14:20:00.000Z',
  },
  {
    id: 'pd_2002',
    artista: {
      id: 'a4',
      name: 'Bianca Rocha',
      avatarUrl: null,
      initial: 'B',
    },
    styles: ['aquarela', 'oriental'],
    status: 'pendente',
    createdAt: '2026-10-13T09:05:00.000Z',
  },
];

export const studioPartners: StudioArtistRow[] = [
  {
    id: 'a1',
    name: 'Rafa Ink',
    avatarUrl: null,
    initial: 'R',
    styles: ['realismo', 'blackwork'],
    status: 'ativo',
  },
  {
    id: 'a3',
    name: 'Diego Pires',
    avatarUrl: null,
    initial: 'D',
    styles: ['oldSchool', 'neoTradicional'],
    status: 'ativo',
  },
];
