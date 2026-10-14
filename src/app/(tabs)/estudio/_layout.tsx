import { Slot, router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import type { MessageKey } from '@/lib/i18n/types';

type StudioTabKey = 'home' | 'agenda' | 'profile';

interface StudioTab {
  key: StudioTabKey;
  href: '/estudio' | '/estudio/agendar' | '/estudio/perfil';
  labelKey: MessageKey;
}

const TABS: StudioTab[] = [
  { key: 'home', href: '/estudio', labelKey: 'studio.dashboard.tab.home' },
  { key: 'agenda', href: '/estudio/agendar', labelKey: 'studio.dashboard.tab.agenda' },
  { key: 'profile', href: '/estudio/perfil', labelKey: 'studio.dashboard.tab.profile' },
];

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
  const { triggerHaptic } = useHapticFeedback();
  const pathname = usePathname();

  return (
    <View className="flex-1 bg-canvas">
      <View className="mx-5 mt-2 flex-row rounded-xl border border-line bg-surface p-1">
        {TABS.map((tab) => {
          const active =
            tab.href === '/estudio' ? pathname === '/estudio' : pathname.startsWith(tab.href);
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) return;
                void triggerHaptic('selection');
                router.replace(tab.href);
              }}
              className={`flex-1 rounded-lg py-2 ${active ? 'bg-accent' : 'active:bg-elevated'}`}>
              <AppText
                variant="body"
                className={`text-center text-sm font-semibold ${
                  active ? 'text-canvas' : 'text-muted'
                }`}>
                {t(tab.labelKey)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
