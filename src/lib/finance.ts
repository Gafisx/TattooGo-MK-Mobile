/**
 * Financial rules for TattooGo MK.
 *
 * Every charge is split 90% to the artist, 9% to the platform and 1% to the
 * studio. All maths is done in integer cents to avoid floating point drift,
 * and the studio share absorbs any rounding remainder so the split always
 * reconciles exactly with the gross amount.
 */

import type { AppRole } from '@/lib/utils/dashboard-gate';

export const FEE_RATES = {
  artist: 0.9,
  platform: 0.09,
  studio: 0.01,
} as const;

export interface PaymentSplit {
  grossCents: number;
  artistCents: number;
  platformCents: number;
  studioCents: number;
}

export function splitPayment(amountCents: number): PaymentSplit {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new RangeError('amountCents must be a non-negative integer of cents');
  }

  const artistCents = Math.floor(amountCents * FEE_RATES.artist);
  const platformCents = Math.floor(amountCents * FEE_RATES.platform);
  const studioCents = amountCents - artistCents - platformCents;

  return { grossCents: amountCents, artistCents, platformCents, studioCents };
}

export function formatBRL(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountCents / 100);
}

/**
 * Modelo de repasse de um recibo. Espelha a regra do web: o tatuador solo
 * opera com a taxa cheia (90/9/1) enquanto o estúdio desconta a parte da casa
 * e o imposto (88/8/3/1).
 */
export type ReceiptModel = 'solo' | 'estudio';

export interface ReceiptSplit {
  grossCents: number;
  /** Parte do tatuador (nunca sofre arredondamento para baixo). */
  tatuador: number;
  /** Parte da plataforma. */
  plataforma: number;
  /** Parte do estúdio (absorve o resíduo de arredondamento). */
  estudio: number;
  /** Imposto retido na fonte (0 no modelo solo). */
  impostos: number;
}

interface ReceiptRates {
  tatuador: number;
  plataforma: number;
  estudio: number;
  impostos: number;
}

/**
 * Taxas por modelo, em frações do bruto. `solo` reconcilia 90/9/1 e `estudio`
 * reconcilia 88/8/3/1 — a mesma divergência documentada no
 * `docs/expo-migration-backlog.json` (bloqueador `finance-split`).
 */
const RECEIPT_RATES: Record<ReceiptModel, ReceiptRates> = {
  solo: { tatuador: 0.9, plataforma: 0.09, estudio: 0.01, impostos: 0 },
  estudio: { tatuador: 0.88, plataforma: 0.08, estudio: 0.03, impostos: 0.01 },
};

/**
 * Resolve o modelo de split a partir da role do espectador: `estudio` apenas
 * para a role homónima; tatuador (e qualquer outra) cai no modelo `solo`.
 */
export function receiptModelForRole(role: AppRole | null | undefined): ReceiptModel {
  return role === 'estudio' ? 'estudio' : 'solo';
}

/**
 * Divide um valor em centavos no modelo indicado. Trabalha em inteiros e
 * deixa o resíduo de arredondamento com o estúdio, tal como `splitPayment`.
 */
export function calculateSplits(amountCents: number, model: ReceiptModel): ReceiptSplit {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new RangeError('amountCents must be a non-negative integer of cents');
  }

  const rates = RECEIPT_RATES[model];
  const tatuador = Math.floor(amountCents * rates.tatuador);
  const plataforma = Math.floor(amountCents * rates.plataforma);
  const impostos = Math.floor(amountCents * rates.impostos);
  const estudio = amountCents - tatuador - plataforma - impostos;

  return { grossCents: amountCents, tatuador, plataforma, estudio, impostos };
}
