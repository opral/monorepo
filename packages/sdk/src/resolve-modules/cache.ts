import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { hash } from "@lix-js/client"
import { type Result, tryCatch } from "@inlang/result"

async function readModuleFromCache(
	moduleURI: string,
	projectPath: string,
	readFile: NodeishFilesystemSubset["readFile"]
): Promise<Result<string, Error>> {
	const moduleHash = await hash(moduleURI)
	const filePath = projectPath + `/cache/${moduleHash}.js`

	return await tryCatch(async () => await readFile(filePath, { encoding: "utf-8" }))
}

async function writeModuleToCache(
	moduleURI: string,
	moduleContent: string,
	projectPath: string,
	writeFile: NodeishFilesystemSubset["writeFile"]
): Promise<void> {
	const moduleHash = await hash(moduleURI)
	const filePath = projectPath + `/cache/${moduleHash}.js`
	await writeFile(filePath, moduleContent)
}

/**
 * Implements a "Network-First" caching strategy.
 */
export function withCache(
	moduleLoader: (uri: string) => Promise<string>,
	projectPath: string,
	nodeishFs: Pick<NodeishFilesystemSubset, "readFile" | "writeFile">
): (uri: string) => Promise<string> {
	return async (uri: string) => {
		const cachePromise = readModuleFromCache(uri, projectPath, nodeishFs.readFile)
		const networkResult = await tryCatch(async () => await moduleLoader(uri))

		if (networkResult.error) {
			const cacheResult = await cachePromise
			if (!cacheResult.error) return cacheResult.data
			else throw networkResult.error
		} else {
			const moduleAsText = networkResult.data
			await writeModuleToCache(uri, moduleAsText, projectPath, nodeishFs.writeFile)
			return moduleAsText
		}
	}
}
