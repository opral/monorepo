import { defineConfig } from "vite"
import { paraglide } from "@inlang/paraglide-js-adapter-vite"
import path from "node:path"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
	resolve: {
		alias: {
			$paraglide: path.resolve(__dirname, "./src/paraglide"),
		},
	},
})
