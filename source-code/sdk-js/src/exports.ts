import type { InlangFunction } from "./runtime/inlang-function.js"
import type { Runtime } from "./runtime/runtime.js"
import type { RelativeUrl } from "./types.js"
import { InlangException } from "./exceptions.js"
import type { BCP47LanguageTag } from '@inlang/core/languageTag'

const error = new InlangException(
	"You need to use the Inlang plugin to be able to use those imports. See https://inlang.com/documentation/sdk/overview",
)

export const referenceLanguage: BCP47LanguageTag = error as any

export const languages: BCP47LanguageTag[] = [error] as any

export const language: BCP47LanguageTag = error as any

export const i: InlangFunction = () => {
	throw error
}

export const switchLanguage: (language: BCP47LanguageTag) => Promise<void> = () => {
	throw error
}

export const loadResource: Runtime["loadResource"] = () => {
	throw error
}

export const route: (href: RelativeUrl) => RelativeUrl = () => {
	throw error
}
