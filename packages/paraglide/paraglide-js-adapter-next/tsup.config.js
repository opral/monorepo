import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["./src/index.tsx", "./src/plugin/index.ts"],
	format: ["cjs", "esm"],
	splitting: false,
	sourcemap: true,
	dts: true,
	clean: true,
	external: ["$paraglide-adapter-next-internal/runtime.js"],
})
