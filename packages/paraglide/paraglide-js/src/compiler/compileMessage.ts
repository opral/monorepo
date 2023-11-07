import type { LanguageTag, Message } from "@inlang/sdk"
import { compilePattern } from "./compilePattern.js"
import { paramsType, type Params } from "./paramsType.js"

export const compileMessage = (message: Message): string => {
	// choosing a regex for valid JS variable names is too long.
	// (because JS allows almost any function or variable names).
	if (message.id.includes("-")) {
		throw new Error(
			`Message id must not contain dashes because dashes are not a valid JS variable or function name: "${message.id}"`
		)
	}

	const contents: Record<LanguageTag, string> = {}
	// parameter names and TypeScript types
	// only allowing types that JS transpiles to strings under the hood like string and number.
	// the pattern nodes must be extended to hold type information in the future.
	let params: Params = {}
	for (const variant of message.variants) {
		if (contents[variant.languageTag]) {
			throw new Error(`Duplicate language tag: ${variant.languageTag}`)
		}
		const { compiled, params: variantParams } = compilePattern(variant.pattern)
		// merge params
		params = { ...params, ...variantParams }
		// set the pattern for the language tag
		contents[variant.languageTag] = compiled
	}

	return `
/**
 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
 *
 * - Don't edit the message manually. Use the [inlang ide extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
 *   or the [web editor](https://inlang.com/m/tdozzpar/app-inlang-editor) to edit the message.
 * 
 * - The params are NonNullable<unknown> because inlang can't know the value type of a param (yet).
 * 
 * ${paramsType(params)}
 * @returns {string}
 */
  export const ${message.id} = (${Object.keys(params).length > 0 ? "params" : ""}) => {
    const variants = {
      ${Object.entries(contents)
				.map(
					([languageTag, templateLiteralPattern]) => `"${languageTag}": ${templateLiteralPattern}`
				)
				.join(",\n  ")}
	}
	return variants[languageTag()] ?? "${message.id}"
}`
}
