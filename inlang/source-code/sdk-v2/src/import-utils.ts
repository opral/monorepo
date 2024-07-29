import type { InlangPlugin } from "./types/plugin.js"
import { PluginImportError } from "./types/plugin-errors.js"

/**
 * @throws {PluginImportError}
 */
type Importer = (uri: string) => Promise<InlangPlugin>

export function createDebugImport(importMap: Record<string, InlangPlugin["default"]>): Importer {
	return async (uri) => {
		const resolved = importMap[uri]
		if (resolved) return { default: resolved }
		throw new PluginImportError({
			plugin: uri,
			cause: new Error("Not found"),
		})
	}
}

/**
 * Use multiple import function in sequence
 */
export function importSequence(...importers: Importer[]): Importer {
	return async (uri) => {
		let lastError: PluginImportError | undefined = undefined
		for (const importer of importers) {
			try {
				return await importer(uri)
			} catch (error) {
				if (error instanceof PluginImportError) {
					lastError = error
					continue
				}
				throw error
			}
		}

		if (lastError) throw lastError
		throw new PluginImportError({
			plugin: uri,
			cause: new Error("Not found"),
		})
	}
}
