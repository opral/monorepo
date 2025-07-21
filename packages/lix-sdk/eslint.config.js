import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	{
		ignores: ["**/dist/**", "**/*.d.ts", "eslint.config.js"],
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["**/*.{js,ts}"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			/**
			 * CRITICAL: Prevents unhandled promises which can cause:
			 * 1. Database operations executing out of order → race conditions & data corruption
			 * 2. Unhandled rejections → crashes or inconsistent state
			 * 3. Transaction integrity violations
			 * 
			 * How to fix:
			 * - await someAsyncOperation() - Preferred for DB operations
			 * - void someAsyncOperation() - Intentional fire-and-forget (see below)
			 * - someAsyncOperation().catch() - When you need error handling
			 * 
			 * Using void:
			 * void is appropriate for async operations where:
			 * - No database operations are performed
			 * - Order doesn't matter (e.g., analytics, telemetry)
			 * - Blocking would hurt UX (e.g., server fetch for non-critical data)
			 * 
			 * Example: void captureAnalytics(...) // Won't block user actions
			 * 
			 * ⚠️ ALWAYS await database operations to guarantee execution order!
			 */
			"@typescript-eslint/no-floating-promises": [
				"error",
				{
					ignoreVoid: true,
					ignoreIIFE: false,
				},
			],
			"no-restricted-imports": [
				"error",
				{
					name: "@lix-js/sdk",
					message:
						"Importing from the compiled dist is not allowed (and you likely did this by accident). Import from source directly instead e.g. `./file.js`",
				},
			],
		},
	},
	{
		files: ["**/*.test.ts"],
		rules: {
			// any makes testing sometimes easier
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];
