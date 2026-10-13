import { Wallet } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import {
  ClientTimelineTracker,
  TrackerEmptyState,
} from '@/components/features/client-timeline-tracker';
import { AppText } from '@/components/ui/app-text';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { useAgenda } from '@/hooks/use-agenda';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { formatAgendaDate } from '@/lib/agenda-format';
import { formatBRL } from '@/lib/finance';
import type { AgendaPayment, Agendamento, PaymentStatus } from '@/lib/types/agenda';

export type AgendaTab = 'schedule' | 'payments';

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, { chip: string; text: string }> = {
  pendente: { chip: 'border-warning/40 bg-warning/10', text: 'text-warning' },
  pago: { chip: 'border-success/40 bg-success/10', text: 'text-success' },
  reembolsado: { chip: 'border-line bg-elevated', text: 'text-muted' },
};

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

function PaymentRow({
  payment,
  agendamento,
}: {
  payment: AgendaPayment;
  agendamento?: Agendamento;
}) {
  const { t, locale } = useI18n();
  const style = PAYMENT_STATUS_STYLE[payment.status];
  const kindLabel =
    payment.kind === 'deposit' ? t('agenda.payment.deposit') : t('agenda.payment.balance');
  const dateIso = payment.paidAt ?? payment.createdAt;

  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-elevated">
        <Wallet size={18} color={colors.accent} />
      </View>
      <View className="flex-1">
        <AppText variant="body" className="text-sm font-semibold" numberOfLines={1}>
          {agendamento ? `${kindLabel} · ${agendamento.artista.name}` : kindLabel}
        </AppText>
        <AppText variant="muted" className="text-xs">
          {formatAgendaDate(dateIso, locale)}
        </AppText>
      </View>
      <View className="items-end gap-1">
        <AppText variant="body" className="text-sm font-semibold">
          {formatBRL(payment.amountCents)}
        </AppText>
        <View className={`rounded-full border px-2 py-0.5 ${style.chip}`}>
          <AppText variant="muted" className={`text-[10px] font-semibold ${style.text}`}>
            {t(`agenda.payment.status.${payment.status}`)}
          </AppText>
        </View>
      </View>
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
}

/**
 * Workspace de Agenda + Pagamentos do cliente (port de
 * `AgendaPaymentsWorkspace`). Gerencia o seletor segmentado
 * (Agendamentos | Pagamentos) e delega cada item ao rastreador de timeline.
 */
export function AgendaPaymentsWorkspace({ onStartBooking }: AgendaPaymentsWorkspaceProps) {
  const [tab, setTab] = useState<AgendaTab>('schedule');
  const { triggerHaptic } = useHapticFeedback();
  const { t } = useI18n();
  const { agendamentos, payments, isLoading, isError, refetch } = useAgenda();

  const agendamentosById = useMemo(() => {
    const map = new Map<string, Agendamento>();
    for (const agendamento of agendamentos) map.set(agendamento.id, agendamento);
    return map;
  }, [agendamentos]);

  const handleTabChange = useCallback(
    (next: AgendaTab) => {
      setTab((current) => {
        if (current !== next) void triggerHaptic('selection');
        return next;
      });
    },
    [triggerHaptic],
  );

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

  return (
    <FlatList
      data={payments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PaymentRow payment={item} agendamento={agendamentosById.get(item.agendamentoId)} />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? (
          <AgendaSkeleton />
        ) : isError ? (
          <AgendaError onRetry={refetch} />
        ) : (
          <TrackerEmptyState variant="payments" />
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
