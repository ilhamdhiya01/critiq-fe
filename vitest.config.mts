import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out", "build", "coverage"],
    // Repo masih kosong; tanpa ini `pnpm test` (wajib per CLAUDE.md) gagal
    // sampai test pertama ditulis.
    passWithNoTests: true,
    // Component tests render real query/virtualizer trees; with ~900 tests in
    // parallel (and coverage instrumentation) 5s is too tight and flakes.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    // `pnpm test:coverage` only; no thresholds, so `pnpm test` is unchanged.
    coverage: {
      provider: "v8",
      include: [
        "components/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "services/**/*.ts",
        "stores/**/*.ts",
        "const/**/*.ts",
      ],
      exclude: [
        "**/index.{ts,tsx}",
        "**/*.types.ts",
        "**/__tests__/**",
        "lib/test-utils/**",
      ],
      reporter: ["text-summary", "json-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
});
