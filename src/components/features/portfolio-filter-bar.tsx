import { ChevronDown, RotateCcw, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import {
  PORTFOLIO_BODY_PARTS,
  PORTFOLIO_STYLES,
  portfolioLabelResolver,
} from '@/lib/portfolio-metadata';
import type { GaleriaHealingFilter } from '@/lib/types/galeria';

export type PortfolioHealingFilter = GaleriaHealingFilter;

type FilterCategory = 'style' | 'body' | 'healing';

const HEALING_OPTIONS: { value: Exclude<GaleriaHealingFilter, 'all'>; labelKey: string }[] = [
  { value: 'fresh', labelKey: 'gallery.fresh' },
  { value: 'healed', labelKey: 'gallery.healed' },
];

export interface PortfolioFilterBarProps {
  style: string;
  bodyPart: string;
  healed: PortfolioHealingFilter;
  onStyleChange: (value: string) => void;
  onBodyPartChange: (value: string) => void;
  onHealingChange: (value: PortfolioHealingFilter) => void;
}

function FilterTrigger({
  label,
  value,
  active,
  expanded,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${label}: ${value}`}
      className={`mr-2 flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
        active ? 'border-accent bg-accent-glow' : 'border-line bg-card active:bg-elevated'
      }`}>
      <AppText variant="muted" className="text-[10px] uppercase tracking-widest">
        {label}
      </AppText>
      <AppText variant="body" className={`text-sm font-semibold ${active ? 'text-accent' : 'text-ink'}`}>
        {value}
      </AppText>
      <ChevronDown
        size={14}
        color={active ? colors.accent : colors.muted}
        style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
      />
    </Pressable>
  );
}

function FilterOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`mb-2 mr-2 rounded-full border px-3.5 py-2 ${
        selected ? 'border-accent bg-accent-glow' : 'border-line bg-surface active:bg-elevated'
      }`}>
      <AppText variant="body" className={`text-sm ${selected ? 'text-accent' : 'text-ink'}`}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Filtros da Galeria: Estilo, Parte do corpo e Cicatrização.
 * 3 triggers + painel de opções + "limpar filtros" quando há filtro ativo.
 */
export function PortfolioFilterBar({
  style,
  bodyPart,
  healed,
  onStyleChange,
  onBodyPartChange,
  onHealingChange,
}: PortfolioFilterBarProps) {
  const { triggerHaptic } = useHapticFeedback();
  const { t } = useI18n();
  const { styleLabel, bodyPartLabel } = portfolioLabelResolver(t);
  const [openCategory, setOpenCategory] = useState<FilterCategory | null>(null);

  const hasFilters = Boolean(style || bodyPart || healed !== 'all');

  const toggleCategory = useCallback(
    (category: FilterCategory) => {
      void triggerHaptic('selection');
      setOpenCategory((current) => (current === category ? null : category));
    },
    [triggerHaptic],
  );

  const applyStyle = useCallback(
    (value: string) => {
      onStyleChange(value);
      void triggerHaptic('light');
      setOpenCategory(null);
    },
    [onStyleChange, triggerHaptic],
  );

  const applyBodyPart = useCallback(
    (value: string) => {
      onBodyPartChange(value);
      void triggerHaptic('light');
      setOpenCategory(null);
    },
    [onBodyPartChange, triggerHaptic],
  );

  const applyHealing = useCallback(
    (value: GaleriaHealingFilter) => {
      onHealingChange(value);
      void triggerHaptic('light');
      setOpenCategory(null);
    },
    [onHealingChange, triggerHaptic],
  );

  const clearFilters = useCallback(() => {
    void triggerHaptic('medium');
    onStyleChange('');
    onBodyPartChange('');
    onHealingChange('all');
    setOpenCategory(null);
  }, [onStyleChange, onBodyPartChange, onHealingChange, triggerHaptic]);

  const healingValue = useMemo(() => {
    if (healed === 'fresh') return t('gallery.fresh');
    if (healed === 'healed') return t('gallery.healed');
    return t('gallery.all');
  }, [healed, t]);

  const panelTitle = useMemo(() => {
    if (openCategory === 'style') return t('gallery.style');
    if (openCategory === 'body') return t('gallery.bodyPart');
    if (openCategory === 'healing') return t('gallery.healing');
    return '';
  }, [openCategory, t]);

  return (
    <View className="px-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}>
        <View className="flex-row">
          <FilterTrigger
            label={t('gallery.style')}
            value={style ? styleLabel(style) : t('gallery.all')}
            active={Boolean(style)}
            expanded={openCategory === 'style'}
            onPress={() => toggleCategory('style')}
          />
          <FilterTrigger
            label={t('gallery.bodyPart')}
            value={bodyPart ? bodyPartLabel(bodyPart) : t('gallery.all')}
            active={Boolean(bodyPart)}
            expanded={openCategory === 'body'}
            onPress={() => toggleCategory('body')}
          />
          <FilterTrigger
            label={t('gallery.healing')}
            value={healingValue}
            active={healed !== 'all'}
            expanded={openCategory === 'healing'}
            onPress={() => toggleCategory('healing')}
          />
        </View>
      </ScrollView>

      {openCategory ? (
        <View className="mt-3 rounded-2xl border border-line bg-card p-3">
          <View className="mb-2 flex-row items-center justify-between">
            <AppText variant="label">{panelTitle}</AppText>
            <Pressable
              onPress={() => {
                void triggerHaptic('selection');
                setOpenCategory(null);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('gallery.closeFilter')}>
              <X size={16} color={colors.muted} />
            </Pressable>
          </View>

          <View className="flex-row flex-wrap">
            {openCategory === 'style' ? (
              <>
                <FilterOption
                  label={t('gallery.allStyles')}
                  selected={!style}
                  onPress={() => applyStyle('')}
                />
                {PORTFOLIO_STYLES.map((value) => (
                  <FilterOption
                    key={value}
                    label={styleLabel(value)}
                    selected={style === value}
                    onPress={() => applyStyle(value)}
                  />
                ))}
              </>
            ) : null}

            {openCategory === 'body' ? (
              <>
                <FilterOption
                  label={t('gallery.allParts')}
                  selected={!bodyPart}
                  onPress={() => applyBodyPart('')}
                />
                {PORTFOLIO_BODY_PARTS.map((value) => (
                  <FilterOption
                    key={value}
                    label={bodyPartLabel(value)}
                    selected={bodyPart === value}
                    onPress={() => applyBodyPart(value)}
                  />
                ))}
              </>
            ) : null}

            {openCategory === 'healing' ? (
              <>
                <FilterOption
                  label={t('gallery.allHealing')}
                  selected={healed === 'all'}
                  onPress={() => applyHealing('all')}
                />
                {HEALING_OPTIONS.map((option) => (
                  <FilterOption
                    key={option.value}
                    label={t(option.labelKey)}
                    selected={healed === option.value}
                    onPress={() => applyHealing(option.value)}
                  />
                ))}
              </>
            ) : null}
          </View>
        </View>
      ) : null}

      {hasFilters ? (
        <Pressable
          onPress={clearFilters}
          accessibilityRole="button"
          accessibilityLabel={t('gallery.clearFilters')}
          className="mt-3 flex-row items-center gap-1.5 self-start rounded-full border border-line bg-card px-3.5 py-2 active:bg-elevated">
          <RotateCcw size={14} color={colors.accent} />
          <AppText variant="body" className="text-sm text-accent">
            {t('gallery.clearFilters')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
