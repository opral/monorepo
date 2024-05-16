import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const __filename = resolve(fileURLToPath(import.meta.url))
const __dirname = dirname(__filename)

// eslint-disable-next-line no-undef
const BASE_PATH = process.env.BASE_PATH ?? ""

export default defineConfig(() => {
	return {
		plugins: [
			virtualModules({
				"$app/paths": getPathsModule({ base: BASE_PATH }),
				"$app/environment": getEnvironmentModule({ dev: false, browser: false }),
			}),
		],
		test: {
			alias: {
				"$paraglide/runtime.js": resolve(__dirname, "./mocks/runtime.js"),
			},
		},
	}
})

/**
 * @param {Record<string, string>} map
 */
function virtualModules(map) {
	return {
		name: "virtual-modules",
		resolveId(id) {
			if (id in map) {
				return id
			}
		},

		load(id) {
			if (id in map) {
				return map[id]
			}
		},
	}
}

/**
 *
 * @param {{base: "" | `/${string}`}} options
 */
function getPathsModule(options) {
	let code = ""
	for (const [key, value] of Object.entries(options)) {
		code += `export const ${key} = ${JSON.stringify(value)}\n`
	}
	return code
}

/**
 * @param {{dev: boolean, browser: boolean}} options
 */
function getEnvironmentModule(options) {
	let code = ""
	for (const [key, value] of Object.entries(options)) {
		code += `export const ${key} = ${JSON.stringify(value)}\n`
	}
	return code
}