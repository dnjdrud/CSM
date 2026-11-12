import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the react-server condition; it is a no-op marker in tests.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  // Every test file gets its own in-memory database (never ./data).
  test: { environment: "node", include: ["tests/**/*.test.ts"], env: { FAMILY_DB_PATH: ":memory:" } },
});
