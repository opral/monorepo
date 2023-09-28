import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, "**/*.e2e.test.ts"],
		server: {
			deps: {
				external: ["vscode*"],
			},
		},
	},
})
