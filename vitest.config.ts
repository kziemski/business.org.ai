import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '.standards/**/*.test.ts',  // Exclude submodule tests (use bun: protocol)
    ],
    testTimeout: 30000,
  },
})
