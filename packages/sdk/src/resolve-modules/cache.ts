import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { type Result, tryCatch } from "@inlang/result"

/**
 * Hashes a module URI to only include characters that can be used in filenames.
 * @param moduleURI A JSDelivr URI
 */
async function cacheModuleUri(moduleURI: string) {
	const buffer = toArrayBuffer(moduleURI)
	const hash_bytes = await crypto.subtle.digest("SHA-1", buffer)
	return [...new Uint8Array(hash_bytes)].map((x) => x.toString(16).padStart(2, "0")).join("")
}

function toArrayBuffer(str: string) {
	const buf = new ArrayBuffer(str.length)
	const bufView = new Uint8Array(buf)
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i)
	}
	return buf
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

export function withCache(
	moduleLoader: (uri: string) => Promise<string>,
	projectPath: string,
	nodeishFs: Pick<NodeishFilesystemSubset, "readFile" | "writeFile">
): (uri: string) => Promise<string> {
	return async (uri: string) => {
		const result = await readModuleFromCache(uri, projectPath, nodeishFs.readFile)
		if (!result.error) return result.data
		else console.error(result.error)

		const moduleAsText = await moduleLoader(uri)
		await writeModuleToCache(uri, moduleAsText, projectPath, nodeishFs.writeFile)
		return moduleAsText
	}
}
