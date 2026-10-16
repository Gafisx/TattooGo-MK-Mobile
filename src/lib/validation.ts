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

/**
 * Validates a Brazilian CPF using the official check-digit algorithm.
 * Accepts formatted input (e.g. `123.456.789-09`).
 */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (base.length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calcDigit(cpf.slice(0, 9));
  const secondDigit = calcDigit(cpf.slice(0, 9) + firstDigit);

  return cpf === cpf.slice(0, 9) + String(firstDigit) + String(secondDigit);
}

export function formatCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export const BIRTH_DATE_LENGTH = 10;

/** Formats a birth date as `DD/MM/AAAA` while the user types. */
export function formatBirthDate(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

/** Formats a real calendar `Date` back into the canonical `DD/MM/AAAA` string. */
export function formatBirthDateFromDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Parses `DD/MM/AAAA` into a real calendar `Date`, or `null` when invalid. */
export function parseBirthDate(value: string): Date | null {
  const digits = onlyDigits(value);
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);

  const isRealCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealCalendarDate) return null;

  const now = new Date();
  if (date.getTime() > now.getTime()) return null;

  return date;
}

/** Validates the birth date and enforces a minimum age (default: 18). */
export function isValidBirthDate(value: string, minAge = 18): boolean {
  const date = parseBirthDate(value);
  if (!date) return false;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDelta = now.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= minAge;
}

export const OTP_LENGTH = 6;

/** OTP validation never leaks intermediate state; it returns a boolean only. */
export function isValidOTP(value: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);
}

export const USERNAME_MAX_LENGTH = 20;
/** Formato canónico do `@username`: 3–20 caracteres `[a-z0-9_]`. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** Normaliza a entrada para o formato canónico (minúsculas, sem `@`). */
export function normalizeUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}

/** Valida um username já normalizado (sem `@`). */
export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}
