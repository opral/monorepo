import { defineConfig } from "vitest/config";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
    plugins: [process.env.CODSPEED_BENCH ? codspeedPlugin() : undefined],
    test: {
        // increased default timeout to avoid ci/cd issues
        // the high timeout will be needed less with further performance improvements
        testTimeout: 120000,
        // Only pick up tests from src; ignore compiled output in dist
        include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
        exclude: [
            "node_modules/**",
            "dist/**",
            "build/**",
            "coverage/**",
            "**/*.d.ts",
            ".{git,cache,output,idea}/**",
        ],
    },
});
