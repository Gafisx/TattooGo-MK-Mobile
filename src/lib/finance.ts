/**
 * Financial rules for TattooGo MK.
 *
 * Every charge is split 90% to the artist, 9% to the platform and 1% to the
 * studio. All maths is done in integer cents to avoid floating point drift,
 * and the studio share absorbs any rounding remainder so the split always
 * reconciles exactly with the gross amount.
 */
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
