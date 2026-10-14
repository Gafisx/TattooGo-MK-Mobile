import { useFrame } from '@react-three/fiber/native';
import { useRef } from 'react';
import * as THREE from 'three';

/** Dígitos suportados no "decalque" do OTP. */
export type TattooDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/**
 * Amplitude (em unidades de cena) da projeção 2D do número no plano de
 * desenho. `x` e `y` são aplicados sobre as coordenadas normalizadas
 * `[-1, 1]` das curvas de cada dígito.
 */
export const TATTOO_PATH_SCALE = { x: 0.42, y: 0.47 } as const;

/** Deslocamento vertical do centro do decalque (mantém o traçado na zona baixa). */
export const TATTOO_PATH_OFFSET_Y = -0.6;

/** Velocidade do traço, em progresso por segundo (0 -> 1). */
export const TATTOO_DRAW_SPEED = 0.85;

/**
 * Waypoints simplificados (coordenadas normalizadas, eixo Y para cima) para os
 * números de 0 a 9. A suavização é feita por `CatmullRomCurve3`, dispensando um
 * motor de física/paths pesado.
 */
const DIGIT_WAYPOINTS: Record<TattooDigit, number[][]> = {
  '0': [
    [0, 1],
    [0.55, 0.75],
    [0.75, 0],
    [0.55, -0.75],
    [0, -1],
    [-0.55, -0.75],
    [-0.75, 0],
    [-0.55, 0.75],
    [0, 1],
  ],
  '1': [
    [-0.35, 0.62],
    [0.02, 0.95],
    [0.02, -0.95],
  ],
  '2': [
    [-0.7, 0.6],
    [-0.35, 0.95],
    [0.2, 0.9],
    [0.55, 0.55],
    [0.25, 0.1],
    [-0.7, -0.85],
    [0.7, -0.9],
  ],
  '3': [
    [-0.55, 0.8],
    [-0.05, 0.98],
    [0.5, 0.75],
    [0.45, 0.35],
    [0, 0.15],
    [0.5, -0.25],
    [0.45, -0.75],
    [-0.15, -0.95],
    [-0.55, -0.8],
  ],
  '4': [
    [0.4, 0.98],
    [-0.6, 0.2],
    [0.65, 0.2],
    [0.65, -0.95],
  ],
  '5': [
    [-0.6, 0.9],
    [0.45, 0.95],
    [0.5, 0.4],
    [0, 0.2],
    [0.5, -0.3],
    [0.15, -0.9],
    [-0.6, -0.8],
  ],
  '6': [
    [0.5, 0.9],
    [-0.3, 0.5],
    [-0.6, -0.2],
    [-0.15, -0.8],
    [0.45, -0.6],
    [0.45, -0.05],
    [0, 0.12],
    [-0.45, -0.05],
  ],
  '7': [
    [-0.6, 0.95],
    [0.6, 0.95],
    [0.05, -0.95],
  ],
  '8': [
    [0, 0.45],
    [0.5, 0.75],
    [0.45, 0.25],
    [0, 0.05],
    [-0.45, 0.25],
    [-0.5, 0.75],
    [0, 0.45],
    [0, 0.05],
    [0.5, -0.35],
    [0.45, -0.8],
    [0, -0.98],
    [-0.45, -0.8],
    [-0.5, -0.35],
    [0, 0.05],
  ],
  '9': [
    [0.5, 0.3],
    [0.45, 0.8],
    [0, 0.95],
    [-0.5, 0.75],
    [-0.5, 0.25],
    [0, 0.05],
    [0.5, 0.2],
    [0.45, -0.5],
    [0.35, -0.95],
  ],
};

const curveCache = new Map<string, THREE.CatmullRomCurve3>();

/** Verifica se o valor recebido é um dígito válido do decalque. */
export function isTattooDigit(value: string | null | undefined): value is TattooDigit {
  return typeof value === 'string' && /^[0-9]$/.test(value);
}

function toWorld([nx, ny]: number[]): THREE.Vector3 {
  return new THREE.Vector3(
    nx! * TATTOO_PATH_SCALE.x,
    ny! * TATTOO_PATH_SCALE.y + TATTOO_PATH_OFFSET_Y,
    0,
  );
}

/** Curva suavizada (cacheada) de um dígito, já projetada nas coordenadas de cena. */
export function getTattooCurve(digit: string): THREE.CatmullRomCurve3 | null {
  if (!isTattooDigit(digit)) return null;
  const cached = curveCache.get(digit);
  if (cached) return cached;
  const curve = new THREE.CatmullRomCurve3(
    DIGIT_WAYPOINTS[digit].map(toWorld),
    false,
    'catmullrom',
    0.5,
  );
  curveCache.set(digit, curve);
  return curve;
}

/** Amostra o traçado do decalque azul (stencil) para desenhar a guia. */
export function getTattooStencilPoints(digit: string, divisions = 72): THREE.Vector3[] {
  const curve = getTattooCurve(digit);
  return curve ? curve.getPoints(divisions) : [];
}

export interface TattooPathState {
  /** Posição atual da ponta ao longo do traçado. */
  point: THREE.Vector3;
  /** Progresso do desenho do dígito atual (0 -> 1). */
  progress: number;
  /** `true` enquanto a agulha ainda está percorrendo o traçado. */
  drawing: boolean;
}

export type TattooPathRef = { current: TattooPathState };

/**
 * Percorre o traçado do dígito atual atualizando uma ref mutável dentro do
 * `useFrame` (sem causar re-render do React). `drawKey` permite forçar um novo
 * traçado quando o mesmo dígito é digitado em sequência (ex.: "11").
 */
export function useTattooPath(
  currentDigit: string | undefined,
  enabled = true,
  drawKey?: string | number,
): TattooPathRef {
  const state = useRef<TattooPathState>({
    point: new THREE.Vector3(0, TATTOO_PATH_OFFSET_Y, 0),
    progress: 1,
    drawing: false,
  });
  const lastKey = useRef<string>('');

  useFrame((_, delta) => {
    const active = enabled && isTattooDigit(currentDigit);
    if (!active) {
      state.current.drawing = false;
      lastKey.current = '';
      return;
    }

    const key = `${currentDigit}:${drawKey ?? ''}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      state.current.progress = 0;
    }

    const curve = getTattooCurve(currentDigit);
    if (!curve) {
      state.current.drawing = false;
      return;
    }

    const progress = Math.min(1, state.current.progress + delta * TATTOO_DRAW_SPEED);
    state.current.progress = progress;
    curve.getPoint(progress, state.current.point);
    state.current.drawing = progress < 1;
  });

  return state;
}
