import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

export interface TattooMachineGlyphProps {
  size?: number;
  color?: string;
  /** Espessura do traço (escala com o tamanho por padrão). */
  strokeWidth?: number;
}

/**
 * Glifo estilizado da máquina de tatuagem (coil machine).
 *
 * Extraído para ser reutilizado no fallback do `AvatarUpload` e no
 * `TattooMachineMenuTrigger` (morphing do header), evitando duplicação de SVG.
 */
export function TattooMachineGlyph({
  size = 24,
  color = colors.ink,
  strokeWidth = 2,
}: TattooMachineGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="19" y="24" width="10" height="14" rx="3" />
        <Path d="M10 13c0-2.8 2.2-5 5-5h18c2.8 0 5 2.2 5 5v3H10v-3z" />
        <Circle cx="17" cy="12" r="4.5" />
        <Circle cx="31" cy="12" r="4.5" />
        <Line x1="24" y1="38" x2="24" y2="45" />
        <Path d="M6 16h6" />
        <Path d="M42 16h-6" />
      </G>
    </Svg>
  );
}
