import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"

export default defineConfig(({ mode }) => ({
	plugins: [dts({ insertTypesEntry: true }), tsconfigPaths()],
	build: {
		lib: {
			entry: "src/index.ts",
			formats: ["es"],
		},
		emptyOutDir: true,
		rollupOptions: {
			external: Object.keys(pkg.dependencies),
		},
		outDir: "dist",
		target: "node16",
		minify: false,

		//needed to allow node APIs
		ssr: true,
	},

	define: {
		// eslint-disable-next-line no-undef
		ENV_DEFINED_IN_BUILD_STEP: JSON.stringify({
			isProduction: mode === "production",
		}),

		PACKAGE_VERSION: JSON.stringify(pkg.version),
	},
}))
