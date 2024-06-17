import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { type Result, tryCatch } from "@inlang/result"

/**
 * Hashes a module URI to only include characters that can be used in filenames.
 *
 * THIS FUNCTION ALWAYS FAILS IN TEST BECAUSE VITEST HAS A BUG
 * https://github.com/vitest-dev/vitest/issues/4043#issuecomment-1742028595
 *
 * @param moduleURI A JSDelivr URI
 */
async function cacheModuleUri(moduleURI: string) {
	if ("process" in globalThis && process?.env?.TEST === "true") {
		return moduleURI.replaceAll(/[^a-zA-Z0-9]/g, "")
	}
	const buffer = toArrayBuffer(moduleURI)

	const hash_bytes = await crypto.subtle.digest("SHA-1", buffer as ArrayBuffer)
	return [...new Uint8Array(hash_bytes)].map((x) => x.toString(16).padStart(2, "0")).join("")
}

function toArrayBuffer(str: string) {
	const bytes = new Uint8Array(str.length)
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bytes[i] = str.charCodeAt(i)
	}
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteLength + bytes.byteOffset)
}

async function readModuleFromCache(
	moduleURI: string,
	projectPath: string,
	readFile: NodeishFilesystemSubset["readFile"]
): Promise<Result<string, Error>> {
	const moduleHash = await cacheModuleUri(moduleURI)
	const filePath = projectPath + `/cache/${moduleHash}.js`

	return await tryCatch(async () => await readFile(filePath, { encoding: "utf-8" }))
}

async function writeModuleToCache(
	moduleURI: string,
	moduleContent: string,
	projectPath: string,
	writeFile: NodeishFilesystemSubset["writeFile"]
): Promise<void> {
	const moduleHash = await cacheModuleUri(moduleURI)
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
