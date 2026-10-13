import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

interface GlassContainerProps extends ViewProps {
  children: ReactNode;
}

/**
 * Frosted surface used by the gallery states.
 *
 * TODO(migracao): o web usa `backdrop-blur` (`GlassContainer`). O RN não tem
 * backdrop-blur nativo (seria `expo-blur`); até lá usamos uma superfície
 * translúcida equivalente que preserva o visual "dark luxury".
 */
export function GlassContainer({ children, className, ...props }: GlassContainerProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-line bg-surface/80 p-4 ${className ?? ''}`}
      {...props}>
      {children}
    </View>
  );
}
