import { useUser } from '@clerk/clerk-expo';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { TatuadorKycBlock } from '@/components/features/tatuador-kyc-block';
import { colors } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { parseKycStatus, resolveKycBlockStatus, type KycStatus } from '@/lib/kyc';
import { parseAppRole, type AppRole } from '@/lib/utils/dashboard-gate';
import { isAuthConfigured } from '@/providers/app-providers';

function Centered({ children }: { children: ReactNode }) {
  return <View className="flex-1 items-center justify-center">{children}</View>;
}

function Loading() {
  return (
    <Centered>
      <ActivityIndicator color={colors.accent} />
    </Centered>
  );
}

export interface TatuadorKycGateProps {
  children: ReactNode;
}

/**
 * Barreira de KYC do Dashboard do tatuador (port de `app/dashboard/tatuador/layout.tsx`).
 *
 * Reconcilia a role + o KYC a partir do store local (`useSession`) e dos
 * metadados do Clerk (`publicMetadata`, depois `unsafeMetadata`). Quando o
 * perfil não é tatuador/estúdio OU o KYC não está `aprovado`, o `TatuadorKycBlock`
 * é renderizado no lugar dos `children`.
 *
 * Sem Clerk configurado (modo dev) a role desconhecida libera o acesso, mantendo
 * o app navegável — mesma semântica do `ClienteOnly`.
 */
export function TatuadorKycGate({ children }: TatuadorKycGateProps) {
  const session = useSession();

  if (!isAuthConfigured) {
    const blocked = resolveKycBlockStatus(session.role, session.kycStatus, { allowUnknown: true });
    if (blocked) return <TatuadorKycBlock status={blocked} />;
    return <>{children}</>;
  }

  return <ClerkTatuadorKycGate session={session}>{children}</ClerkTatuadorKycGate>;
}

/**
 * Só é montado quando o Clerk está configurado, então `useUser` está sempre
 * dentro de um `ClerkProvider`.
 */
function ClerkTatuadorKycGate({
  children,
  session,
}: {
  children: ReactNode;
  session: { role: AppRole | null; kycStatus: KycStatus | null };
}) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <Loading />;

  const publicMetadata = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const unsafeMetadata = (user?.unsafeMetadata ?? {}) as Record<string, unknown>;

  const role =
    parseAppRole(publicMetadata.role) ?? parseAppRole(unsafeMetadata.role) ?? session.role;
  const kycStatus =
    parseKycStatus(publicMetadata.kycStatus) ??
    parseKycStatus(publicMetadata.kyc_status) ??
    parseKycStatus(unsafeMetadata.kycStatus) ??
    parseKycStatus(unsafeMetadata.kyc_status) ??
    session.kycStatus;

  const blocked = resolveKycBlockStatus(role, kycStatus);

  if (blocked) return <TatuadorKycBlock status={blocked} />;

  return <>{children}</>;
}
