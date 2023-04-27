import { defineConfig } from 'tsup'

export default defineConfig(({ watch }) => ({
	entryPoints: ["./src/adapter-sveltekit/index.ts"],
	outDir: "./dist/adapter-sveltekit",
	bundle: true,
	platform: "node",
	format: "esm",
	target: 'es2020',
	sourcemap: !watch,
	dts: true
}))
