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
    /**
     * Google Cloud project number for the Android Play Integrity provider.
     * Public by design (not a secret); when absent, hardware attestation is
     * skipped on Android. iOS App Attest does not use this value.
     */
    EXPO_PUBLIC_APP_INTEGRITY_CLOUD_PROJECT_NUMBER?: string;
  }
}
