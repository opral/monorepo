import type { ProjectSettings } from "@inlang/sdk";

/**
 * Default project settings for createNewProject
 * from paraglide-js/src/cli/commands/init/defaults.ts
 */
const defaultProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	baseLocale: "en",
	locales: ["en"],
	modules: [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@3/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@1/dist/index.js",
	],
	"plugin.inlang.messageFormat": {
		pathPattern: "./messages/{locale}.json",
	},
} satisfies ProjectSettings;

/**
 * @returns A new copy of the default project template that is safe to mutate.
 */
export function getNewProjectTemplate() {
	if (!("structuredClone" in globalThis)) {
		try {
			return JSON.parse(
				JSON.stringify(defaultProjectSettings)
			) as typeof defaultProjectSettings;
		} catch {
			throw new Error(
				"structuredClone is not supported in your Node Version. Please use version 17 or higher"
			);
		}
	}
	return structuredClone(defaultProjectSettings);
}

export const DEFAULT_PROJECT_PATH = "./project.inlang";
export const DEFAULT_OUTDIR = "./src/paraglide";
