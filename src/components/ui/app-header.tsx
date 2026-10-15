import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

export interface AppHeaderProps {
  /** Título centralizado da barra. Default: `TattooGo MK`. */
  title?: string;
  /** Elemento opcional à esquerda (ex.: botão de voltar). */
  left?: ReactNode;
  /** Elemento opcional à direita (ex.: ação). */
  right?: ReactNode;
}

/**
 * Header global "glass-chrome" (Dark Luxury).
 *
 * Barra translúcida com blur real no iOS e superfície frosted equivalente no
 * Android (mesmo fallback do `GlassTabBar`), altura mínima de 44px
 * (Apple-tier touch target) e título centralizado. O `inset.top` é consumido
 * aqui, pelo que as telas sob este header não devem reaplicar a safe-area do
 * topo — comportamento garantido por `useAppHeaderShown`.
 */
export function AppHeader({ title = 'TattooGo MK', left, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.host, { paddingTop: insets.top }]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
      <View style={styles.bar}>
        <View style={styles.side}>{left}</View>
        <AppText
          numberOfLines={1}
          className="flex-1 text-center text-[17px] font-semibold text-ink">
          {title}
        </AppText>
        <View style={styles.side}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    // `overflow: hidden` + absolutefill blur keeps the frosted layer inside the
    // rounded chrome instead of bleeding over the content below.
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: Platform.OS === 'android' ? 'rgba(10, 10, 10, 0.86)' : 'transparent',
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.6)',
  },
  bar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  side: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
