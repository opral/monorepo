import { Plugin, ResolvePluginsFunction } from "./api.js"
import { expectType } from "tsd"

// the zod schema must be identical to the types
expectType<Plugin>(Plugin.parse({} as any))

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

const plugin1: Plugin<PluginOptions, AppSpecificApis> = {
	meta: {
		id: "inlang.plugin-i18next",
		displayName: { en: "i18next" },
		description: { en: "i18next plugin for inlang" },
		keywords: ["i18next", "react", "nextjs"],
	},
	setup: ({ options, config }) => {
		if (options.pathPattern === undefined) {
			throw Error("Path pattern is undefined")
		}
		if (config === undefined) {
			throw Error("Config is undefined")
		}
		return {}
	},

	loadMessages: async () => {
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

expectType<Plugin<PluginOptions, AppSpecificApis>>(plugin1)

const resolvePlugins: ResolvePluginsFunction = {} as any

const { data: resolvedWithoutAppSpecific, errors } = await resolvePlugins({} as any)

expectType<{}>(resolvedWithoutAppSpecific.appSpecificApi)

const { data: resolvedWithApps, errors: error2 } = await resolvePlugins<AppSpecificApis>({} as any)

expectType<AppSpecificApi1>(resolvedWithApps.appSpecificApi["inlang.ide-extension"])
expectType<AppSpecificApi2>(resolvedWithApps.appSpecificApi["inlang.cli"])
