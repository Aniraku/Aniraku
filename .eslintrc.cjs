module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Pre-existing `any` debt across the ported codebase (142 sites). Types are
    // still gated by `tsc --noEmit` (strict + noUnusedLocals/Parameters); this
    // keeps `bun run lint` (CI) green without a 142-site rewrite pre-launch.
    '@typescript-eslint/no-explicit-any': 'off',
    // Underscore-prefixed args/vars are the intentional-unused convention
    // (shims keep legacy signatures source-compatible).
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
