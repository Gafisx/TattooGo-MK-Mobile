/**
 * Pure validation helpers used by the KYC (`seja-tatuador`) and OTP flows.
 * Kept side-effect free so they can be unit tested and reused by screens.
 */

/** Removes every non-digit character. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

/**
 * Validates a Brazilian CNPJ using the official check-digit algorithm.
 * Accepts formatted input (e.g. `12.345.678/0001-95`).
 */
export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string): number => {
    let weight = base.length - 7;
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * weight;
      weight -= 1;
      if (weight < 2) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cnpj.slice(0, 12));
  const secondDigit = calcDigit(cnpj.slice(0, 12) + firstDigit);

  return cnpj === cnpj.slice(0, 12) + String(firstDigit) + String(secondDigit);
}

export function formatCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export const OTP_LENGTH = 6;

/** OTP validation never leaks intermediate state; it returns a boolean only. */
export function isValidOTP(value: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);
}
