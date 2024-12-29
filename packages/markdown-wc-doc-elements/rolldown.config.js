import { defineConfig } from "rolldown"
import fs from "node:fs/promises"
import path from "node:path"

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const files = await fs.readdir(path.join(__dirname, "src"))
const elements = files.filter((file) => file.startsWith("doc-") && file.endsWith(".ts"))

export default defineConfig(
	["index.ts", ...elements].map((element) => ({
		input: `src/${element}`,
		output: {
			file: `dist/${element.replace(".ts", ".js")}`,
			format: "esm",
			// minify is still in beta at the time of writing (Dec 29, 2024)
			// minify: true,
		},
	}))
)
