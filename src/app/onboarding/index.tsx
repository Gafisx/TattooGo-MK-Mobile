import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthDevNotice } from '@/components/features/auth-dev-notice';
import { RoleSelector } from '@/components/features/role-selector';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { clerkErrorMessage } from '@/lib/auth/clerk-errors';
import { parseKycStatus } from '@/lib/kyc';
import { reconcileSession } from '@/lib/session-store';
import { parseAppRole, type AppRole } from '@/lib/utils/dashboard-gate';
import { isAuthConfigured } from '@/providers/app-providers';

/**
 * Fluxo pós-login para definir a `role` quando o perfil autenticado ainda não
 * tem metadados. Grava em `unsafeMetadata` (o `publicMetadata` é exclusivo do
 * backend) e reconcilia a sessão local antes de voltar às tabs.
 */
function ClerkOnboardingScreen() {
  const { isLoaded, user } = useUser();

  const [role, setRole] = useState<AppRole>(() => {
    const publicMetadata = (user?.publicMetadata ?? {}) as Record<string, unknown>;
    const unsafeMetadata = (user?.unsafeMetadata ?? {}) as Record<string, unknown>;
    return parseAppRole(publicMetadata.role) ?? parseAppRole(unsafeMetadata.role) ?? 'cliente';
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!isLoaded || !user) return;
    setSubmitting(true);
    setError(null);

    try {
      const unsafeMetadata = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
      const publicMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;

      await user.update({ unsafeMetadata: { ...unsafeMetadata, role } });

      reconcileSession({
        role,
        kycStatus:
          parseKycStatus(publicMetadata.kycStatus) ??
          parseKycStatus(publicMetadata.kyc_status) ??
          parseKycStatus(unsafeMetadata.kycStatus) ??
          parseKycStatus(unsafeMetadata.kyc_status) ??
          (role === 'cliente' ? 'nao_aplicavel' : 'pendente'),
      });

      router.replace('/');
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 gap-8 pt-8">
        <View className="gap-2">
          <AppText variant="label">Quase lá</AppText>
          <AppText variant="title">Como vais usar o TattooGo?</AppText>
          <AppText variant="muted">
            Escolhe o teu perfil para personalizarmos a tua experiência.
          </AppText>
        </View>

        <RoleSelector value={role} onChange={setRole} />

        {error ? (
          <AppText variant="muted" className="text-xs text-danger">
            {error}
          </AppText>
        ) : null}

        <View className="mt-auto pb-6">
          <Button label="Continuar" loading={submitting} onPress={handleContinue} />
        </View>
      </View>
    </Screen>
  );
}

export default function OnboardingScreen() {
  if (!isAuthConfigured) return <AuthDevNotice title="Onboarding indisponível" />;
  return <ClerkOnboardingScreen />;
}
