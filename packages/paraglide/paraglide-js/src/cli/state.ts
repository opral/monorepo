import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

/**
 * The posix path this file is executed from.
 *
 * Usually something like '/Users/samuel/example/repository/node_modules/paraglide-js/dist/cli/main.js'
 */
const currentFilePath = fileURLToPath(import.meta.url)
	.split(path.sep)
	.join(path.posix.sep)

/**
 * The absolute path to the paraglide directory.
 *
 * slices a path
 * from '/Users/samuel/example/repository/node_modules/paraglide-js/dist/cli/main.js'
 * to   '/Users/samuel/example/repository/node_modules/paraglide-js'
 */
export let paraglideDirectory: string = currentFilePath.slice(
	0,
	currentFilePath.indexOf("/paraglide-js/") + "/paraglide-js".length
)

// this is only used for testing
// use cmd + f to find all usages
export const _setStateForTest = (values: Record<"paraglideDirectory", any>) => {
	paraglideDirectory = values.paraglideDirectory
}

/**
 * The version of the paraglide-js package.
 */
export const version = JSON.parse(
	fs.readFileSync(`${paraglideDirectory}/package.json`, "utf-8")
).version
