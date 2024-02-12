import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = resolve(fileURLToPath(import.meta.url))
const __dirname = dirname(__filename)

export default {
	test: {
		alias: {
			"$paraglide/runtime.js": resolve(__dirname, "./mocks/runtime.js"),
		},
	},
}
