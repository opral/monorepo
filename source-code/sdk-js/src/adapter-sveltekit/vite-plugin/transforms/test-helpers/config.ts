import type { TransformConfig } from "../../config.js"

export const baseTestConfig: TransformConfig = {
	isStatic: false,
	languageInUrl: false,
	srcFolder: "",
	rootRoutesFolder: "",
	sourceFileName: "",
	sourceMapName: "",
	svelteKit: {
		usesTypeScript: false,
		version: undefined,
	}
}
