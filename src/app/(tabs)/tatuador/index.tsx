import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AgendaPaymentsWorkspace } from '@/components/features/agenda-payments-workspace';
import { ArtistStudioHub } from '@/components/features/artist-studio-hub';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';

type StudioDashboardTab = 'hub' | 'payments';

function DashboardSegmentedControl({
  tab,
  onChange,
}: {
  tab: StudioDashboardTab;
  onChange: (next: StudioDashboardTab) => void;
}) {
  const { t } = useI18n();
  const segments: { value: StudioDashboardTab; label: string }[] = [
    { value: 'hub', label: t('studio.dashboard.tab.hub') },
    { value: 'payments', label: t('studio.dashboard.tab.payments') },
  ];

  return (
    <View className="mx-5 mt-3 flex-row rounded-xl border border-line bg-surface p-1">
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

/**
 * Dashboard do tatuador.
 *
 * - Aba "Início"     -> `ArtistStudioHub` (bento-box de acesso rápido + upload de portfólio).
 * - Aba "Pagamentos" -> agenda do estúdio (`AgendaPaymentsWorkspace`), destino do atalho
 *   "Ganhos" do hub.
 */
export default function TatuadorDashboardScreen() {
  const [tab, setTab] = useState<StudioDashboardTab>('hub');
  const { triggerHaptic } = useHapticFeedback();

  const handleTabChange = useCallback(
    (next: StudioDashboardTab) => {
      setTab((current) => {
        if (current !== next) void triggerHaptic('selection');
        return next;
      });
    },
    [triggerHaptic],
  );

  return (
    <Screen padded={false}>
      <DashboardSegmentedControl tab={tab} onChange={handleTabChange} />
      <View className="flex-1">
        {tab === 'hub' ? (
          <ArtistStudioHub onOpenEarnings={() => handleTabChange('payments')} />
        ) : (
          <AgendaPaymentsWorkspace viewerRole="tatuador" />
        )}
      </View>
    </Screen>
  );
}
