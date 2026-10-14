import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  fetchStudioCompliance,
  registerStudio,
  studioKeys,
  validateStudioCnpj,
} from '@/lib/services/studio';
import type { StudioCnpjValidation, StudioComplianceView } from '@/lib/types/studio';

export interface UseStudioComplianceResult {
  /** Compliance registada (razão social + CNPJ mascarado), ou `null`. */
  compliance: StudioComplianceView | null;
  /** Resultado provisório de `validate-cnpj` (pré-registro). */
  validation: StudioCnpjValidation | null;
  isLoading: boolean;
  isError: boolean;
  isValidating: boolean;
  isRegistering: boolean;
  /** Valida o CNPJ junto da API; lança em falha para o chamador tratar. */
  validate: (cnpj: string) => Promise<StudioCnpjValidation>;
  /** Registra o CNPJ validado como compliance do estúdio. */
  register: (cnpj: string) => Promise<StudioComplianceView>;
  /** Limpa o resultado de validação (ex.: após editar o input). */
  reset: () => void;
  refetch: () => void;
}

/**
 * Compliance de CNPJ do estúdio.
 *
 * Envolve `GET /api/studios/compliance` (React Query) e expõe as duas mutations
 * do fluxo: validar (`validate-cnpj`) e registrar (`register`). O resultado do
 * registro é injetado no cache da query para a UI atualizar sem refetch.
 */
export function useStudioCompliance(): UseStudioComplianceResult {
  const queryClient = useQueryClient();
  const [validation, setValidation] = useState<StudioCnpjValidation | null>(null);

  const query = useQuery({
    queryKey: studioKeys.compliance(),
    queryFn: fetchStudioCompliance,
    staleTime: 30 * 1000,
  });

  const validateMutation = useMutation({
    mutationFn: validateStudioCnpj,
    onSuccess: (data) => setValidation(data),
  });

  const registerMutation = useMutation({
    mutationFn: registerStudio,
    onSuccess: (data) => {
      setValidation(null);
      queryClient.setQueryData(studioKeys.compliance(), data);
    },
  });

  const reset = useCallback(() => setValidation(null), []);

  return {
    compliance: query.data ?? null,
    validation,
    isLoading: query.isLoading,
    isError: query.isError,
    isValidating: validateMutation.isPending,
    isRegistering: registerMutation.isPending,
    validate: validateMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    reset,
    refetch: () => void query.refetch(),
  };
}
