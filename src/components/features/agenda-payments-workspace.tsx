import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { PaymentsPanel } from '@/components/features/client-payments-panel';
import {
  ClientTimelineTracker,
  TrackerEmptyState,
} from '@/components/features/client-timeline-tracker';
import { StudioAgendaView } from '@/components/features/studio-agenda-view';
import { StudioPaymentsPanel } from '@/components/features/studio-payments-panel';
import { AppText } from '@/components/ui/app-text';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgenda } from '@/hooks/use-agenda';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { useSession } from '@/hooks/use-session';
import { isStudioRole } from '@/lib/kyc';
import type { AppRole } from '@/lib/utils/dashboard-gate';

export type AgendaTab = 'schedule' | 'payments';

function SegmentedControl({
  tab,
  onChange,
}: {
  tab: AgendaTab;
  onChange: (next: AgendaTab) => void;
}) {
  const { t } = useI18n();
  const segments: { value: AgendaTab; label: string }[] = [
    { value: 'schedule', label: t('agenda.tab.schedule') },
    { value: 'payments', label: t('agenda.tab.payments') },
  ];

  return (
    <View className="mt-4 flex-row rounded-xl border border-line bg-surface p-1">
      {segments.map((segment) => {
        const selected = tab === segment.value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 rounded-lg py-2 ${selected ? 'bg-accent' : 'active:bg-elevated'}`}>
            <AppText
              variant="body"
              className={`text-center text-sm font-semibold ${
                selected ? 'text-canvas' : 'text-muted'
              }`}>
              {segment.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function AgendaSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} style={{ height: 168 }} />
      ))}
    </View>
  );
}

function AgendaError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <GlassContainer className="items-center gap-2">
      <AppText variant="heading" className="text-center text-danger">
        {t('agenda.loadError')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('agenda.loadErrorHint')}
      </AppText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        className="mt-2 rounded-full border border-line bg-elevated px-4 py-2 active:bg-surface">
        <AppText variant="body" className="text-sm text-accent">
          {t('agenda.empty.cta')}
        </AppText>
      </Pressable>
    </GlassContainer>
  );
}

export interface AgendaPaymentsWorkspaceProps {
  onStartBooking?: () => void;
  /**
   * Papel do espectador. Quando tatuador/estúdio, o workspace renderiza a
   * `StudioAgendaView` (agenda do estúdio) no lugar da timeline do cliente.
   * Default: role reconciliada em `useSession`.
   */
  viewerRole?: AppRole;
}

/**
 * Workspace de Agenda + Pagamentos do cliente (port de
 * `AgendaPaymentsWorkspace`). Gerencia o seletor segmentado
 * (Agendamentos | Pagamentos) e delega cada item ao rastreador de timeline.
 *
 * Para perfis de tatuador/estúdio, o seletor alterna entre a `StudioAgendaView`
 * (aba Agendamentos) e o `StudioPaymentsPanel` (aba Pagamentos).
 */
export function AgendaPaymentsWorkspace({
  onStartBooking,
  viewerRole,
}: AgendaPaymentsWorkspaceProps) {
  const [tab, setTab] = useState<AgendaTab>('schedule');
  const { triggerHaptic } = useHapticFeedback();
  const { t } = useI18n();
  const session = useSession();
  const { agendamentos, isLoading, isError, refetch } = useAgenda();

  const role = viewerRole ?? session.role;

  const handleTabChange = useCallback(
    (next: AgendaTab) => {
      setTab((current) => {
        if (current !== next) void triggerHaptic('selection');
        return next;
      });
    },
    [triggerHaptic],
  );

  if (isStudioRole(role)) {
    return (
      <View className="flex-1">
        <View className="px-5 pt-3">
          <SegmentedControl tab={tab} onChange={handleTabChange} />
        </View>
        <View className="flex-1">
          {tab === 'payments' ? (
            <StudioPaymentsPanel role={role} />
          ) : (
            <StudioAgendaView
              agendamentos={agendamentos}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
            />
          )}
        </View>
      </View>
    );
  }

  const header = (
    <View className="pb-4 pt-2">
      <AppText variant="title">{t('agenda.title')}</AppText>
      <AppText variant="muted">{t('agenda.subtitle')}</AppText>
      <SegmentedControl tab={tab} onChange={handleTabChange} />
    </View>
  );

  if (tab === 'schedule') {
    return (
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClientTimelineTracker agendamento={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <AgendaSkeleton />
          ) : isError ? (
            <AgendaError onRetry={refetch} />
          ) : (
            <TrackerEmptyState variant="schedule" onAction={onStartBooking} />
          )
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews
      />
    );
  }

  return <PaymentsPanel header={header} />;
}
