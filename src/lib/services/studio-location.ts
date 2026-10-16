import { api, endpoints } from '@/lib/api';

/**
 * Studio address / coordinates — anti-fraud service.
 *
 * The map provider (Leaflet/Mapbox) must never receive a simulated fix, so the
 * UI drops the coordinates the moment the OS reports `mocked === true`. The
 * `isMockedLocation` flag, however, is always forwarded to the backend so the
 * platform can quarantine a studio using a Fake GPS app.
 */

export interface StudioCoordinates {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy in meters, when reported by the provider. */
  accuracy: number | null;
}

export interface StudioLocationInput extends StudioCoordinates {
  /** `true` when the OS reports the fix as coming from a mock provider. */
  isMockedLocation: boolean;
}

export interface StudioLocationResult {
  /** `true` when the fix was accepted as genuine by the backend. */
  accepted: boolean;
  isMockedLocation: boolean;
}

interface StudioLocationResponse {
  accepted?: boolean;
  sucesso?: boolean;
}

/**
 * `POST /api/studios/location`.
 *
 * Persists the studio coordinates used by the map. A mocked fix is never
 * accepted as genuine, even if the backend would echo success.
 */
export async function submitStudioLocation(
  input: StudioLocationInput,
): Promise<StudioLocationResult> {
  const payload = await api.post<StudioLocationResponse>(endpoints.studios.location(), input);
  const accepted =
    input.isMockedLocation === false && payload.sucesso !== false && payload.accepted !== false;
  return { accepted, isMockedLocation: input.isMockedLocation };
}

/**
 * Fire-and-forget fraud signal raised the instant a mocked fix is detected.
 *
 * Deliberately never throws: the UI already blocks the flow, and the caller must
 * not surface a network error while reporting a security event.
 */
export async function reportMockedLocation(coords?: Partial<StudioCoordinates>): Promise<void> {
  try {
    await api.post(endpoints.studios.location(), {
      isMockedLocation: true,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
  } catch (error) {
    console.warn('[studio-location] falha ao reportar localização simulada:', error);
  }
}
