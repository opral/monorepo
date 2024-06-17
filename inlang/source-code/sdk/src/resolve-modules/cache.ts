import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { type Result, tryCatch } from "@inlang/result"

function escape(url: string) {
	// collect the bytes of the UTF-8 representation & hex encode
	const bytes = new TextEncoder().encode(url)
	const escaped = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")
	return escaped
}

async function readModuleFromCache(
	moduleURI: string,
	projectPath: string,
	readFile: NodeishFilesystemSubset["readFile"]
): Promise<Result<string, Error>> {
	const moduleHash = escape(moduleURI)
	const filePath = projectPath + `/cache/${moduleHash}.js`

	return await tryCatch(async () => await readFile(filePath, { encoding: "utf-8" }))
}

async function writeModuleToCache(
	moduleURI: string,
	moduleContent: string,
	projectPath: string,
	writeFile: NodeishFilesystemSubset["writeFile"]
): Promise<void> {
	const moduleHash = escape(moduleURI)
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
