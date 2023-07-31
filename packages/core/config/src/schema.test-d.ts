import { InlangConfig } from "./schema.js"
import { expectType } from "tsd"

const config: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["de", "en"],
	modules: ["https://hello.com/x.js", "https://hello.com/y.js"],
	settings: {
		plugins: {
			"inlang.i18next": {
				options: {},
			},
		},
		lintRules: {
			"inlang.missing-language": {
				level: "off",
			},
		},
	},
}

config.settings.plugins?.["inlang.i18next"]?.options

config.settings.lintRules?.["inlang.missing-language"]?.level

expectType<InlangConfig>(config)

// the zod schema must be identical to the types
expectType<InlangConfig>(InlangConfig.parse({} as any))
