import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"

export default defineConfig(({ mode }) => ({
	plugins: [dts({ insertTypesEntry: true }), tsconfigPaths()],
	build: {
		lib: {
			entry: ["src/index.ts", "src/adapter-utils/index.ts", "src/cli/index.ts"],
			formats: ["es"],
		},

		emptyOutDir: true,
		rollupOptions: {
			external: Object.keys(pkg.dependencies),
			input: {
				index: "src/index.ts",
				"adapter-utils/index": "src/adapter-utils/index.ts",
				"cli/index": "src/cli/index.ts",
			},
			output: {
				format: "es",
			},
		},
		outDir: "dist",
		target: "node16",
		minify: false,

		//needed to allow node APIs in the build
		ssr: true,
	},

	define: {
		ENV_DEFINED_IN_BUILD_STEP: JSON.stringify({
			isProduction: mode === "production",
		}),

		PACKAGE_VERSION: JSON.stringify(pkg.version),
	},
}))
