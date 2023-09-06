import { deepmerge } from "deepmerge-ts"
import type { VirtualModule } from "../vite-plugin/config/index.js"

type DeepPartial<T> = T extends Record<PropertyKey, unknown>
	? {
			[Key in keyof T]?: DeepPartial<T[Key]>
	  }
	: T

export const initTestApp = (overrides: DeepPartial<VirtualModule> = {}): VirtualModule =>
	deepmerge(
		{
			debug: false,

			sourceLanguageTag: "en",
			languageTags: ["en"],
			messages: [],

			cwdFolderPath: "",
			options: {
				rootRoutesFolder: "",
				isStatic: false,
				languageInUrl: false,
				resourcesCache: "build-time",
				excludedRoutes: [],
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
		} satisfies VirtualModule,
		overrides as any,
	)
