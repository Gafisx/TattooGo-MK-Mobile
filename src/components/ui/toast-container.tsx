import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useToasts } from '@/hooks/use-toast';
import { toast, type ToastItem, type ToastVariant } from '@/lib/toast-store';

const ICON: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  error: 'alert-circle',
};

const TINT: Record<ToastVariant, string> = {
  info: colors.info,
  success: colors.success,
  error: colors.danger,
};

/** Spring contract shared with the web app (framer-motion). */
const ENTERING = SlideInUp.springify().damping(34).stiffness(420);
const EXITING = SlideOutUp.duration(180);

function ToastCard({ item }: { item: ToastItem }) {
  const tint = TINT[item.variant];

  return (
    <Animated.View entering={ENTERING} exiting={EXITING} style={styles.cardWrapper}>
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={item.title ? `${item.title}. ${item.message}` : item.message}
        onPress={() => toast.dismiss(item.id)}
        className="overflow-hidden rounded-2xl border border-line">
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.cardTint} />
        <View className="flex-row items-start gap-3 p-4">
          <Ionicons name={ICON[item.variant]} size={22} color={tint} />
          <View className="flex-1 gap-0.5">
            {item.title ? (
              <AppText variant="body" className="font-semibold">
                {item.title}
              </AppText>
            ) : null}
            <AppText variant="muted" className="leading-snug">
              {item.message}
            </AppText>
          </View>
          <Ionicons name="close" size={18} color={colors.muted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Top-center toast host. Mounted once at the root so any screen can call the
 * imperative `toast.*` API. The card descends from the top edge with a spring
 * (stiffness 420 / damping 34) to match the web design system.
 */
export function ToastContainer() {
  const toasts = useToasts();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  cardWrapper: {
    width: '92%',
    maxWidth: 440,
    marginBottom: 8,
  },
  cardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
  },
});
