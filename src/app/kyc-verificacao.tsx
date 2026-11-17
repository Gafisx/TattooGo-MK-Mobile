import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { api, ApiError } from '@/lib/api';
import { LIVENESS_DURATION_MS } from '@/lib/services/kyc-liveness';

interface PresignUploadResponse {
  uploadUrl?: string;
  presignedUrl?: string;
  url?: string;
  fileKey?: string;
  key?: string;
}

/**
 * Upload seguro direto para o bucket Cloudflare R2 usando URL pré-assinada gerada pelo BFF.
 */
async function uploadKycFileToR2(
  localUri: string,
  defaultFileName: string,
  contentType: string,
): Promise<string> {
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  const fileName = localUri.split('/').pop() || defaultFileName;
  const fileSize = blob.size;

  const presignData = await api.post<PresignUploadResponse>('/api/upload/presign', {
    context: 'kyc',
    fileName,
    contentType,
    fileSize,
  });

  const uploadUrl = presignData.uploadUrl || presignData.presignedUrl || presignData.url;
  const fileKey = presignData.fileKey || presignData.key || fileName;

  if (!uploadUrl) {
    throw new ApiError('Falha ao obter URL pré-assinada do R2 para KYC.', 500, presignData);
  }

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!putResponse.ok) {
    throw new ApiError(
      `Falha no upload direto para R2: HTTP ${putResponse.status}`,
      putResponse.status,
      null,
    );
  }

  return fileKey;
}

type Step = 'video' | 'photo' | 'review' | 'done';
type Busy = 'idle' | 'recording' | 'capturing' | 'submitting';

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Voltar">
        <Ionicons name="arrow-back" size={24} color={colors.ink} />
      </Pressable>
      <AppText variant="heading">Verificação de identidade</AppText>
      <View style={{ width: 24 }} />
    </View>
  );
}

/** Explicit "live only" badge so the anti-gallery rule is visible to the user. */
function LiveOnlyBadge() {
  return (
    <View className="mt-3 flex-row items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent-glow px-3 py-1.5">
      <Ionicons name="lock-closed" size={12} color={colors.accent} />
      <AppText variant="muted" className="text-[11px] text-accent">
        Captura ao vivo — não é possível escolher da galeria
      </AppText>
    </View>
  );
}

/**
 * KYC active-liveness capture via Cloudflare R2 Presigned URLs.
 *
 * Duas capturas obrigatórias exclusivamente via câmera nativa:
 *  1. `video` — gravação frontal de 3s (aproximar e mover rosto).
 *  2. `photo` — selfie ao vivo capturada diretamente do preview.
 *
 * Ambas são enviadas diretamente ao bucket R2 via upload PUT pré-assinado
 * (`POST /api/upload/presign`), seguido pela validação atestada em
 * `POST /api/kyc/verify` (ou `/api/kyc/validate-document`).
 */
export default function KycVerificacaoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { triggerHaptic } = useHapticFeedback();

  const [step, setStep] = useState<Step>('video');
  const [busy, setBusy] = useState<Busy>('idle');
  const [secondsLeft, setSecondsLeft] = useState(Math.round(LIVENESS_DURATION_MS / 1000));
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Never leave a recording running when the screen unmounts.
  useEffect(
    () => () => {
      cameraRef.current?.stopRecording();
    },
    [],
  );

  const startLiveness = useCallback(async () => {
    if (busy !== 'idle') return;
    if (Platform.OS === 'web') {
      setError('A prova de vida está disponível apenas no dispositivo móvel.');
      return;
    }
    if (!cameraRef.current) return;

    setError(null);
    setBusy('recording');
    setSecondsLeft(Math.round(LIVENESS_DURATION_MS / 1000));
    void triggerHaptic('light');

    const countdown = setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: LIVENESS_DURATION_MS / 1000,
      });
      if (result?.uri) {
        setVideoUri(result.uri);
        setStep('photo');
        void triggerHaptic('success');
      } else {
        setError('Não foi possível gravar o vídeo de prova de vida. Tente novamente.');
        void triggerHaptic('error');
      }
    } catch (err) {
      console.warn('[kyc-verificacao] falha ao gravar prova de vida:', err);
      setError('Não foi possível gravar o vídeo de prova de vida. Tente novamente.');
      void triggerHaptic('error');
    } finally {
      clearInterval(countdown);
      setBusy('idle');
    }
  }, [busy, triggerHaptic]);

  const captureSelfie = useCallback(async () => {
    if (busy !== 'idle' || !cameraRef.current) return;
    setError(null);
    setBusy('capturing');
    void triggerHaptic('light');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setStep('review');
        void triggerHaptic('success');
      } else {
        setError('Não foi possível capturar a selfie. Tente novamente.');
        void triggerHaptic('error');
      }
    } catch (err) {
      console.warn('[kyc-verificacao] falha ao capturar selfie:', err);
      setError('Não foi possível capturar a selfie. Tente novamente.');
      void triggerHaptic('error');
    } finally {
      setBusy('idle');
    }
  }, [busy, triggerHaptic]);

  const submit = useCallback(async () => {
    if (busy !== 'idle' || !videoUri || !photoUri) return;
    setError(null);
    setBusy('submitting');
    void triggerHaptic('light');
    try {
      // 1. Upload do vídeo de liveness para R2 via Presigned URL
      const videoKey = await uploadKycFileToR2(
        videoUri,
        `liveness-${Date.now()}.mp4`,
        'video/mp4',
      );

      // 2. Upload da selfie ao vivo para R2 via Presigned URL
      const photoKey = await uploadKycFileToR2(
        photoUri,
        `selfie-${Date.now()}.jpg`,
        'image/jpeg',
      );

      // 3. Disparar validação / verificação de documentos e biometria facial
      const verifyPayload = {
        fileKey: photoKey,
        photoFileKey: photoKey,
        videoFileKey: videoKey,
        durationMs: LIVENESS_DURATION_MS,
        capturedAt: new Date().toISOString(),
        metadata: {
          platform: Platform.OS,
          durationMs: LIVENESS_DURATION_MS,
          capturedAt: new Date().toISOString(),
          isLiveCapture: true,
        },
      };

      try {
        await api.post('/api/kyc/verify', verifyPayload, { attest: true });
      } catch (verifyErr) {
        if (verifyErr instanceof ApiError && verifyErr.status === 404) {
          // Endpoint alternativo do contrato Next.js BFF
          await api.post('/api/kyc/validate-document', verifyPayload, { attest: true });
        } else {
          throw verifyErr;
        }
      }

      setStep('done');
      void triggerHaptic('success');
    } catch (err) {
      console.warn('[kyc-verificacao] falha ao enviar prova de vida via R2:', err);
      const message =
        err instanceof ApiError && typeof err.body === 'object' && err.body && 'erro' in err.body
          ? String((err.body as { erro: unknown }).erro)
          : 'Não foi possível enviar a verificação. Verifique a ligação e tente novamente.';
      setError(message);
      void triggerHaptic('error');
    } finally {
      setBusy('idle');
    }
  }, [busy, photoUri, triggerHaptic, videoUri]);

  const reset = useCallback(() => {
    setVideoUri(null);
    setPhotoUri(null);
    setError(null);
    setStep('video');
  }, []);

  if (!permission) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <View className="mt-10 items-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-accent-glow">
            <Ionicons name="camera-outline" size={34} color={colors.accent} />
          </View>
          <AppText variant="heading" className="text-center">
            Permissão de câmara necessária
          </AppText>
          <AppText variant="muted" className="text-center">
            Para a prova de vida precisamos de acesso à câmara. As imagens são capturadas ao vivo,
            nunca escolhidas da galeria.
          </AppText>
        </View>
        <View className="mt-auto pb-6">
          <Button
            label="Permitir acesso à câmara"
            disabled={!permission.canAskAgain}
            onPress={() => void requestPermission()}
          />
        </View>
      </Screen>
    );
  }

  if (step === 'done') {
    return (
      <Screen>
        <Header onBack={() => router.replace('/kyc-pendente')} />
        <View className="flex-1 items-center justify-center gap-3 px-4">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-accent-glow">
            <Ionicons name="hourglass" size={34} color={colors.accent} />
          </View>
          <AppText variant="heading" className="text-center">
            Prova de vida enviada
          </AppText>
          <AppText variant="muted" className="text-center">
            Estamos a validar a sua identidade. Vai ser notificado assim que a análise terminar.
          </AppText>
        </View>
        <View className="pb-6">
          <Button label="Ver estado da verificação" onPress={() => router.replace('/kyc-pendente')} />
        </View>
      </Screen>
    );
  }

  const cameraMode = step === 'video' ? 'video' : 'picture';

  return (
    <Screen padded={false}>
      <View className="px-5 pt-2">
        <Header onBack={() => router.back()} />
      </View>

      <View className="flex-1 px-5">
        <View
          className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface"
          style={{ aspectRatio: 3 / 4 }}>
          {step === 'review' && photoUri ? (
            <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <CameraView
              ref={cameraRef}
              facing="front"
              mode={cameraMode}
              mute
              style={{ flex: 1 }}
              onMountError={(event) =>
                setError(event.message ?? 'Não foi possível iniciar a câmara.')
              }
            />
          )}

          {step === 'video' && busy === 'recording' ? (
            <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-canvas/80 px-3 py-1">
              <Ionicons name="videocam" size={13} color={colors.danger} />
              <AppText variant="body" className="text-xs font-semibold">
                {secondsLeft}s
              </AppText>
            </View>
          ) : null}
        </View>

        <View className="mt-5 gap-2">
          {step === 'video' ? (
            <>
              <AppText variant="heading">Prova de vida ativa</AppText>
              <AppText variant="muted">
                Grave {Math.round(LIVENESS_DURATION_MS / 1000)} segundos. Aproxime o rosto e vire
                ligeiramente a cabeça para os lados.
              </AppText>
            </>
          ) : null}
          {step === 'photo' ? (
            <>
              <AppText variant="heading">Selfie ao vivo</AppText>
              <AppText variant="muted">
                Olhe para a câmara e capture a sua selfie. A foto tem de ser tirada agora.
              </AppText>
            </>
          ) : null}
          {step === 'review' ? (
            <>
              <AppText variant="heading">Confirmar envio</AppText>
              <AppText variant="muted">
                A sua selfie e o vídeo de prova de vida serão enviados para análise da plataforma.
              </AppText>
            </>
          ) : null}

          <LiveOnlyBadge />
        </View>

        {error ? (
          <AppText variant="body" className="mt-3 text-sm text-danger">
            {error}
          </AppText>
        ) : null}

        <View className="mt-auto gap-3 pb-6">
          {step === 'video' ? (
            <Button
              label={
                busy === 'recording'
                  ? `A gravar... ${secondsLeft}s`
                  : `Iniciar prova de vida (${Math.round(LIVENESS_DURATION_MS / 1000)}s)`
              }
              icon={
                <Ionicons
                  name={busy === 'recording' ? 'radio-button-on' : 'videocam'}
                  size={18}
                  color={colors.canvas}
                />
              }
              disabled={busy !== 'idle'}
              onPress={() => void startLiveness()}
            />
          ) : null}

          {step === 'photo' ? (
            <Button
              label={busy === 'capturing' ? 'A capturar...' : 'Tirar selfie'}
              icon={<Ionicons name="camera" size={18} color={colors.canvas} />}
              loading={busy === 'capturing'}
              disabled={busy !== 'idle'}
              onPress={() => void captureSelfie()}
            />
          ) : null}

          {step === 'review' ? (
            <>
              <Button
                label={busy === 'submitting' ? 'A enviar...' : 'Enviar verificação'}
                loading={busy === 'submitting'}
                disabled={busy !== 'idle'}
                onPress={() => void submit()}
              />
              <Button
                label="Refazer captura"
                variant="secondary"
                disabled={busy !== 'idle'}
                onPress={reset}
              />
            </>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
