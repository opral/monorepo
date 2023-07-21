import type { InlangFunction } from "./runtime/inlang-function.js"
import type { Runtime } from "./runtime/runtime.js"
import type { RelativeUrl } from "./types.js"
import { InlangException } from "./exceptions.js"
import type { LanguageTag } from '@inlang/core/languageTag'

const error = new InlangException(
	"You need to use the Inlang plugin to be able to use those imports. See https://inlang.com/documentation/sdk/overview",
)

export const sourceLanguageTag: LanguageTag = error as any

export const languageTags: LanguageTag[] = [error] as any

export const languageTag: LanguageTag = error as any

export const i: InlangFunction = () => {
	throw error
}

export const changeLanguageTag: (languageTag: LanguageTag) => Promise<void> = () => {
	throw error
}

export const loadResource: Runtime["loadResource"] = () => {
	throw error
}

export const route: (href: RelativeUrl) => RelativeUrl = () => {
	throw error
}

/** @deprecated Use `changeLanguageTag` instead. */
export const switchLanguage = changeLanguageTag
/** @deprecated Use `sourceLanguageTag` instead. */
export const referenceLanguage = sourceLanguageTag
/** @deprecated Use `languageTags` instead. */
export const languages = languageTags
/** @deprecated Use `languageTag` instead. */
export const language = languageTag
