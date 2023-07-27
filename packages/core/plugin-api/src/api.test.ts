import type { PluginApi, ResolvePlugins } from "./api.js"
import { expectType } from "tsd"

type PluginOptions = {
	pathPattern: string
}

type AppSpecificApi1 = {
	messageReferenceMatcher: () => void
}

type AppSpecificApi2 = {
	cliExtract: () => void
}

type AppSpecificApis = {
	"inlang.ide-extension": AppSpecificApi1
	"inlang.cli": AppSpecificApi2
}

const plugin1: PluginApi<PluginOptions, AppSpecificApis> = {
	meta: {
		id: "inlang.plugin-i18next",
		displayName: { en: "i18next" },
		description: { en: "i18next plugin for inlang" },
		keywords: ["i18next", "react", "nextjs"],
		usedApis: ["addLintRules", "loadMessages", "saveMessages", "addAppSpecificApi"],
	},
	setup: ({ options, config }) => {
		if (options.pathPattern === undefined) {
			throw Error("Path pattern is undefined")
		}
		return {
			loadMessages: async () => {
				for (const languageTag of config.languageTags) {
					console.log(languageTag + options.pathPattern)
				}
				return []
			},
			saveMessages: async ({ messages }) => {
				console.log(messages)
			},
			addAppSpecificApi: () => {
				return {
					"inlang.ide-extension": {
						messageReferenceMatcher: () => {},
					},
					"inlang.cli": {
						cliExtract: () => {},
					},
				}
			},
		}
	},
}

expectType<PluginApi<PluginOptions, AppSpecificApis>>(plugin1)

const resolvePlugins: ResolvePlugins = {} as any

const resolvedWithoutAppSpecific = await resolvePlugins({} as any)

expectType<{}>(resolvedWithoutAppSpecific.appSpecificApi)

const resolvedWithApps = await resolvePlugins<AppSpecificApis>({} as any)

expectType<AppSpecificApi1>(resolvedWithApps.appSpecificApi["inlang.ide-extension"])
expectType<AppSpecificApi2>(resolvedWithApps.appSpecificApi["inlang.cli"])
