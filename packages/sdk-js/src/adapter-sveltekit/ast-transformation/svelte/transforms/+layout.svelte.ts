import type { TransformConfig } from '../../config.js'
import { transformSvelte } from './*.svelte.js'

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

// TODO: transform
export const wrapRootLayoutSvelte = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error('currently not supported')
}

// ------------------------------------------------------------------------------------------------

const transformGenericLayoutSvelte = transformSvelte