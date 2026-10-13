/**
 * Native equivalent of the web `requireDashboardPerfil('cliente')` gate.
 *
 * The role is reconciled from Clerk metadata (publicMetadata/unsafeMetadata)
 * and, in the full product, from `Perfil.role`. These helpers stay pure so the
 * gate component and tests share one source of truth.
 */
export type AppRole = 'cliente' | 'tatuador' | 'estudio';

export interface DashboardPerfil {
  role: AppRole;
  kycStatus: string | null;
}

const APP_ROLES: readonly AppRole[] = ['cliente', 'tatuador', 'estudio'];

export function parseAppRole(value: unknown): AppRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return (APP_ROLES as readonly string[]).includes(normalized) ? (normalized as AppRole) : null;
}

export function isDashboardAllowed(
  perfil: DashboardPerfil | null | undefined,
  required: AppRole,
): boolean {
  return perfil?.role === required;
}

/** KYC gate used by the tatuador dashboard layout (`kyc_status === 'aprovado'`). */
export function isTatuadorKycAprovado(perfil: DashboardPerfil | null | undefined): boolean {
  return perfil?.role === 'tatuador' && perfil.kycStatus === 'aprovado';
}
