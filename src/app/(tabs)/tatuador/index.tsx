import { useState } from 'react';
import { View } from 'react-native';

import { AgendaPaymentsWorkspace } from '@/components/features/agenda-payments-workspace';
import { ArtistStudioHub } from '@/components/features/artist-studio-hub';
import { Screen } from '@/components/ui/screen';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui/segmented-control';
import { useI18n } from '@/hooks/use-i18n';

type StudioDashboardTab = 'hub' | 'payments';

/**
 * Dashboard do tatuador.
 *
 * - Aba "Início"     -> `ArtistStudioHub` (bento-box de acesso rápido + upload de portfólio).
 * - Aba "Pagamentos" -> agenda do estúdio (`AgendaPaymentsWorkspace`), destino do atalho
 *   "Ganhos" do hub.
 */
export default function TatuadorDashboardScreen() {
  const [tab, setTab] = useState<StudioDashboardTab>('hub');
  const { t } = useI18n();

  const segments: SegmentedControlOption<StudioDashboardTab>[] = [
    { value: 'hub', label: t('studio.dashboard.tab.hub') },
    { value: 'payments', label: t('studio.dashboard.tab.payments') },
  ];

  const handleTabChange = (next: StudioDashboardTab) => {
    setTab(next);
  };

  return (
    <Screen padded={false}>
      <SegmentedControl
        options={segments}
        value={tab}
        onChange={handleTabChange}
        className="mx-5 mt-3"
      />
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
