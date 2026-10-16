import { ApiError, api, endpoints } from '@/lib/api';

/**
 * KYC active-liveness evidence (enterprise pattern).
 *
 * On-device blink/smile heuristics (`leftEyeOpenProbability`, `smilingProbability`)
 * are trivially spoofed with a cut-out photo or a virtual camera, and Expo SDK 57
 * removed face detection from `expo-camera`/`expo-face-detector` anyway. Instead we
 * capture a short 3-second "approach / turn the head" video inside `expo-camera` plus
 * a live selfie, and stream both raw files to the backend. A server-side liveness
 * service (e.g. AWS Rekognition) is the single source of truth.
 *
 * There is intentionally no gallery picker on this path: evidence MUST be captured
 * live, so the only inputs are the camera URIs produced by `recordAsync` and
 * `takePictureAsync`.
 */

/** Length of the liveness challenge recording, in milliseconds. */
export const LIVENESS_DURATION_MS = 3000;

export interface LivenessEvidence {
  /** Local `file://` URI of the 3s liveness video captured by `recordAsync`. */
  videoUri: string;
  /** Local `file://` URI of the live selfie captured by `takePictureAsync`. */
  photoUri: string;
  /** Effective recording duration, in milliseconds. */
  durationMs: number;
  /** On-device capture timestamp (ISO), bound into the evidence hash. */
  capturedAt: string;
}

export interface LivenessSubmission {
  /** Backend correlation id for the review, when returned. */
  submissionId: string | null;
  /** Resulting KYC status hint (defaults to `em_analise`). */
  status: string;
}

interface NativeFilePart {
  uri: string;
  name: string;
  type: string;
}

/**
 * React Native's `FormData` polyfill consumes `{ uri, name, type }` file parts and
 * reads the binary lazily from disk. The DOM typings only describe `Blob`, so the
 * cast keeps the multipart contract (filename + content-type per part) while
 * staying type-safe at the call site.
 */
function appendFile(form: FormData, field: string, file: NativeFilePart): void {
  form.append(field, file as unknown as Blob);
}

function inferVideoName(uri: string): string {
  const last = uri.split('/').at(-1);
  return last && last.length > 0 ? last : `liveness-${Date.now()}.mp4`;
}

/**
 * `POST /api/kyc/liveness` (multipart/form-data).
 *
 * Sends the liveness video + live selfie as evidence. The request is hardware
 * attested (the path matches the critical `/api/kyc` pattern), so the backend
 * receives a Play Integrity / App Attest verdict alongside the media.
 */
export async function submitLivenessEvidence(
  evidence: LivenessEvidence,
): Promise<LivenessSubmission> {
  const form = new FormData();
  appendFile(form, 'livenessVideo', {
    uri: evidence.videoUri,
    name: inferVideoName(evidence.videoUri),
    type: 'video/mp4',
  });
  appendFile(form, 'selfie', {
    uri: evidence.photoUri,
    name: `selfie-${Date.now()}.jpg`,
    type: 'image/jpeg',
  });
  form.append('durationMs', String(evidence.durationMs));
  form.append('capturedAt', evidence.capturedAt);

  const payload = await api.post<Record<string, unknown>>(endpoints.kyc.liveness(), form, {
    attest: true,
  });

  if (payload.sucesso === false) {
    throw new ApiError(
      typeof payload.erro === 'string' ? payload.erro : 'kyc.liveness.error',
      400,
      payload,
    );
  }

  const submissionId =
    typeof payload.id === 'string'
      ? payload.id
      : typeof payload.submissionId === 'string'
        ? payload.submissionId
        : null;
  const status = typeof payload.status === 'string' ? payload.status : 'em_analise';

  return { submissionId, status };
}
