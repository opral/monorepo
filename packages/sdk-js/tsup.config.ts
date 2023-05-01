import { defineConfig } from "tsup"

export default defineConfig(({ watch }) => ([
	{
		entryPoints: ["./src/adapter-sveltekit/index.ts"],
		outDir: "./dist/adapter-sveltekit",
		bundle: true,
		platform: "node",
		format: "esm",
		target: "es2022",
		sourcemap: !watch,
		dts: true,
		splitting: false,
		external: ['svelte/compiler'],
	},
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
		// somehow `tsup` thinks that there are node internals in the plugin, but there aren't
		// workaround: mark them as external
		external: ['fs', 'path'],
	}
]))
