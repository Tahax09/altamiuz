import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// D-2: other code may import a module only through its public `index.ts`.
const moduleBoundary = {
  patterns: [
    {
      group: ['@/modules/*/*', '**/modules/*/*'],
      message: 'Import modules only through their public index (src/modules/<name>/index.ts).',
    },
  ],
}

// D-5: URL paths are built only by the typed route map (src/modules/i18n/routes.ts).
const noHandBuiltPaths = [
  {
    selector: 'TemplateLiteral[quasis.0.value.raw=/^\\/[a-z]{2}\\//]',
    message: 'Build localized paths with href() from src/modules/i18n/routes.ts.',
  },
  {
    selector: "BinaryExpression[operator='+'][left.type='Literal'][left.value=/^\\//]",
    message: 'Build paths with href() from src/modules/i18n/routes.ts, not string concatenation.',
  },
]

const config = [
  {
    ignores: [
      'node_modules/**',
      'public/vendor/**',
      '.pw-browsers/**',
      '.next/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'research/**',
      'specs/**',
      '.specify/**',
      '.claude/**',
      'next-env.d.ts',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', moduleBoundary],
      'no-restricted-syntax': ['error', ...noHandBuiltPaths],
    },
  },
  {
    // Inside a module, relative imports of its own files are allowed.
    files: ['src/modules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Payload-generated migrations keep the generator's signature.
    files: ['migrations/**/*.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
  {
    files: ['src/modules/i18n/routes.ts', 'src/app/(payload)/**'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]

export default config
