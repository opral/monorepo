import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // increased default timeout to avoid ci/cd issues
    testTimeout: 60000,
  },
});
