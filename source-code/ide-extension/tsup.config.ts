import { defineConfig } from "tsup"

export default defineConfig(({ watch }) => [
	{
		entryPoints: ["./src/plugin/index.ts"],
		outDir: "./dist/plugin",
		bundle: true,
		platform: "neutral",
		format: "esm",
		target: "es2020",
		sourcemap: !watch,
		minify: !watch,
		dts: true,
		splitting: false,
	},
])
