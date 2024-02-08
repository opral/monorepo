import * as runtime from "@/paraglide/runtime.js"

export const i18n = createI18n(runtime)

function createI18n(runtime: any) {
	return {
		method: () => {
			return runtime.sourceLanguageTag
		},
	}
}
