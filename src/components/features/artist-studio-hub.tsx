import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { HubQuickAccess } from '@/components/features/hub-quick-access';
import { PortfolioUpload } from '@/components/features/portfolio-upload';

type HubView = 'quick' | 'portfolio';

export interface ArtistStudioHubProps {
  /** Disparado pelo atalho "Ganhos" -> navega para a aba `pagamentos`. */
  onOpenEarnings: () => void;
}

/**
 * Orquestrador central do Artist Studio Hub.
 *
 * Traduz o `useTransition` do web para estado local + `react-native-reanimated`
 * (`FadeIn`/`FadeOut`). As duas views ocupam `absoluteFill` dentro de um
 * contêiner `flex: 1`, então a troca Hub <-> Portfólio nunca causa layout shift.
 */
export function ArtistStudioHub({ onOpenEarnings }: ArtistStudioHubProps) {
  const [view, setView] = useState<HubView>('quick');

  const openPortfolio = useCallback(() => setView('portfolio'), []);
  const backToHub = useCallback(() => setView('quick'), []);

  return (
    <View className="flex-1">
      {view === 'quick' ? (
        <Animated.View
          key="quick"
          style={StyleSheet.absoluteFill}
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}>
          <HubQuickAccess onOpenPortfolio={openPortfolio} onOpenEarnings={onOpenEarnings} />
        </Animated.View>
      ) : (
        <Animated.View
          key="portfolio"
          style={StyleSheet.absoluteFill}
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}>
          <PortfolioUpload onBack={backToHub} />
        </Animated.View>
      )}
    </View>
  );
}
