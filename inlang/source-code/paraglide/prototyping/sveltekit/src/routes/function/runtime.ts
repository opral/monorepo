import { derived, writable } from "svelte/store"
import * as de from "./messages/de"
import * as en from "./messages/en"

export const sourceLanguageTag = "en"

const _currentLanguageTag = writable<string>(sourceLanguageTag)

export const currentLanguageTag = derived(_currentLanguageTag, ($tag) => $tag)

export const setCurrentLanguageTag = (tag: string) => {
	_currentLanguageTag.set(tag)
}

export const m = derived(currentLanguageTag, ($tag) => {
	return (id: string, params?: Record<string, any>) => {
		switch ($tag) {
			case "de":
				// @ts-ignore
				return de[id](params)
			case "en":
				// @ts-ignore
				return en[id](params)
			default:
				return `Unknown language tag ${currentLanguageTag}`
		}
		// @ts-ignore
		const res = messages[id](params)[$tag]
		return res
	}
})
