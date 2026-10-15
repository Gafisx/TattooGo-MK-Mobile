import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

/** zinc-950 — matches the web `bg-zinc-950` action sheet surface. */
const SHEET_BACKGROUND = '#09090b';

export interface ActionSheetAction {
  key: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress?: () => void | Promise<void>;
}

export interface ActionSheetProps {
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
  onDismiss?: () => void;
}

export interface ActionSheetRef {
  present: () => void;
  dismiss: () => void;
}

type SheetRef = ComponentRef<typeof BottomSheetModal>;

/**
 * Enterprise action sheet built on `@gorhom/bottom-sheet`.
 *
 * Dark surface (`zinc-950`) with `rounded-t-[28px]`, a small light-gray drag
 * handle and dynamically sized content. Present it through the ref:
 * `sheetRef.current?.present()`.
 */
export const ActionSheet = forwardRef<ActionSheetRef, ActionSheetProps>(function ActionSheet(
  { title, description, actions, cancelLabel = 'Cancelar', onDismiss },
  ref,
) {
  const sheetRef = useRef<SheetRef>(null);
  const insets = useSafeAreaInsets();
  const { triggerHaptic } = useHapticFeedback();

  useImperativeHandle(
    ref,
    () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  const handleAction = useCallback(
    (action: ActionSheetAction) => {
      void triggerHaptic(action.destructive ? 'warning' : 'light');
      sheetRef.current?.dismiss();
      void action.onPress?.();
    },
    [triggerHaptic],
  );

  const handleCancel = useCallback(() => {
    void triggerHaptic('light');
    sheetRef.current?.dismiss();
  }, [triggerHaptic]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onDismiss}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
          pressBehavior="close"
        />
      )}>
      <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {title || description ? (
          <View className="gap-1 px-5 pb-3 pt-1">
            {title ? <AppText variant="heading">{title}</AppText> : null}
            {description ? <AppText variant="muted">{description}</AppText> : null}
          </View>
        ) : null}

        <View className="px-3">
          {actions.map((action) => {
            const tint = action.destructive ? colors.danger : colors.accent;
            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={() => handleAction(action)}
                className="flex-row items-center gap-3 rounded-2xl px-3 py-4 active:bg-elevated">
                {action.icon ? <Ionicons name={action.icon} size={20} color={tint} /> : null}
                <View className="flex-1 gap-0.5">
                  <AppText
                    variant="body"
                    className={action.destructive ? 'font-semibold text-danger' : 'font-medium'}>
                    {action.label}
                  </AppText>
                  {action.description ? (
                    <AppText variant="muted" className="text-xs">
                      {action.description}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="px-3 pt-2">
          <Pressable
            accessibilityRole="button"
            onPress={handleCancel}
            className="items-center rounded-2xl border border-line py-4 active:bg-elevated">
            <AppText variant="body" className="font-semibold">
              {cancelLabel}
            </AppText>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: SHEET_BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.subtle,
  },
});
