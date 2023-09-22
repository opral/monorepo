/**
 * ! THIS FILE EXISTS FOR TESTING PURPOSES OF THE RUNTIME.
 */

import { languageTag } from "./runtime.js"

export const onlyText = () => {
	const contents = {
		en: "A simple message.",
		de: "Eine einfache Nachricht.",
	}
	return contents[languageTag()] ?? "onlyText"
}

export const oneParam = /** @param {{ name: NonNullable<unknown> }} params */ (params) => {
	const contents = {
		en: `Good morning ${params.name}!`,
		de: `Guten Morgen ${params.name}!`,
	}
	return contents[languageTag()] ?? "oneParam"
}

export const multipleParams =
	/** @param {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} params */ (params) => {
		const contents = {
			en: `Hello ${params.name}! You have ${params.count} messages.`,
			de: `Hallo ${params.name}! Du hast ${params.count} Nachrichten.`,
		}
		return contents[languageTag()] ?? "multipleParams"
	}
