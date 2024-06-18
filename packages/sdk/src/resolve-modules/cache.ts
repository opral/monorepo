import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { type Result, tryCatch } from "@inlang/result"

function escape(url: string) {
	// collect the bytes of the UTF-8 representation
	const bytes = new TextEncoder().encode(url)

	// 32-bit FNV1a hash to make the file-names shorter
	// https://en.wikipedia.org/wiki/FNV-1a
	const hash = bytes.reduce((hash, byte) => (hash * 0x01000193) ^ byte, 0x811c9dc5)

	const encoded = Math.abs(hash).toString(36).padStart(8, "0")
	return encoded
}

async function readModuleFromCache(
	moduleURI: string,
	projectPath: string,
	readFile: NodeishFilesystemSubset["readFile"]
): Promise<Result<string, Error>> {
	const moduleHash = escape(moduleURI)
	const filePath = projectPath + `/cache/modules/${moduleHash}`

	return await tryCatch(async () => await readFile(filePath, { encoding: "utf-8" }))
}

async function writeModuleToCache(
	moduleURI: string,
	moduleContent: string,
	projectPath: string,
	writeFile: NodeishFilesystemSubset["writeFile"]
): Promise<void> {
	const moduleHash = escape(moduleURI)
	const filePath = projectPath + `/cache/modules/${moduleHash}`
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
