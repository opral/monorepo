import type { TransformConfig } from "../config.js"
import { transformSvelte } from "./*.svelte.js"

export const transformLayoutSvelte = (config: TransformConfig, code: string, root: boolean) => {
	if (root) {
		return transformRootLayoutSvelte(config, code)
	}

	return transformGenericLayoutSvelte(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformRootLayoutSvelte = (config: TransformConfig, code: string) => {
	if (code) return wrapRootLayoutSvelte(config, code)

	return createRootLayoutSvelte(config)
}

export const createRootLayoutSvelte = (config: TransformConfig) => {
	const imports = config.languageInUrl
		? `import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"`
		: `import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"`

	const initCode = config.languageInUrl
		? `
$: {
	addRuntimeToContext(getRuntimeFromData(data))
	;({ i, language } = getRuntimeFromContext())
}
`
		: `
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
`
		: `
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

// TODO: transform
export const wrapRootLayoutSvelte = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error("currently not supported")
}

// ------------------------------------------------------------------------------------------------

const transformGenericLayoutSvelte = transformSvelte

// TODO @benjaminpreiss
// 1. Remove "export let data"
// 2. Insert imports
// 3. Remove all imports from "@inlang/sdk-js"
// 4. Insert "export let data;addRuntimeToContext(getRuntimeFromData(data));let { i, language } = getRuntimeFromContext();" immediately before either data, or any import from "@inlang/sdk-js" are referenced the first time
// 5. Also insert the initCode at exactly that position
// 6. Wrap the existing markup with template (Where <slot/> is the existing markup)
