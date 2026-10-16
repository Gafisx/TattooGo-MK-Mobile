import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import {
  reportMockedLocation,
  submitStudioLocation,
  type StudioCoordinates,
} from '@/lib/services/studio-location';

interface DetectedLocation extends StudioCoordinates {
  isMockedLocation: boolean;
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Voltar">
        <Ionicons name="arrow-back" size={24} color={colors.ink} />
      </Pressable>
      <AppText variant="heading">Endereço do estúdio</AppText>
      <View style={{ width: 24 }} />
    </View>
  );
}

function CoordinateRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
      <AppText variant="muted" className="text-xs">
        {label}
      </AppText>
      <AppText variant="body" className="font-semibold">
        {value}
      </AppText>
    </View>
  );
}

/**
 * Studio address / coordinates with Fake GPS defence.
 *
 * The fix is requested live via `getCurrentPositionAsync()`. When the OS reports
 * `mocked === true` (Android mock providers, Fake GPS apps) the flow is blocked
 * immediately:
 *  - the coordinates are dropped and never forwarded to Leaflet/Mapbox;
 *  - an alert tells the user to disable the Fake GPS app;
 *  - `isMockedLocation: true` is reported to the backend as a fraud signal.
 *
 * iOS does not expose a mock flag, so detection is Android-only; the flag simply
 * stays `false` there and the server-side checks remain the backstop.
 */
export default function EstudioEnderecoScreen() {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const { triggerHaptic } = useHapticFeedback();

  const [detected, setDetected] = useState<DetectedLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (saving) return;
    setError(null);
    setSaved(false);

    try {
      if (!permission?.granted) {
        const requested = await requestPermission();
        if (!requested.granted) {
          setError('Permissão de localização negada. Não é possível validar o endereço.');
          return;
        }
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('Ative os serviços de localização do dispositivo.');
        return;
      }

      void triggerHaptic('light');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const isMockedLocation = position.mocked === true;
      const coords: DetectedLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        isMockedLocation,
      };

      if (isMockedLocation) {
        // Block first: never surface simulated coordinates to the map provider.
        setDetected({ ...coords, isMockedLocation: true });
        setError('Localização simulada detectada. Desative aplicativos de Fake GPS.');
        void triggerHaptic('error');
        // Silent fraud signal to the backend (fire-and-forget, never throws).
        void reportMockedLocation(coords);
        Alert.alert(
          'Localização simulada detectada',
          'Desative aplicativos de Fake GPS e tente novamente. O envio das coordenadas foi bloqueado.',
        );
        return;
      }

      setDetected(coords);
      void triggerHaptic('success');
    } catch (err) {
      console.warn('[estudio-endereco] falha ao obter localização:', err);
      setError('Não foi possível obter a localização. Tente novamente.');
      void triggerHaptic('error');
    }
  }, [permission, requestPermission, saving, triggerHaptic]);

  const save = useCallback(async () => {
    if (saving || !detected || detected.isMockedLocation) return;
    setSaving(true);
    setError(null);
    void triggerHaptic('light');
    try {
      const result = await submitStudioLocation({
        latitude: detected.latitude,
        longitude: detected.longitude,
        accuracy: detected.accuracy,
        isMockedLocation: false,
      });
      if (result.accepted) {
        setSaved(true);
        void triggerHaptic('success');
      } else {
        setError('As coordenadas não foram aceites pela plataforma.');
        void triggerHaptic('error');
      }
    } catch (err) {
      console.warn('[estudio-endereco] falha ao guardar localização:', err);
      setError('Não foi possível guardar o endereço. Verifique a ligação e tente novamente.');
      void triggerHaptic('error');
    } finally {
      setSaving(false);
    }
  }, [detected, saving, triggerHaptic]);

  const mocked = detected?.isMockedLocation === true;

  return (
    <Screen>
      <Header onBack={() => router.back()} />

      <View className="mt-6 gap-3">
        <AppText variant="label">Localização do estúdio</AppText>
        <AppText variant="muted">
          Use a localização real do estúdio. Coordenadas simuladas são bloqueadas por segurança.
        </AppText>
      </View>

      <View className="mt-5 gap-3">
        {detected ? (
          <>
            <CoordinateRow label="Latitude" value={detected.latitude.toFixed(6)} />
            <CoordinateRow label="Longitude" value={detected.longitude.toFixed(6)} />
            <CoordinateRow
              label="Precisão"
              value={detected.accuracy ? `± ${Math.round(detected.accuracy)} m` : '—'}
            />
          </>
        ) : (
          <View className="items-center gap-2 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-8">
            <Ionicons name="location-outline" size={28} color={colors.muted} />
            <AppText variant="muted" className="text-center text-xs">
              Nenhuma localização obtida ainda.
            </AppText>
          </View>
        )}
      </View>

      {mocked ? (
        <View className="mt-4 flex-row items-start gap-2 rounded-2xl border border-danger/50 bg-danger/10 p-4">
          <Ionicons name="warning" size={18} color={colors.danger} />
          <View className="flex-1">
            <AppText variant="body" className="text-sm font-semibold text-danger">
              Localização simulada
            </AppText>
            <AppText variant="muted" className="text-xs">
              Desative aplicativos de Fake GPS. O backend foi notificado e as coordenadas não podem
              ser enviadas.
            </AppText>
          </View>
        </View>
      ) : null}

      {saved ? (
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl border border-success/40 bg-success/10 p-4">
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText variant="body" className="text-sm text-success">
            Endereço do estúdio guardado.
          </AppText>
        </View>
      ) : null}

      {error ? (
        <AppText variant="body" className="mt-4 text-sm text-danger">
          {error}
        </AppText>
      ) : null}

      {Platform.OS === 'ios' ? (
        <AppText variant="muted" className="mt-3 text-[11px]">
          Nota: a deteção de localização simulada é suportada apenas no Android.
        </AppText>
      ) : null}

      <View className="mt-auto gap-3 pb-6">
        <Button
          label={detected ? 'Atualizar localização' : 'Usar a minha localização atual'}
          icon={<Ionicons name="locate" size={18} color={colors.canvas} />}
          onPress={() => void detect()}
        />
        <Button
          label={saving ? 'A guardar...' : 'Guardar endereço'}
          variant="secondary"
          loading={saving}
          disabled={!detected || mocked || saving || saved}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}
