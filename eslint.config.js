const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/**', 'dist-smoke/**', '.template-backup/**', 'node_modules/**'],
  },
  {
    // React Three Fiber drives Three.js through JSX; its intrinsic elements use
    // Three.js property names (`position`, `intensity`, `vertexColors`, ...) that
    // `eslint-plugin-react` reports as unknown. The `.glb` model is loaded on
    // purpose via Metro's `require()`.
    files: ['src/components/ui/tattoo-machine-3d.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
