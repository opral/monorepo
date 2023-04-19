const REGEX_INLANG_SDK_IMPORT = /.*import\s*{\s*(.*)\s*}\s*from\s+['"]@inlang\/sdk-js['"]/g

const isReactive = true

export const preprocessor = {
	async markup({ content }: any) {
		let transformedCode: string = content

		let match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
		if (!match) return { code: transformedCode }

		// supports multiple imports
		// assumption: imports are always on top
		let lastTransform = 0

		// eslint-disable-next-line no-cond-assign
		while (match) {
			const replacement = (!lastTransform ? 'import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";\n' : '')
				+ 'const {' + match[1] + '} = getRuntimeFromContext();'

			transformedCode = transformedCode.slice(0, match.index)
				+ replacement
				+ transformedCode.slice(match.index + match[0].length)

			lastTransform = match.index + replacement.length
			match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
		}

		if (isReactive) {
			// replace with store syntax if reactive
			transformedCode = transformedCode.slice(0, lastTransform) + transformedCode.slice(lastTransform)
				.replace(/i\(/g, '$i(')
				.replace(/language[^s]/g, '$language')

		}

		return { code: transformedCode }
	},
}