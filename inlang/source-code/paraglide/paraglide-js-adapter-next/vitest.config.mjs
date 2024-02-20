import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"

const __filename = resolve(fileURLToPath(import.meta.url))
const __dirname = dirname(__filename)

export default {
	plugins: [react()],
	test: {
		environment: "jsdom",
		alias: {
			"$paraglide/runtime.js": resolve(__dirname, "./mocks/runtime.js"),
		},
	},
}
