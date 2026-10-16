import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

/** Spring contract for the "scale 0.9 -> 1" reveal (matches the web framer-motion). */
const CARD_SPRING = { damping: 20, stiffness: 220, mass: 0.7 } as const;

export interface TermsModalProps {
  /** Controls the modal. The native fade plays on open and close. */
  visible: boolean;
  /** Called when the user dismisses (backdrop, close button or Android back). */
  onClose: () => void;
  /** Document title shown in the sticky header. */
  title?: string;
  /** Optional muted line under the title (e.g. "Última atualização: ..."). */
  subtitle?: string;
  /** Scrollable document body. */
  children: ReactNode;
  /** Optional sticky footer (e.g. an "Li e aceito" action). */
  footer?: ReactNode;
  /** Accessible label for the dismiss control. Default: `Fechar`. */
  closeAccessibilityLabel?: string;
  testID?: string;
}

/**
 * Native port of the web `TermsModal` (document reader).
 *
 * Visual contract: centered card `max-w-2xl` (672px) with `rounded-3xl`
 * (28px) on `zinc-900`, `border-zinc-800` and `max-h-[80dvh]`, floating over a
 * `bg-black/90` + `backdrop-blur-md` scrim. The card springs from `scale 0.9`
 * to `1` while the native modal fade runs (the "fade-in" of the contract).
 */
export function TermsModal({
  visible,
  onClose,
  title = 'Termos e Condições',
  subtitle,
  children,
  footer,
  closeAccessibilityLabel = 'Fechar',
  testID,
}: TermsModalProps) {
  const { triggerHaptic } = useHapticFeedback();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      progress.value = withSpring(1, CARD_SPRING);
    } else {
      // Reset while hidden so the next open always springs from scale 0.9.
      progress.value = 0;
    }
  }, [visible, progress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.9, 1]) }],
  }));

  const handleClose = () => {
    void triggerHaptic('light');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View className="flex-1 items-center justify-center px-5">
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.scrimTint} />
        </View>

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={closeAccessibilityLabel}
        />

        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          style={[styles.card, cardStyle]}
          className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
          <View className="flex-row items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5">
            <View className="flex-1 gap-1">
              <AppText variant="heading">{title}</AppText>
              {subtitle ? (
                <AppText variant="muted" className="text-xs">
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={closeAccessibilityLabel}
              className="rounded-full p-1 active:bg-elevated">
              <Ionicons name="close" size={22} color={colors.subtle} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {footer ? (
            <View className="border-t border-zinc-800 px-6 py-4">{footer}</View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Convenience section renderer for long legal documents. */
export interface TermsSectionProps {
  heading: string;
  children: ReactNode;
}

export function TermsSection({ heading, children }: TermsSectionProps) {
  return (
    <View className="gap-1.5">
      <AppText variant="body" className="font-semibold">
        {heading}
      </AppText>
      <AppText variant="muted" className="leading-relaxed">
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrimTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  card: {
    width: '100%',
    maxWidth: 672,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
});
