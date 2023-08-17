import fs from "node:fs/promises"

async function main() {
	const registry = JSON.parse(await fs.readFile("./registry.json", "utf-8"))

	for (let module of registry.modules) {
		if (module.includes("@latest") || !module.includes("jsdelivr")) continue
		registry.modules[registry.modules.indexOf(module)] = getLatestVersion(module)
	}

	const moduleItems = await getMetaData(registry.modules)

	const items = [...registry.apps, ...moduleItems]

	await fs.writeFile(
		"./src/registry.js",
		`export const registry = ${JSON.stringify(items, undefined, "\t")}`,
	)
}

await main()

/**
 * @param {string} path
 * @returns {string}
 * This function returns the string of the latest version of a module.
 */
function getLatestVersion(module) {
	return (
		module.slice(0, module.lastIndexOf("@")) +
		"@latest" +
		module.slice(module.indexOf("/", module.lastIndexOf("@")))
	)
}

/**
 * @param {string[]} modules
 * @returns {Promise<{id: string, displayName: {en: string}, description: {en: string}, keywords: string[]}[]>}
 * This function returns an array of objects with the metadata of each module.
 * The metadata is used to display the modules in the marketplace.
 */
async function getMetaData(modules) {
	const meta = []

	for (const module of modules) {
		const data = await import(module)
		const type = Object.keys(data.default)[0]

		for (const item of data.default[type]) {
			if (
				!item.meta.marketplace ||
				!item.meta.marketplace.keywords ||
				!item.meta.marketplace.icon ||
				!item.meta.marketplace.linkToReadme
			) {
				console.warn(`❗ Module ${item.meta.id} has no marketplace metadata.`)
				continue
			}
			meta.push(item.meta)
		}
	}

	return meta
}
