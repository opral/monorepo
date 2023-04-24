
import type { Config } from '../config.js'
import type { FileInformation } from './preprocessor.js'

// ------------------------------------------------------------------------------------------------

export const transformCode = (config: Config, code: string, { type, root }: FileInformation) => {
	switch (type) {
		case "+layout.svelte":
			return transformLayoutSvelte(config, code, root)
		case "+page.svelte":
			return transformPageSvelte(config, code, root)
		case ".svelte":
			return transformSvelte(config, code)
	}
}

// ------------------------------------------------------------------------------------------------

const transformLayoutSvelte = (config: Config, code: string, root: boolean) => {
	if (root) {
		const imports = config.languageInUrl
			? `import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"`
			: `import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"`

		const initCode = config.languageInUrl
			? `
		$: {
			addRuntimeToContext(getRuntimeFromData(data))
			;({ i, language } = getRuntimeFromContext())
		}
		` : `
$: if (browser && $language) {
	document.body.parentElement?.setAttribute("lang", $language)
	// TODO: only if localStorageDetector
	localStorage.setItem(localStorageKey, $language)
}
`

		const template = config.languageInUrl
			? `
{#key language}
	<slot />
{/key}
` : `
{#if $language}
	<slot />
{/if}
`

		return `
<script>
	import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	${imports}
	import { browser } from "$app/environment"

	export let data

	addRuntimeToContext(getRuntimeFromData(data))
	let { i, language } = getRuntimeFromContext()
	${initCode}
</script>
${template}
`
	}

	return transformSvelte(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformPageSvelte = (config: Config, code: string, root: boolean) => {
	return transformSvelte(config, code)
}

// ------------------------------------------------------------------------------------------------

const REGEX_INLANG_SDK_IMPORT = /.*import\s*{\s*(.*)\s*}\s*from\s+['"]@inlang\/sdk-js['"]/g

// TODO: fix this soon !!
// supports multiple imports
// assumption: imports are always on top of the file
// no other variable can be named `i` or `language`
// no other code snippet can contain `i(`
// no other code snippet can contain `language`
const transformSvelte = (config: Config, code: string): string => {
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
