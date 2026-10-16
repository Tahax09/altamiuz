import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Local runs read .env.local; CI provides real environment variables, which take precedence.
const fileEnv = loadEnv('development', process.cwd(), '')
for (const [k, v] of Object.entries(fileEnv)) process.env[k] ??= v

const alias = {
  '@/modules': path.resolve(import.meta.dirname, 'src/modules'),
  '@/ui': path.resolve(import.meta.dirname, 'src/ui'),
  '@payload-config': path.resolve(import.meta.dirname, 'src/payload.config.ts'),
}

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/setup/db.ts'],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
