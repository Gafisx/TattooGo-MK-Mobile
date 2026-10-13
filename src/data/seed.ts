import type { Artist, ChatThread, PortfolioPiece } from '@/types';

/**
 * Seed data used until the live backend (`api.tattoogomk.com.br`) is wired via
 * the `api` client. Kept in one place so it is trivial to delete later.
 */
export const artists: Artist[] = [
  {
    id: 'a1',
    name: 'Rafa Ink',
    handle: '@rafaink',
    city: 'São Paulo, SP',
    styles: ['Realismo', 'Preto e Cinza'],
    priceFromCents: 45000,
    rating: 4.9,
    artworks: 132,
    verified: true,
  },
  {
    id: 'a2',
    name: 'Marina Costa',
    handle: '@marinacosta.tattoo',
    city: 'Rio de Janeiro, RJ',
    styles: ['Fine Line', 'Botânico'],
    priceFromCents: 32000,
    rating: 4.8,
    artworks: 87,
    verified: true,
  },
  {
    id: 'a3',
    name: 'Diego Pires',
    handle: '@diegopires',
    city: 'Belo Horizonte, MG',
    styles: ['Old School', 'Neotradicional'],
    priceFromCents: 38000,
    rating: 4.7,
    artworks: 64,
    verified: false,
  },
];

export const portfolio: PortfolioPiece[] = [
  { id: 'p1', title: 'Leão Realista', style: 'Realismo', priceCents: 120000 },
  { id: 'p2', title: 'Ramagem Fine Line', style: 'Fine Line', priceCents: 48000 },
  { id: 'p3', title: 'Ancora Old School', style: 'Old School', priceCents: 65000 },
  { id: 'p4', title: 'Mandala Geométrica', style: 'Geométrico', priceCents: 90000 },
];

export const chatThreads: ChatThread[] = [
  {
    id: 't1',
    artistName: 'Rafa Ink',
    lastMessage: 'Consigo te encaixar quinta às 15h.',
    updatedAt: '09:24',
    unread: 2,
  },
  {
    id: 't2',
    artistName: 'Marina Costa',
    lastMessage: 'Enviei o orçamento com a taxa de sinal.',
    updatedAt: 'Ontem',
    unread: 0,
  },
];
