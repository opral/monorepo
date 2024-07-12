import dedent from "dedent"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { ModuleImportError } from "./errors.js"
import { withCache, withReadOnlyCache } from "./cache.js"
import { tryCatch } from "@inlang/result"

/**
 * Importing ES modules either from a local path, or from a url.
 *
 * - Name the import function `_import` to avoid shadowing the
 *   native import function.
 */
export type ImportFunction = (uri: string) => Promise<any>

export function createCDNImportWithWriteCache(
	projectPath: string,
	nodeishFs: Pick<NodeishFilesystemSubset, "readFile" | "writeFile" | "mkdir">
): ImportFunction {
	return async (uri: string) => {
		if (!uri.startsWith("http"))
			throw new ModuleImportError({ module: uri, cause: new Error("Malformed URL") })
		const moduleAsText = await withCache(readModuleFromCDN, projectPath, nodeishFs)(uri)
		return await moduleFromText(moduleAsText, uri)
	}
}

export function createCDNImportWithReadOnlyCache(
	projectPath: string,
	nodeishFs: Pick<NodeishFilesystemSubset, "readFile">
): ImportFunction {
	return async (uri: string) => {
		if (!uri.startsWith("http"))
			throw new ModuleImportError({ module: uri, cause: new Error("Malformed URL") })
		const moduleAsText = await withReadOnlyCache(readModuleFromCDN, projectPath, nodeishFs)(uri)
		return await moduleFromText(moduleAsText, uri)
	}
}

export function createDiskImport({
	readFile,
}: Pick<NodeishFilesystemSubset, "readFile">): ImportFunction {
	return async (uri: string) => {
		let moduleAsText: string
		try {
			moduleAsText = await readFile(uri, { encoding: "utf-8" })
		} catch (error) {
			throw new ModuleImportError({ module: uri, cause: error as Error })
		}

		return await moduleFromText(moduleAsText, uri)
	}
}

async function moduleFromText(content: string, uri: string) {
	const moduleWithMimeType = "data:application/javascript," + encodeURIComponent(content)

	try {
		return await import(/* @vite-ignore */ moduleWithMimeType)
	} catch (error) {
		if (error instanceof SyntaxError && uri.includes("jsdelivr")) {
			error.message += dedent`\n\n
				Are you sure that the file exists on JSDelivr?

				The error indicates that the imported file does not exist on JSDelivr. For non-existent files, JSDelivr returns a 404 text that JS cannot parse as a module and throws a SyntaxError.`
		}
		throw new ModuleImportError({ module: uri, cause: error as Error })
	}
}

/**
 * Reads a module from a CDN.
 * Tries to read local cache first.
 *
 * @param uri A valid URL
 * @throws {ModuleImportError}
 */
async function readModuleFromCDN(uri: string): Promise<string> {
	if (!isValidUrl(uri))
		throw new ModuleImportError({ module: uri, cause: new Error("Malformed URL") })

	const result = await tryCatch(async () => await fetch(uri))
	if (result.error) {
		throw new ModuleImportError({
			module: uri,
			cause: result.error,
		})
	}

	const response = result.data
	if (!response.ok) {
		throw new ModuleImportError({
			module: uri,
			cause: new Error(
				`Failed to fetch module. HTTP status: ${response.status}, Message: ${response.statusText}`
			),
		})
	}

	const JS_CONTENT_TYPES = [
		"application/javascript",
		"text/javascript",
		"application/x-javascript",
		"text/x-javascript",
		"text/plain", //TODO remove this - only for githubusercontent
	]

	// if there is no content-type header, assume it's a JavaScript module & hope for the best
	const contentType = response.headers.get("content-type")?.toLowerCase()
	if (contentType && !JS_CONTENT_TYPES.some((knownType) => contentType.includes(knownType))) {
		throw new ModuleImportError({
			module: uri,
			cause: new Error(`Server responded with ${contentType} insetad of a JavaScript module`),
		})
	}

	return await response.text()
}

function isValidUrl(url: string) {
	// This dance is necessary to both support a fallback in case URL.canParse
	// is not present (like in vitest), and also appease typescript
	const URLConstructor = URL
	if ("canParse" in URL) {
		return URL.canParse(url)
	}

	try {
		new URLConstructor(url)
		return true
	} catch (e) {
		console.warn(`Invalid URL: ${url}`)
		return false
	}
}
