import { defaultProjectSettings } from "@inlang/sdk"

/**
 * @returns A new copy of the default project template that is safe to mutate.
 */
export function getNewProjectTemplate() {
	if (!("structuredClone" in globalThis)) {
		try {
			return JSON.parse(JSON.stringify(defaultProjectSettings)) as typeof defaultProjectSettings
		} catch {
			throw new Error(
				"structuredClone is not supported in your Node Version. Please use version 17 or higher"
			)
		}
	}
	return structuredClone(defaultProjectSettings)
}

export const DEFAULT_PROJECT_PATH = "./project.inlang"
export const DEFAULT_OUTDIR = "./src/paraglide"
