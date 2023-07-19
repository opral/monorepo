import { deepmerge } from "deepmerge-ts"
import type { TransformConfig } from "../vite-plugin/config.js"

type DeepPartial<T> = T extends Record<PropertyKey, unknown>
	? {
			[Key in keyof T]?: DeepPartial<T[Key]>
	  }
	: T

export const initTransformConfig = (
	overrides: DeepPartial<TransformConfig> = {},
): TransformConfig =>
	deepmerge(
		{
			isStatic: false,
			languageInUrl: false,
			cwdFolderPath: "",
			rootRoutesFolder: "",
			sourceFileName: "",
			sourceMapName: "",
			inlang: {
				sourceLanguageTag: "en",
				languageTags: ["en", "de"],
				readResources: async () => [],
				writeResources: async () => undefined,
				sdk: {
					debug: false,
					languageNegotiation: {
						strict: false,
						strategies: [{ type: "localStorage", key: "language" }],
					},
					resources: {
						cache: "build-time",
					},
					routing: {
						exclude: [],
					},
				},
			},
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
