import type { LanguageTag, Message } from "@inlang/sdk"
import { compilePattern } from "./compilePattern.js"
import { jsdocFromParams, type Params } from "./jsdocFromParams.js"

export const compileMessage = (message: Message): string => {
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
	const jsdoc = jsdocFromParams(params)

	return `
	//! Don't edit this message manually. 
	// 
	// This message has been compiled by inlang paraglide.
	// Use the inlang ide extension [0] or the web editor [1] instead.
	// 
	// [0] https://inlang.com/marketplace/app.inlang.ideExtension
	// [1] https://inlang.com/marketplace/app.inlang.editor
  export const ${message.id} = ${jsdoc} (${Object.keys(params).length > 0 ? "params" : ""}) => {
    const contents = {
      ${Object.entries(contents)
				.map(
					([languageTag, templateLiteralPattern]) => `"${languageTag}": ${templateLiteralPattern}`
				)
				.join(",\n  ")}
  }
  return contents[languageTag()] ?? "${message.id}"
}`
}
