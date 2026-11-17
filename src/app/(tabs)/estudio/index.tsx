import { CalendarCheck, RefreshCw, Users, type LucideIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { StudioCnpjPanel } from '@/components/features/studio-cnpj-panel';
import { StudioIncomingRequests } from '@/components/features/studio-incoming-requests';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { useAgenda } from '@/hooks/use-agenda';
import { useI18n } from '@/hooks/use-i18n';
import { useStudioAffiliation } from '@/hooks/use-studio-affiliation';

function MetricCard({
  icon: Icon,
  label,
  value,
  loading = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <GlassContainer className="flex-1 gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-glow">
        <Icon size={18} color={colors.accent} />
      </View>
      {loading ? (
        <Skeleton style={{ height: 32, width: 56, borderRadius: 6 }} />
      ) : (
        <AppText variant="body" className="text-2xl font-bold">
          {value}
        </AppText>
      )}
      <AppText variant="muted" className="text-xs" numberOfLines={2}>
        {label}
      </AppText>
    </GlassContainer>
  );
}

/**
 * Tela "Início" do Dashboard do Estúdio conectada aos endpoints reais do BFF.
 *
 * Apresenta:
 * - Painel de compliance de CNPJ em tempo real;
 * - Métricas de agendamentos e parceiros ativos da API;
 * - Roster de solicitações de afiliação de tatuadores com tratamento de erro e recarga.
 */
export default function EstudioHomeScreen() {
  const { t } = useI18n();
  const {
    agendamentos,
    isLoading: isAgendaLoading,
    isError: isAgendaError,
    refetch: refetchAgenda,
  } = useAgenda();
  const {
    partners,
    isLoading: isAffiliationLoading,
    isError: isAffiliationError,
    refetch: refetchAffiliation,
  } = useStudioAffiliation();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchAgenda(), refetchAffiliation()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAgenda, refetchAffiliation]);

  const hasError = isAgendaError && isAffiliationError;

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        <View className="gap-1">
          <AppText variant="label">TattooGo MK</AppText>
          <AppText variant="title">{t('studio.home.title')}</AppText>
          <AppText variant="muted">{t('studio.home.subtitle')}</AppText>
        </View>

        {hasError ? (
          <View className="mt-4 gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-4">
            <AppText variant="body" className="font-semibold text-danger">
              Não foi possível sincronizar todos os dados do estúdio.
            </AppText>
            <AppText variant="muted" className="text-xs">
              Verifique a conexão de rede ou tente recarregar.
            </AppText>
            <Button
              label="Recarregar dados"
              variant="secondary"
              icon={<RefreshCw size={14} color={colors.ink} />}
              onPress={onRefresh}
              className="mt-1"
            />
          </View>
        ) : null}

        <View className="mt-5">
          <StudioCnpjPanel />
        </View>

        <View className="mt-3 flex-row gap-3">
          <MetricCard
            icon={CalendarCheck}
            label={t('studio.metrics.totalBookings')}
            value={agendamentos.length}
            loading={isAgendaLoading}
          />
          <MetricCard
            icon={Users}
            label={t('studio.metrics.activePartners')}
            value={partners.length}
            loading={isAffiliationLoading}
          />
        </View>

        <StudioIncomingRequests />
      </ScrollView>
    </Screen>
  );
}
