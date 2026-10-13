import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  /** Padding applied to the content area. */
  padded?: boolean;
}

/** Standard dark canvas container with safe-area handling. */
export function Screen({ children, padded = true, style, ...props }: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top', 'left', 'right']}>
      <View
        style={[{ flex: 1, backgroundColor: colors.canvas }, padded && { paddingHorizontal: 20 }, style]}
        {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
