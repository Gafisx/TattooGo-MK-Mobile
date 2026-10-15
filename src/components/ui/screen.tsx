import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppHeaderShown } from '@/components/ui/header-context';
import { colors } from '@/constants/theme';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  /** Padding applied to the content area. */
  padded?: boolean;
}

/**
 * Standard dark canvas container with safe-area handling.
 *
 * When rendered under the global `AppHeader` (tabs) the top inset is dropped,
 * since the header already consumes it — otherwise the content would get a
 * duplicated status-bar gap.
 */
export function Screen({ children, padded = true, style, ...props }: ScreenProps) {
  const headerShown = useAppHeaderShown();
  const edges = headerShown ? (['left', 'right'] as const) : (['top', 'left', 'right'] as const);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={edges}>
      <View
        style={[{ flex: 1, backgroundColor: colors.canvas }, padded && { paddingHorizontal: 20 }, style]}
        {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
