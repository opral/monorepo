import type { TransformConfig } from '../config.js'

const REGEX_INLANG_SDK_IMPORT = /.*import\s*{\s*(.*)\s*}\s*from\s+['"]@inlang\/sdk-js['"]/g

// TODO: fix this soon !!
// supports multiple imports
// assumption: imports are always on top of the file
// no other variable can be named `i` or `language`
// no other code snippet can contain `i(`
// no other code snippet can contain `language`
export const transformSvelte = (config: TransformConfig, code: string): string => {
	let transformedCode: string = code

	let match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
	if (!match) return transformedCode

	let lastTransform = 0

	const imports = config.languageInUrl
		? `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";`
		: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`

	while (match) {
		const replacement =
			(!lastTransform ? imports : "") + "const {" + match[1] + "} = getRuntimeFromContext();"

		transformedCode =
			transformedCode.slice(0, match.index) +
			replacement +
			transformedCode.slice(match.index + match[0].length)

		lastTransform = match.index + replacement.length
		match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
	}

	if (!config.languageInUrl) {
		// replace with store syntax if reactive
		transformedCode =
			transformedCode.slice(0, lastTransform) +
			transformedCode
				.slice(lastTransform)
				.replace(/i\(/g, "$i(")
				.replace(/language[^s]/g, "$language")
	}

	return transformedCode
}
