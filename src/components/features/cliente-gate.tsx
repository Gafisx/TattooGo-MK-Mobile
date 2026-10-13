import { useUser } from '@clerk/clerk-expo';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { parseAppRole } from '@/lib/utils/dashboard-gate';
import { isAuthConfigured } from '@/providers/app-providers';

function Centered({ children }: { children: ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-3 px-8">{children}</View>;
}

function Loading() {
  return (
    <Centered>
      <ActivityIndicator color={colors.accent} />
    </Centered>
  );
}

function Blocked() {
  return (
    <Centered>
      <AppText variant="heading" className="text-center">
        Acesso restrito
      </AppText>
      <AppText variant="muted" className="text-center">
        A Galeria de Inspirações é exclusiva para clientes.
      </AppText>
    </Centered>
  );
}

/**
 * Only mounted when Clerk is configured, so `useUser` is always inside a
 * ClerkProvider. Reconciles role from publicMetadata then unsafeMetadata.
 */
function ClerkClienteGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <Loading />;

  const publicMetadata = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const unsafeMetadata = (user?.unsafeMetadata ?? {}) as Record<string, unknown>;
  const role = parseAppRole(publicMetadata.role) ?? parseAppRole(unsafeMetadata.role);

  if (role !== 'cliente') return <Blocked />;

  return <>{children}</>;
}

/**
 * Guard equivalent to `requireDashboardPerfil('cliente')`.
 *
 * TODO(migracao): quando o backend expõe `Perfil.role`, reconciliar a role de
 * Clerk com o perfil persistido (como em `requireDashboardSession` no web).
 * Sem EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY o gate roda em modo dev (pass-through).
 */
export function ClienteOnly({ children }: { children: ReactNode }) {
  if (!isAuthConfigured) {
    return <>{children}</>;
  }
  return <ClerkClienteGate>{children}</ClerkClienteGate>;
}
