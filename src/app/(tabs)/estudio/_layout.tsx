import { Slot, router, usePathname } from 'expo-router';
import { View } from 'react-native';

import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui/segmented-control';
import { useI18n } from '@/hooks/use-i18n';
import type { MessageKey } from '@/lib/i18n/types';

type StudioTabKey = 'home' | 'agenda' | 'profile';
type StudioTabHref = '/estudio' | '/estudio/agendar' | '/estudio/perfil';

interface StudioTab {
  key: StudioTabKey;
  href: StudioTabHref;
  labelKey: MessageKey;
}

const TABS: StudioTab[] = [
  { key: 'home', href: '/estudio', labelKey: 'studio.dashboard.tab.home' },
  { key: 'agenda', href: '/estudio/agendar', labelKey: 'studio.dashboard.tab.agenda' },
  { key: 'profile', href: '/estudio/perfil', labelKey: 'studio.dashboard.tab.profile' },
];

function resolveActiveHref(pathname: string): StudioTabHref {
  const match = TABS.find((tab) =>
    tab.href === '/estudio' ? pathname === '/estudio' : pathname.startsWith(tab.href),
  );
  return match?.href ?? '/estudio';
}

/**
 * Layout do Dashboard do Estúdio (role `estudio`).
 *
 * Diferente do tatuador, o estúdio NÃO passa pelo `TatuadorKycBlock`: as abas
 * carregam diretamente. O roteador de abas é um cabeçalho segmentado
 * (Início | Agenda | Perfil) que navega entre as rotas via `router.replace`,
 * mantendo uma única barra (sem `Tabs` aninhada) — paridade com o
 * `SegmentedControl` nativo usado no resto do app.
 */
export default function EstudioLayout() {
  const { t } = useI18n();
  const pathname = usePathname();

  const segments: SegmentedControlOption<StudioTabHref>[] = TABS.map((tab) => ({
    value: tab.href,
    label: t(tab.labelKey),
  }));

  return (
    <View className="flex-1 bg-canvas">
      <SegmentedControl
        options={segments}
        value={resolveActiveHref(pathname)}
        onChange={(href) => router.replace(href)}
        className="mx-5 mt-2"
      />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
