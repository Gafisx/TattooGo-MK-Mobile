import { Image } from 'expo-image';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Skeleton } from '@/components/ui/skeleton';
import { TattooMachineLoader } from '@/components/ui/tattoo-machine-loader';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import {
  useArchivePortfolioWork,
  useMyPortfolio,
  usePublishPortfolioWork,
  useUpdatePortfolioWork,
} from '@/hooks/use-portfolio';
import { pickPortfolioImage } from '@/lib/media';
import {
  PORTFOLIO_BODY_PARTS,
  PORTFOLIO_SESSION_DURATIONS,
  PORTFOLIO_STYLES,
  portfolioLabelResolver,
  type PortfolioBodyPart,
  type PortfolioSessionDuration,
  type PortfolioStyle,
} from '@/lib/portfolio-metadata';
import type { PortfolioDraft, PortfolioWork } from '@/lib/types/portfolio';

interface Notice {
  tone: 'success' | 'error';
  text: string;
}

/** Campos de curadoria compartilhados entre criação e edição. */
interface PortfolioMetadataDraft {
  style: PortfolioStyle | null;
  bodyPart: PortfolioBodyPart | null;
  sessionDuration: PortfolioSessionDuration | null;
  isHealed: boolean;
  notes: string;
}

export interface PortfolioUploadProps {
  onBack: () => void;
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-line bg-surface px-2.5 py-1">
      <AppText variant="muted" className="text-[11px] text-ink">
        {label}
      </AppText>
    </View>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  layout = 'wrap',
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  layout?: 'wrap' | 'row';
}) {
  const { triggerHaptic } = useHapticFeedback();

  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => {
          void triggerHaptic('selection');
          onChange(option.value);
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`rounded-full border px-3.5 py-2 ${
          selected ? 'border-accent bg-accent-glow' : 'border-line bg-surface active:bg-elevated'
        }`}>
        <AppText variant="body" className={`text-sm ${selected ? 'text-accent' : 'text-ink'}`}>
          {option.label}
        </AppText>
      </Pressable>
    );
  });

  return (
    <View className="gap-2">
      <AppText variant="label">{label}</AppText>
      {layout === 'row' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">{chips}</View>
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{chips}</View>
      )}
    </View>
  );
}

/**
 * Formulário canônico do portfólio: tags (`PortfolioStyle`/`PortfolioBodyPart`/
 * `PortfolioSessionDuration`), estado de cicatrização e notas. Reutilizado pelos
 * modais de criação (`POST`) e de curadoria (`PATCH`) para garantir paridade.
 */
function MetadataFields({
  value,
  onChange,
}: {
  value: PortfolioMetadataDraft;
  onChange: (patch: Partial<PortfolioMetadataDraft>) => void;
}) {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();
  const { styleLabel, bodyPartLabel, sessionDurationLabel, healingLabel } =
    portfolioLabelResolver(t);

  const styleOptions = PORTFOLIO_STYLES.map((style) => ({ value: style, label: styleLabel(style) }));
  const bodyPartOptions = PORTFOLIO_BODY_PARTS.map((part) => ({
    value: part,
    label: bodyPartLabel(part),
  }));
  const durationOptions = PORTFOLIO_SESSION_DURATIONS.map((duration) => ({
    value: duration,
    label: sessionDurationLabel(duration),
  }));

  return (
    <View className="gap-5">
      <ChipGroup
        label={t('portfolio.upload.style')}
        options={styleOptions}
        value={value.style}
        onChange={(style) => onChange({ style })}
        layout="row"
      />
      <ChipGroup
        label={t('portfolio.upload.bodyPart')}
        options={bodyPartOptions}
        value={value.bodyPart}
        onChange={(bodyPart) => onChange({ bodyPart })}
      />
      <ChipGroup
        label={t('portfolio.upload.sessionDuration')}
        options={durationOptions}
        value={value.sessionDuration}
        onChange={(sessionDuration) => onChange({ sessionDuration })}
        layout="row"
      />

      <View className="gap-2">
        <AppText variant="label">{t('portfolio.upload.healing')}</AppText>
        <View className="flex-row gap-2">
          {[false, true].map((isHealed) => {
            const selected = value.isHealed === isHealed;
            return (
              <Pressable
                key={String(isHealed)}
                onPress={() => {
                  void triggerHaptic('selection');
                  onChange({ isHealed });
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`rounded-full border px-3.5 py-2 ${
                  selected
                    ? 'border-accent bg-accent-glow'
                    : 'border-line bg-surface active:bg-elevated'
                }`}>
                <AppText
                  variant="body"
                  className={`text-sm ${selected ? 'text-accent' : 'text-ink'}`}>
                  {healingLabel(isHealed)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <AppText variant="label">{t('portfolio.upload.notes')}</AppText>
        <TextInput
          value={value.notes}
          onChangeText={(notes) => onChange({ notes })}
          placeholder={t('portfolio.upload.notesPlaceholder')}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={280}
          className="min-h-[76px] rounded-xl border border-line bg-card px-3 py-2.5 text-base text-ink"
          style={{ textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}

function WorkCard({
  work,
  onEdit,
  onArchive,
}: {
  work: PortfolioWork;
  onEdit: (work: PortfolioWork) => void;
  onArchive: (work: PortfolioWork) => void;
}) {
  const { t } = useI18n();
  const { styleLabel, bodyPartLabel, sessionDurationLabel, healingLabel } =
    portfolioLabelResolver(t);

  return (
    <View className="mb-3 flex-1 overflow-hidden rounded-2xl border border-line bg-card">
      <Image
        source={{ uri: work.imageUrl }}
        style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.elevated }}
        contentFit="cover"
        transition={200}
      />
      <View className="flex-1 gap-1.5 p-3">
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={styleLabel(work.style)} />
          <Chip label={healingLabel(work.isHealed)} />
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={bodyPartLabel(work.bodyPart)} />
          <Chip label={sessionDurationLabel(work.sessionDuration)} />
        </View>
        {work.notes ? (
          <AppText variant="muted" className="mt-1 text-xs" numberOfLines={2}>
            {work.notes}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row items-center justify-end gap-1 border-t border-line px-2 py-1.5">
        <Pressable
          onPress={() => onEdit(work)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('portfolio.upload.edit')}
          className="h-9 w-9 items-center justify-center rounded-lg active:bg-elevated">
          <Pencil size={16} color={colors.accent} />
        </Pressable>
        <Pressable
          onPress={() => onArchive(work)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('portfolio.upload.archive')}
          className="h-9 w-9 items-center justify-center rounded-lg active:bg-elevated">
          <Trash2 size={16} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

function UploadSkeleton() {
  return (
    <View className="flex-row gap-3 px-5 pt-4">
      <View className="flex-1 gap-3">
        <Skeleton style={{ aspectRatio: 3 / 4 }} />
        <Skeleton style={{ height: 132 }} />
      </View>
      <View className="flex-1 gap-3">
        <Skeleton style={{ height: 132 }} />
        <Skeleton style={{ aspectRatio: 3 / 4 }} />
      </View>
    </View>
  );
}

function NoticeBanner({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const tone =
    notice.tone === 'success'
      ? { chip: 'border-success/40 bg-success/10', text: 'text-success', icon: colors.success }
      : { chip: 'border-danger/40 bg-danger/10', text: 'text-danger', icon: colors.danger };

  return (
    <View className={`mx-5 mt-3 flex-row items-center gap-2 rounded-2xl border p-3 ${tone.chip}`}>
      {notice.tone === 'success' ? (
        <CheckCircle2 size={16} color={tone.icon} />
      ) : (
        <AlertCircle size={16} color={tone.icon} />
      )}
      <AppText variant="body" className={`flex-1 text-sm ${tone.text}`}>
        {notice.text}
      </AppText>
      <Pressable onPress={onDismiss} hitSlop={8} accessibilityRole="button">
        <X size={15} color={colors.muted} />
      </Pressable>
    </View>
  );
}

/**
 * Gestor de imagens do portfólio nativo (port do `PortfolioUpload` web).
 *
 * Substitui `<input type="file" />` por `expo-image-picker`, faz o fetch de
 * `GET /api/tatuador/portfolio`, monta as tags canônicas em chips, publica via
 * presigned URL (`/api/upload/presign` -> S3 -> `POST /api/tatuador/portfolio`)
 * e adiciona os fluxos de curadoria (`PATCH .../:id`) e arquivamento
 * (`DELETE .../:id`) com modal nativo de confirmação.
 */
export function PortfolioUpload({ onBack }: PortfolioUploadProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { triggerHaptic } = useHapticFeedback();

  const { data, isLoading, isError, refetch } = useMyPortfolio();
  const { mutate: publish, isPending: isPublishing } = usePublishPortfolioWork();
  const { mutate: update, isPending: isSaving } = useUpdatePortfolioWork();
  const { mutate: archive, isPending: isArchiving } = useArchivePortfolioWork();
  const works = data ?? [];

  const [draft, setDraft] = useState<PortfolioDraft | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PortfolioWork | null>(null);
  const [editValue, setEditValue] = useState<PortfolioMetadataDraft | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<PortfolioWork | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const updateDraft = useCallback((patch: Partial<PortfolioDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const updateEditValue = useCallback((patch: Partial<PortfolioMetadataDraft>) => {
    setEditValue((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const startNewDraft = useCallback(async () => {
    void triggerHaptic('light');
    const result = await pickPortfolioImage();
    if (result.status === 'denied') {
      void triggerHaptic('error');
      setNotice({ tone: 'error', text: t('portfolio.upload.permissionDenied') });
      return;
    }
    if (result.status !== 'success') return;

    const image = result.image;
    setDraft({
      uri: image.uri,
      fileName: image.fileName,
      contentType: image.contentType,
      fileSize: image.fileSize,
      width: image.width,
      height: image.height,
      style: null,
      bodyPart: null,
      sessionDuration: null,
      isHealed: false,
      notes: '',
    });
    setNotice(null);
    setIsComposerOpen(true);
  }, [t, triggerHaptic]);

  const replaceDraftImage = useCallback(async () => {
    void triggerHaptic('light');
    const result = await pickPortfolioImage();
    if (result.status === 'denied') {
      void triggerHaptic('error');
      setNotice({ tone: 'error', text: t('portfolio.upload.permissionDenied') });
      return;
    }
    if (result.status !== 'success') return;

    const image = result.image;
    updateDraft({
      uri: image.uri,
      fileName: image.fileName,
      contentType: image.contentType,
      fileSize: image.fileSize,
      width: image.width,
      height: image.height,
    });
  }, [t, triggerHaptic, updateDraft]);

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false);
    setDraft(null);
  }, []);

  const handlePublish = useCallback(() => {
    if (!draft) return;
    if (!draft.style || !draft.bodyPart || !draft.sessionDuration) {
      void triggerHaptic('warning');
      setNotice({ tone: 'error', text: t('portfolio.upload.missingFields') });
      return;
    }

    publish(draft, {
      onSuccess: () => {
        void triggerHaptic('success');
        setDraft(null);
        setIsComposerOpen(false);
        setNotice({ tone: 'success', text: t('portfolio.upload.success') });
      },
      onError: () => {
        void triggerHaptic('error');
        setNotice({ tone: 'error', text: t('portfolio.upload.saveError') });
      },
    });
  }, [draft, publish, t, triggerHaptic]);

  const openEdit = useCallback(
    (work: PortfolioWork) => {
      void triggerHaptic('light');
      setNotice(null);
      setEditTarget(work);
      setEditValue({
        style: work.style,
        bodyPart: work.bodyPart,
        sessionDuration: work.sessionDuration,
        isHealed: work.isHealed,
        notes: work.notes ?? '',
      });
    },
    [triggerHaptic],
  );

  const closeEdit = useCallback(() => {
    setEditTarget(null);
    setEditValue(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editTarget || !editValue) return;
    if (!editValue.style || !editValue.bodyPart || !editValue.sessionDuration) {
      void triggerHaptic('warning');
      setNotice({ tone: 'error', text: t('portfolio.upload.missingFields') });
      return;
    }

    update(
      {
        id: editTarget.id,
        input: {
          imageUrl: editTarget.imageUrl,
          style: editValue.style,
          bodyPart: editValue.bodyPart,
          sessionDuration: editValue.sessionDuration,
          isHealed: editValue.isHealed,
          notes: editValue.notes,
        },
      },
      {
        onSuccess: () => {
          void triggerHaptic('success');
          closeEdit();
          setNotice({ tone: 'success', text: t('portfolio.upload.updateSuccess') });
        },
        onError: () => {
          void triggerHaptic('error');
          setNotice({ tone: 'error', text: t('portfolio.upload.updateError') });
        },
      },
    );
  }, [editTarget, editValue, update, closeEdit, t, triggerHaptic]);

  const openArchive = useCallback(
    (work: PortfolioWork) => {
      void triggerHaptic('warning');
      setNotice(null);
      setArchiveTarget(work);
    },
    [triggerHaptic],
  );

  const closeArchive = useCallback(() => {
    setArchiveTarget(null);
  }, []);

  const confirmArchive = useCallback(() => {
    if (!archiveTarget) return;
    archive(archiveTarget.id, {
      onSuccess: () => {
        void triggerHaptic('success');
        setArchiveTarget(null);
        setNotice({ tone: 'success', text: t('portfolio.upload.archiveSuccess') });
      },
      onError: () => {
        void triggerHaptic('error');
        setNotice({ tone: 'error', text: t('portfolio.upload.archiveError') });
      },
    });
  }, [archiveTarget, archive, t, triggerHaptic]);

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-3 px-5 pt-2">
        <Pressable
          onPress={() => {
            void triggerHaptic('light');
            onBack();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('portfolio.upload.back')}
          className="h-9 w-9 items-center justify-center rounded-full border border-line bg-card active:bg-elevated">
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <View className="flex-1">
          <AppText variant="heading">{t('portfolio.upload.title')}</AppText>
          <AppText variant="muted">{t('portfolio.upload.subtitle')}</AppText>
        </View>
        <Pressable
          onPress={startNewDraft}
          accessibilityRole="button"
          accessibilityLabel={t('portfolio.upload.add')}
          className="flex-row items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 active:bg-accent-strong">
          <Plus size={16} color={colors.canvas} />
          <AppText variant="body" className="text-sm font-semibold text-canvas">
            {t('portfolio.upload.add')}
          </AppText>
        </Pressable>
      </View>

      {notice ? <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} /> : null}

      {isLoading ? (
        <UploadSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <AppText variant="heading" className="text-center text-danger">
            {t('portfolio.upload.loadError')}
          </AppText>
          <AppText variant="muted" className="text-center">
            {t('portfolio.upload.loadErrorHint')}
          </AppText>
          <Pressable
            onPress={() => void refetch()}
            accessibilityRole="button"
            className="mt-1 rounded-full border border-line bg-elevated px-4 py-2 active:bg-surface">
            <AppText variant="body" className="text-sm text-accent">
              {t('portfolio.upload.retry')}
            </AppText>
          </Pressable>
        </View>
      ) : works.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
            <ImagePlus size={28} color={colors.accent} />
          </View>
          <AppText variant="heading" className="text-center">
            {t('portfolio.upload.empty.title')}
          </AppText>
          <AppText variant="muted" className="text-center">
            {t('portfolio.upload.empty.description')}
          </AppText>
          <Pressable
            onPress={startNewDraft}
            accessibilityRole="button"
            className="mt-1 rounded-full bg-accent px-4 py-2 active:bg-accent-strong">
            <AppText variant="body" className="text-sm font-semibold text-canvas">
              {t('portfolio.upload.add')}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={works}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkCard work={item} onEdit={openEdit} onArchive={openArchive} />
          )}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <Modal
        visible={isComposerOpen}
        transparent
        animationType="slide"
        onRequestClose={closeComposer}>
        <View className="flex-1 justify-end bg-canvas/80">
          <View
            className="rounded-t-3xl border-t border-line bg-surface px-5 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="mb-4 flex-row items-center justify-between">
              <AppText variant="heading">{t('portfolio.upload.newTitle')}</AppText>
              <Pressable
                onPress={closeComposer}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('portfolio.upload.cancel')}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: windowHeight * 0.55 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View className="gap-5 pb-4">
                {draft ? (
                  <>
                    <View className="overflow-hidden rounded-2xl border border-line bg-card">
                      <Image
                        source={{ uri: draft.uri }}
                        style={{
                          width: '100%',
                          aspectRatio: 4 / 3,
                          backgroundColor: colors.elevated,
                        }}
                        contentFit="cover"
                        transition={200}
                      />
                      <Pressable
                        onPress={replaceDraftImage}
                        accessibilityRole="button"
                        className="flex-row items-center justify-center gap-2 py-3 active:bg-elevated">
                        <ImagePlus size={16} color={colors.accent} />
                        <AppText variant="body" className="text-sm text-accent">
                          {t('portfolio.upload.changeImage')}
                        </AppText>
                      </Pressable>
                    </View>

                    <MetadataFields value={draft} onChange={updateDraft} />
                  </>
                ) : null}
              </View>
            </ScrollView>

            <View className="mt-2 flex-row gap-3">
              <Pressable
                onPress={closeComposer}
                disabled={isPublishing}
                accessibilityRole="button"
                className="h-12 flex-1 items-center justify-center rounded-xl border border-line bg-elevated active:bg-surface">
                <AppText variant="body" className="font-semibold text-ink">
                  {t('portfolio.upload.cancel')}
                </AppText>
              </Pressable>
              <Pressable
                onPress={handlePublish}
                disabled={isPublishing}
                accessibilityRole="button"
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent active:bg-accent-strong ${
                  isPublishing ? 'opacity-70' : ''
                }`}>
                {isPublishing ? (
                  <>
                    <ActivityIndicator color={colors.canvas} />
                    <AppText variant="body" className="font-semibold text-canvas">
                      {t('portfolio.upload.publishing')}
                    </AppText>
                  </>
                ) : (
                  <AppText variant="body" className="font-semibold text-canvas">
                    {t('portfolio.upload.publish')}
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>

          {isPublishing ? (
            <View className="absolute inset-0 items-center justify-center gap-3 bg-canvas/80">
              <TattooMachineLoader />
              <AppText variant="muted">{t('portfolio.upload.loader')}</AppText>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={editTarget !== null && editValue !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}>
        <View className="flex-1 justify-end bg-canvas/80">
          <View
            className="rounded-t-3xl border-t border-line bg-surface px-5 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="mb-4 flex-row items-center justify-between">
              <AppText variant="heading">{t('portfolio.upload.editTitle')}</AppText>
              <Pressable
                onPress={closeEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('portfolio.upload.cancel')}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: windowHeight * 0.55 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View className="gap-5 pb-4">
                {editTarget ? (
                  <View className="overflow-hidden rounded-2xl border border-line bg-card">
                    <Image
                      source={{ uri: editTarget.imageUrl }}
                      style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.elevated }}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                ) : null}

                {editValue ? <MetadataFields value={editValue} onChange={updateEditValue} /> : null}
              </View>
            </ScrollView>

            <View className="mt-2 flex-row gap-3">
              <Pressable
                onPress={closeEdit}
                disabled={isSaving}
                accessibilityRole="button"
                className="h-12 flex-1 items-center justify-center rounded-xl border border-line bg-elevated active:bg-surface">
                <AppText variant="body" className="font-semibold text-ink">
                  {t('portfolio.upload.cancel')}
                </AppText>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={isSaving}
                accessibilityRole="button"
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent active:bg-accent-strong ${
                  isSaving ? 'opacity-70' : ''
                }`}>
                {isSaving ? (
                  <>
                    <ActivityIndicator color={colors.canvas} />
                    <AppText variant="body" className="font-semibold text-canvas">
                      {t('portfolio.upload.saving')}
                    </AppText>
                  </>
                ) : (
                  <AppText variant="body" className="font-semibold text-canvas">
                    {t('portfolio.upload.save')}
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>

          {isSaving ? (
            <View className="absolute inset-0 items-center justify-center gap-3 bg-canvas/80">
              <TattooMachineLoader />
              <AppText variant="muted">{t('portfolio.upload.saving')}</AppText>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={archiveTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closeArchive}>
        <View className="flex-1 items-center justify-center bg-canvas/80 px-8">
          <View className="w-full gap-4 rounded-3xl border border-line bg-surface p-6">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
              <Trash2 size={22} color={colors.danger} />
            </View>
            <View className="gap-1.5">
              <AppText variant="heading">{t('portfolio.upload.archiveTitle')}</AppText>
              <AppText variant="muted">{t('portfolio.upload.archiveDescription')}</AppText>
            </View>
            <View className="mt-1 flex-row gap-3">
              <Pressable
                onPress={closeArchive}
                disabled={isArchiving}
                accessibilityRole="button"
                className="h-12 flex-1 items-center justify-center rounded-xl border border-line bg-elevated active:bg-surface">
                <AppText variant="body" className="font-semibold text-ink">
                  {t('portfolio.upload.cancel')}
                </AppText>
              </Pressable>
              <Pressable
                onPress={confirmArchive}
                disabled={isArchiving}
                accessibilityRole="button"
                accessibilityLabel={t('portfolio.upload.archiveConfirm')}
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-danger active:opacity-90 ${
                  isArchiving ? 'opacity-70' : ''
                }`}>
                {isArchiving ? <ActivityIndicator color={colors.canvas} /> : null}
                <AppText variant="body" className="font-semibold text-canvas">
                  {t('portfolio.upload.archiveConfirm')}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
