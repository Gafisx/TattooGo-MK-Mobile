/// <reference types="expo/types" />

/**
 * Typed public runtime configuration. Values are inlined by the Metro bundler
 * from the `EXPO_PUBLIC_*` variables, so they must be declared here for the
 * compiler to resolve them.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Clerk publishable key. Required to enable native auth; when absent the
     * app boots in the inspectable development mode (`isAuthConfigured`).
     */
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    /** TattooGo backend base URL. */
    EXPO_PUBLIC_API_URL?: string;
  }
}
