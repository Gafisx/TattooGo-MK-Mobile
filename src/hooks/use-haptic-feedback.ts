import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

const IMPACT_STYLE: Record<'light' | 'medium' | 'heavy', Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION_STYLE: Record<
  'success' | 'warning' | 'error',
  Haptics.NotificationFeedbackType
> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * Tactile feedback wrapper. Haptics are best-effort: unsupported targets
 * (web, older devices) and permission failures are swallowed.
 */
export function useHapticFeedback() {
  const triggerHaptic = useCallback(async (style: HapticStyle = 'light') => {
    try {
      if (style === 'selection') {
        await Haptics.selectionAsync();
        return;
      }
      if (style === 'success' || style === 'warning' || style === 'error') {
        await Haptics.notificationAsync(NOTIFICATION_STYLE[style]);
        return;
      }
      await Haptics.impactAsync(IMPACT_STYLE[style]);
    } catch {
      // ignore
    }
  }, []);

  return { triggerHaptic };
}
