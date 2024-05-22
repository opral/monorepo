import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"
import manifest from "./marketplace-manifest.json"

export default defineConfig(({ mode }) => {
	// eslint-disable-next-line no-undef
	const pToken = process.env.PUBLIC_POSTHOG_TOKEN
	if (mode === "production" && (!pToken || typeof pToken !== "string")) {
		throw new Error(
			"Missing env variable PUBLIC_POSTHOG_TOKEN - If you are just developing use `npm run dev:build` instead" +
				"\n" +
				"Available variables: " +
				"\n" +
				// eslint-disable-next-line no-undef
				Object.keys(process.env)
					.filter((key) => key.startsWith("PUBLIC_"))
					.join("\n")
		)
	}

	return {
		plugins: [dts({ insertTypesEntry: true, ignoreConfigErrors: true }), tsconfigPaths()],
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
			PARJS_POSTHOG_TOKEN: JSON.stringify(pToken || "posthog_token_placeholder"),
			PARJS_PACKAGE_VERSION: JSON.stringify(pkg.version),
			PARJS_MARKTEPLACE_ID: JSON.stringify(manifest.id),
		},
	}
})
