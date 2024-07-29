import { ModuleImportError } from "./resolve-modules/errors.js"
import type { InlangPlugin } from "./types/module.js"

/**
 * @throws {ModuleImportError}
 */
type Importer = (uri: string) => Promise<InlangPlugin>

export function createDebugImport(importMap: Record<string, InlangPlugin["default"]>): Importer {
	return async (uri) => {
		const resolved = importMap[uri]
		if (resolved) return { default: resolved }
		throw new ModuleImportError({
			module: uri,
			cause: new Error("Not found"),
		})
	}
}

/**
 * Use multiple import function in sequence
 */
export function importSequence(...importers: Importer[]): Importer {
	return async (uri) => {
		let lastError: ModuleImportError | undefined = undefined
		for (const importer of importers) {
			try {
				return await importer(uri)
			} catch (error) {
				if (error instanceof ModuleImportError) {
					lastError = error
					continue
				}
				throw error
			}
		}

		if (lastError) throw lastError
		throw new ModuleImportError({
			module: uri,
			cause: new Error("Not found"),
		})
	}
}
