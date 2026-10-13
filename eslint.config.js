const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/**', 'dist-smoke/**', '.template-backup/**', 'node_modules/**'],
  },
];
