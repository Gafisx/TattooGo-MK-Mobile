import { z } from 'zod';

import {
  isValidBirthDate,
  isValidCNPJ,
  isValidCPF,
  USERNAME_PATTERN,
} from '@/lib/validation';

/**
 * Zod contracts for the native auth forms. They mirror the web register/login
 * validation, including the role-dependent document rule:
 *  - `cliente`          -> CPF is required.
 *  - `tatuador`/`estudio` -> CNPJ is required.
 * The birth date is always required and must belong to an 18+ user.
 */

export const APP_ROLE_VALUES = ['cliente', 'tatuador', 'estudio'] as const;

export const roleSchema = z.enum(APP_ROLE_VALUES);

export const registerSchema = z
  .object({
    role: roleSchema,
    nome: z.string().trim().min(2, 'Informe o seu nome completo.'),
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    password: z
      .string()
      .min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
    cpf: z.string(),
    cnpj: z.string(),
    dataNascimento: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.role === 'cliente') {
      if (!isValidCPF(value.cpf)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cpf'],
          message: 'CPF inválido.',
        });
      }
    } else if (!isValidCNPJ(value.cnpj)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cnpj'],
        message: 'CNPJ inválido.',
      });
    }

    if (!isValidBirthDate(value.dataNascimento)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataNascimento'],
        message: 'Data inválida. É necessário ter 18 anos ou mais.',
      });
    }
  });

/**
 * Login aceita `identifier` na forma de e-mail **ou** de `@username`, espelhando
 * o `signIn.create({ identifier })` do Clerk.
 */
export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Informe o seu e-mail ou @username.'),
    password: z.string().min(1, 'Informe a sua palavra-passe.'),
  })
  .superRefine((value, ctx) => {
    const identifier = value.identifier.toLowerCase();

    if (identifier.startsWith('@')) {
      if (!USERNAME_PATTERN.test(identifier.slice(1))) {
        ctx.addIssue({
          code: 'custom',
          path: ['identifier'],
          message: 'Username inválido. Use 3 a 20 caracteres: letras, números ou _.',
        });
      }
      return;
    }

    if (!z.string().email().safeParse(identifier).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['identifier'],
        message: 'E-mail inválido.',
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
