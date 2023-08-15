import { deepmerge } from "deepmerge-ts"
import type { TransformConfig } from "../vite-plugin/inlang-app.js"

type DeepPartial<T> = T extends Record<PropertyKey, unknown>
	? {
	[Key in keyof T]?: DeepPartial<T[Key]>
}
	: T

export const initTestApp = (
	overrides: DeepPartial<TransformConfig> = {},
): TransformConfig =>
	deepmerge(
		{
			debug: false,
			isStatic: false,
			languageInUrl: false,
			cwdFolderPath: "",
			rootRoutesFolder: "",
			settings: {
				debug: false,
				languageNegotiation: {
					strict: false,
					strategies: [{ type: "localStorage", key: "languageTag" }],
				},
				resources: {
					cache: "build-time",
				},
				routing: {
					exclude: [],
				},
			},
			// TODO:
			inlang: {
				config: () => ({
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
					modules: [],
					settings: {},
				}),

				readResources: async () => [],
				writeResources: async () => undefined,
			} as any,
			svelteKit: {
				usesTypeScript: false,
				version: undefined,
				files: {
					appTemplate: "src/app.html",
					routes: "src/routes",
					serverHooks: "src/hooks.server",
				},
			},
		} satisfies TransformConfig,
		overrides as any,
	)
