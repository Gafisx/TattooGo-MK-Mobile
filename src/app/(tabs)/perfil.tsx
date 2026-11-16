import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { isAuthConfigured } from '@/lib/env';
import { reconcileSession } from '@/lib/session-store';
import { parseAppRole, type AppRole } from '@/lib/utils/dashboard-gate';

interface PerfilEnsureResponse {
  sucesso?: boolean;
  perfil?: {
    id?: string;
    nome?: string;
    email?: string;
    role?: string;
    kycStatus?: string;
    avatarUrl?: string;
    telefone?: string;
    cidade?: string;
  };
  role?: string;
  kycStatus?: string;
  [key: string]: unknown;
}

function PerfilAuthenticated() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const { triggerHaptic } = useHapticFeedback();
  const { role: sessionRole } = useSession();

  // Consulta e assegura a sincronia do perfil no Neon DB via BFF
  const { data: dbProfile } = useQuery<PerfilEnsureResponse>({
    queryKey: ['perfil', 'ensure', user?.id],
    queryFn: async () => {
      try {
        return await api.post<PerfilEnsureResponse>('/api/perfil/ensure');
      } catch {
        return await api.get<PerfilEnsureResponse>('/api/perfil/ensure');
      }
    },
    enabled: isLoaded && isSignedIn === true && !!user,
    staleTime: 60 * 1000,
  });

  // Reconcilia a role e status de KYC no store global de sessão
  useEffect(() => {
    if (dbProfile) {
      const rawRole = dbProfile.perfil?.role ?? dbProfile.role;
      const rawKyc = dbProfile.perfil?.kycStatus ?? dbProfile.kycStatus;
      if (rawRole || rawKyc) {
        reconcileSession({ role: rawRole, kycStatus: rawKyc });
      }
    }
  }, [dbProfile]);

  const userPublicRole = parseAppRole((user?.publicMetadata as Record<string, unknown> | undefined)?.role);
  const userUnsafeRole = parseAppRole((user?.unsafeMetadata as Record<string, unknown> | undefined)?.role);
  const dbRole = parseAppRole(dbProfile?.perfil?.role ?? dbProfile?.role);
  const currentRole: AppRole = dbRole ?? sessionRole ?? userPublicRole ?? userUnsafeRole ?? 'cliente';

  const displayName =
    user?.fullName ||
    user?.firstName ||
    dbProfile?.perfil?.nome ||
    (user?.emailAddresses?.[0]?.emailAddress ? user.emailAddresses[0].emailAddress.split('@')[0] : 'Usuário TattooGo');

  const displayEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    dbProfile?.perfil?.email ||
    'Conta ativa';

  const avatarUrl = user?.imageUrl || dbProfile?.perfil?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = useCallback(() => {
    void triggerHaptic('medium');
    Alert.alert('Encerrar sessão', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            console.warn('[Perfil] Erro ao deslogar:', error);
          }
        },
      },
    ]);
  }, [signOut, triggerHaptic]);

  const roleLabels: Record<AppRole, string> = {
    cliente: 'Cliente',
    tatuador: 'Tatuador Pro',
    estudio: 'Estúdio Verificado',
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-2">
        <View className="flex-row items-center gap-4 py-4">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.elevated }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-glow">
              <AppText variant="heading" className="text-xl text-accent">
                {initial}
              </AppText>
            </View>
          )}
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <AppText variant="heading" numberOfLines={1}>
                {displayName}
              </AppText>
            </View>
            <AppText variant="muted" numberOfLines={1} className="text-xs">
              {displayEmail}
            </AppText>
            <View className="mt-0.5 self-start rounded-full border border-line bg-surface px-2.5 py-0.5">
              <AppText variant="muted" className="text-[10px] font-semibold text-accent">
                {roleLabels[currentRole]}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View className="px-5 pt-1">
        {currentRole === 'tatuador' && (
          <Button
            label="Acessar Painel do Tatuador"
            onPress={() => router.push('/tatuador')}
          />
        )}
        {currentRole === 'estudio' && (
          <Button
            label="Acessar Painel do Estúdio"
            onPress={() => router.push('/estudio')}
          />
        )}
        {currentRole === 'cliente' && (
          <Button
            label="Seja um Tatuador ou Estúdio"
            variant="secondary"
            onPress={() => router.push('/seja-tatuador')}
          />
        )}
      </View>

      <View className="mt-6 px-5">
        <AppText variant="label" className="mb-2">
          Gerenciamento & Recursos
        </AppText>

        {currentRole === 'tatuador' && (
          <>
            <ListRow
              icon="briefcase-outline"
              title="Painel do Tatuador"
              subtitle="Agenda, portfólio e solicitações recebidas"
              onPress={() => router.push('/tatuador')}
            />
            <ListRow
              icon="hourglass-outline"
              title="Verificação KYC"
              subtitle="Acompanhe a atestação e aprovação de documentos"
              onPress={() => router.push('/kyc-pendente')}
            />
          </>
        )}

        {currentRole === 'estudio' && (
          <>
            <ListRow
              icon="business-outline"
              title="Painel do Estúdio"
              subtitle="Tatuadores parceiros, CNPJ e agenda do estúdio"
              onPress={() => router.push('/estudio')}
            />
            <ListRow
              icon="location-outline"
              title="Endereço do Estúdio"
              subtitle="Localização oficial e coordenadas verificadas"
              onPress={() => router.push('/estudio-endereco')}
            />
          </>
        )}

        <ListRow
          icon="sparkles-outline"
          title="Estúdio de IA"
          subtitle="Gere referências criativas com o Gemini Flash"
          onPress={() => router.push('/ai')}
        />

        <ListRow
          icon="calendar-outline"
          title="Meus Agendamentos"
          subtitle="Consultar agendamentos e histórico"
          onPress={() => router.push('/(tabs)/agendar')}
        />

        <ListRow
          icon="images-outline"
          title="Galeria de Inspirações"
          subtitle="Explore tatuagens da comunidade e referências"
          onPress={() => router.push('/(tabs)/galeria')}
        />

        {currentRole === 'cliente' && (
          <ListRow
            icon="shield-checkmark-outline"
            title="Seja um Tatuador"
            subtitle="Valide seu CNPJ e ative sua conta profissional"
            onPress={() => router.push('/seja-tatuador')}
          />
        )}

        <ListRow
          icon="settings-outline"
          title="Preferências"
          subtitle="Tema escuro de alta performance (Dark Luxury)"
        />

        <ListRow
          icon="log-out-outline"
          title="Sair da Conta"
          subtitle="Encerrar sessão no dispositivo com segurança"
          onPress={handleSignOut}
        />
      </View>
    </ScrollView>
  );
}

function PerfilGuestFallback() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-2">
        <View className="flex-row items-center gap-4 py-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-glow">
            <Ionicons name="person" size={28} color={colors.accent} />
          </View>
          <View className="gap-1">
            <AppText variant="heading">TattooGo Mobile</AppText>
            <AppText variant="muted">Conecte sua conta para sincronizar agendamentos</AppText>
          </View>
        </View>
      </View>

      <View className="px-5">
        <Button label="Entrar ou Criar Conta" onPress={() => router.push('/(auth)/login')} />
      </View>

      <View className="mt-6 px-5">
        <AppText variant="label" className="mb-2">
          Navegação Rápida
        </AppText>
        <ListRow
          icon="sparkles-outline"
          title="Estúdio de IA"
          subtitle="Gere ideias com o Gemini Flash"
          onPress={() => router.push('/ai')}
        />
        <ListRow
          icon="shield-checkmark-outline"
          title="Seja um Tatuador"
          subtitle="Envie seus dados e CNPJ"
          onPress={() => router.push('/seja-tatuador')}
        />
        <ListRow
          icon="briefcase-outline"
          title="Painel do Tatuador"
          subtitle="Agenda e gerenciamento"
          onPress={() => router.push('/tatuador')}
        />
        <ListRow
          icon="business-outline"
          title="Painel do Estúdio"
          subtitle="Equipe e conformidade"
          onPress={() => router.push('/estudio')}
        />
        <ListRow
          icon="hourglass-outline"
          title="Verificação KYC"
          subtitle="Acompanhe o status"
          onPress={() => router.push('/kyc-pendente')}
        />
      </View>
    </ScrollView>
  );
}

export default function PerfilScreen() {
  return (
    <Screen padded={false}>
      {isAuthConfigured ? <PerfilAuthenticated /> : <PerfilGuestFallback />}
    </Screen>
  );
}
