import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests cover the pure logic that decides what goes on the wire:
 * normalization, variable substitution, auth schemes, body encoding, the
 * composition pipeline, assertions, import/export, and the SSRF address guard.
 *
 * These modules were deliberately written free of React, Prisma, and network
 * access so they can be tested directly, with no mocking and no test database.
 *
 * Pinned to vitest 3: vitest 4 trips an arborist bug in npm 10.x
 * ("Cannot read properties of null (reading 'edgesOut')"). Revisit after npm 12.
 */
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias from tsconfig.json. Set directly rather than
    // pulling in vite-tsconfig-paths for a single mapping.
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/db.ts", "src/lib/auth*.ts", "src/lib/env.ts", "src/lib/utils.ts"],
    },
  },
});
