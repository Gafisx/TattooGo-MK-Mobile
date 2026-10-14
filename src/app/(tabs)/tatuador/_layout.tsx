import { Slot } from 'expo-router';

import { TatuadorKycGate } from '@/components/features/tatuador-kyc-gate';

/**
 * Layout do Dashboard do tatuador (port de `app/dashboard/tatuador/layout.tsx`).
 *
 * O `TatuadorKycGate` cobre a tela inteira com o bloqueio de KYC enquanto o
 * perfil não for tatuador/estúdio com KYC `aprovado`. Somente então os
 * `children` (as telas do dashboard) são renderizados — a barreira intercepta
 * o acesso no roteamento, não na tela.
 */
export default function TatuadorLayout() {
  return (
    <TatuadorKycGate>
      <Slot />
    </TatuadorKycGate>
  );
}
