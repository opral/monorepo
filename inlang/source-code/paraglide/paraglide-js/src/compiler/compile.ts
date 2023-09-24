import type { Message, ProjectSettings } from "@inlang/sdk"
import { compileMessage } from "./compileMessage.js"
import dedent from "dedent"

/**
 * Compiles an inlang project into the importable paraglide-js library.
 */
export const compile = (args: {
	messages: Message[]
	settings: ProjectSettings
}): {
	"index.js": string
	"messages.js": string
	"runtime.js": string
} => {
	const compiledMessages = args.messages.map(compileMessage).join("\n\n")

	return {
		"index.js": `export * from "./runtime.js"`,
		"messages.js": dedent`
import { languageTag } from "./runtime.js"

${compiledMessages}
`,
		"runtime.js": dedent`

/**
 * The project's source language tag.
 */
export const sourceLanguageTag = "${args.settings.sourceLanguageTag}"

/**
 * The project's language tags.
 */
export const languageTags = /** @type {const} */ (${JSON.stringify(args.settings.languageTags)})

/**
 * @type {typeof languageTags[number]}
 */
let _currentLanguageTag = sourceLanguageTag

/**
 * The currently set language tag.
 */
export const languageTag = () => {
	return _currentLanguageTag
}

/**
 * Set the language tag.
 *
 * @param {typeof languageTags[number]} tag
 */
export const setLanguageTag = (tag) => {
	_currentLanguageTag = tag
}
`,
	}
}
