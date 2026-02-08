import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './src',
    include: ['**/__tests__/**/*.test.ts'],
    coverage: {
      include: ['**/*.ts'],
      exclude: ['**/*.d.ts', '**/__tests__/**', 'bench.ts'],
    },
  },
});
