import * as runtime from "@/paraglide/runtime.js"
import { Paraglide } from "./paraglide"

export const i18n = createI18n(runtime)

function createI18n<T extends string>(runtime: Paraglide<T>) {
	return {
		method: () => {
			return runtime.sourceLanguageTag
		},
	}
}
