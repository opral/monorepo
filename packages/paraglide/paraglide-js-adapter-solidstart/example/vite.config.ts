import { defineConfig } from "vite"
import solid from "solid-start/vite"
import nodeAdapter from "solid-start-node"
import { paraglide } from "@inlang/paraglide-js-adapter-vite"

export default defineConfig({
	plugins: [
		solid({ adapter: nodeAdapter() }),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
})
