import { defineConfig } from "vite"
import { paraglide } from "@inlang/paraglide-js-adapter-vite"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
})
