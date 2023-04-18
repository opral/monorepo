export const preprocessor = {
	async markup({ content }: any) {
		const includesSdkImport = content.includes('@inlang/sdk-js')
		if (!includesSdkImport) return { code: content }

		const transformedCode = content
			.replace(/^.*import.*@inlang\/sdk-js.*$/m, `
import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
const { i } = getRuntimeFromContext()
`).replace(/i\(/g, '$i(')

		return { code: transformedCode }
	},
}