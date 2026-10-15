import { createContext, useContext } from 'react';

/**
 * Sinaliza às telas que existe um `AppHeader` global a ocupar a safe-area do
 * topo. O `Screen` usa isto para deixar de reaplicar o `inset.top` (que passaria
 * a duplicar o padding gerido pelo header).
 */
export const AppHeaderShownContext = createContext(false);

/** `true` quando a árvore atual está sob o header global (layout das tabs). */
export function useAppHeaderShown(): boolean {
  return useContext(AppHeaderShownContext);
}
