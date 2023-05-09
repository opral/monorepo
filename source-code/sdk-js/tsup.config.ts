import { defineConfig } from "tsup"

export default defineConfig(({ watch }) => ({
	entryPoints: ["./src/adapter-sveltekit/index.ts"],
	outDir: "./dist/adapter-sveltekit",
	bundle: true,
	platform: "node",
	format: "esm",
	target: "es2022",
	sourcemap: !watch,
	dts: true,
	splitting: false,
	external: ['svelte/compiler', '@sveltejs/kit/vite'],
})
)