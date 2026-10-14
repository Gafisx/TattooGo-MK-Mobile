/**
 * KYC domain — port nativo dos contratos da Web `components/features/tatuador-kyc-block.tsx`
 * e `app/dashboard/tatuador/layout.tsx`.
 *
 * O gate do dashboard do tatuador só libera o acesso quando o KYC está
 * `aprovado`. Os cinco estados abaixo espelham o contrato canônico da Web:
 *  - `pendente`      -> documentos ainda não enviados.
 *  - `em_analise`    -> análise da plataforma em andamento.
 *  - `rejeitado`     -> documentos recusados; precisa reenviar.
 *  - `aprovado`      -> perfil liberado.
 *  - `nao_aplicavel` -> perfil não é tatuador/estúdio (KYC inexistente).
 */

import type { AppRole } from '@/lib/utils/dashboard-gate';

export type KycStatus = 'pendente' | 'em_analise' | 'rejeitado' | 'aprovado' | 'nao_aplicavel';

export const KYC_STATUSES = [
  'pendente',
  'em_analise',
  'rejeitado',
  'aprovado',
  'nao_aplicavel',
] as const;

const KYC_STATUS_SET: ReadonlySet<string> = new Set(KYC_STATUSES);

/** Normaliza um valor vindo do backend/Clerk (aceita `em análise`, `EM_ANALISE`, etc). */
export function parseKycStatus(value: unknown): KycStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[áàâã]/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return KYC_STATUS_SET.has(normalized) ? (normalized as KycStatus) : null;
}

/** O dashboard do tatuador só é liberado para o status `aprovado`. */
export function isKycAprovado(status: KycStatus | null | undefined): boolean {
  return status === 'aprovado';
}

/** Roles que operam o workspace do estúdio (agenda do tatuador). */
export function isStudioRole(role: AppRole | null | undefined): boolean {
  return role === 'tatuador' || role === 'estudio';
}

export type KycTone = 'warning' | 'info' | 'danger' | 'success' | 'muted';

export interface KycStatusDescriptor {
  status: KycStatus;
  titleKey: string;
  messageKey: string;
  tone: KycTone;
  /** `true` quando o dashboard deve ser renderizado no lugar do bloqueio. */
  released: boolean;
}

/**
 * Copy + semântica visual de cada estado. As mensagens vivem no i18n (`kyc.*`);
 * aqui guardamos apenas as chaves para não acoplar o domínio à camada de texto.
 */
export const KYC_DESCRIPTORS: Record<KycStatus, KycStatusDescriptor> = {
  pendente: {
    status: 'pendente',
    titleKey: 'kyc.pendente.title',
    messageKey: 'kyc.pendente.message',
    tone: 'warning',
    released: false,
  },
  em_analise: {
    status: 'em_analise',
    titleKey: 'kyc.em_analise.title',
    messageKey: 'kyc.em_analise.message',
    tone: 'info',
    released: false,
  },
  rejeitado: {
    status: 'rejeitado',
    titleKey: 'kyc.rejeitado.title',
    messageKey: 'kyc.rejeitado.message',
    tone: 'danger',
    released: false,
  },
  aprovado: {
    status: 'aprovado',
    titleKey: 'kyc.aprovado.title',
    messageKey: 'kyc.aprovado.message',
    tone: 'success',
    released: true,
  },
  nao_aplicavel: {
    status: 'nao_aplicavel',
    titleKey: 'kyc.nao_aplicavel.title',
    messageKey: 'kyc.nao_aplicavel.message',
    tone: 'muted',
    released: false,
  },
};

export function kycDescriptor(status: KycStatus): KycStatusDescriptor {
  return KYC_DESCRIPTORS[status];
}

/**
 * Resolve o estado de bloqueio a partir da role + status de KYC reconciliados.
 *
 * Retorna `null` quando o dashboard pode ser liberado, ou o `KycStatus` a ser
 * renderizado no `TatuadorKycBlock`.
 *
 *  - `allowUnknown` (modo dev, sem Clerk): role desconhecida -> libera.
 *  - role não-studio -> `nao_aplicavel`.
 *  - role studio sem KYC -> assume `pendente`.
 */
export function resolveKycBlockStatus(
  role: AppRole | null | undefined,
  kycStatus: KycStatus | null | undefined,
  { allowUnknown = false }: { allowUnknown?: boolean } = {},
): KycStatus | null {
  if (!role) return allowUnknown ? null : 'nao_aplicavel';
  if (!isStudioRole(role)) return 'nao_aplicavel';
  if (isKycAprovado(kycStatus)) return null;
  return kycStatus ?? 'pendente';
}
