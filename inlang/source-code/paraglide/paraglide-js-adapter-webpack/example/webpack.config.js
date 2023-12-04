import path from "node:path"
import { fileURLToPath } from "node:url"
import { paraglide } from "@inlang/paraglide-js-adapter-webpack"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
	mode: "production",
	entry: "./src/main.js",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
	},
	resolve: {
		alias: {
			$paraglide: path.resolve(__dirname, "src/paraglide/"),
		},
	},

	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
}
