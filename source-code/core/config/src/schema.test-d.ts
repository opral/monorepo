import { InlangConfig } from "./schema.js"
import { expectType } from "tsd"

const exampleConfig: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["de", "en"],
	modules: ["https://hello.com/x.js", "https://hello.com/y.js"],
	plugins: {
		"inlang.i18next": {
			options: {
				ignore: ["inlang", "globalization"],
			},
		},
	},
	lint: {
		rules: {
			"inlang.missing-language": {
				level: "off",
			},
		},
	},
}

expectType<InlangConfig>(exampleConfig)

// the zod schema must be identical to the types
expectType<InlangConfig>(InlangConfig.parse({} as any))
