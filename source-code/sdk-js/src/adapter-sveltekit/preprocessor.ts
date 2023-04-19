import { getConfig } from './config.js'

const REGEX_INLANG_SDK_IMPORT = /.*import\s*{\s*(.*)\s*}\s*from\s+['"]@inlang\/sdk-js['"]/g

const srcFolder = process.cwd() + '/src'

const config = await getConfig()

// ------------------------------------------------------------------------------------------------

type FileType =
	| '+layout.svelte'
	| '+page.svelte'
	| '.svelte'

type FileInformation = {
	type: FileType
	root: boolean
}

const getFileInformation = (id: string): FileInformation | undefined => {
	if (!id.startsWith(srcFolder)) return undefined

	const path = id.replace(srcFolder, '')

	if (path.endsWith('/+layout.svelte')) {
		return {
			type: '+layout.svelte',
			root: path.endsWith('/routes/+layout.svelte'),
		}
	}

	if (path.endsWith('/+page.svelte')) {
		return {
			type: '+page.svelte',
			root: path.endsWith('/routes/+page.svelte'),
		}
	}

	if (path.endsWith('.svelte')) {
		return {
			type: '.svelte',
			root: false,
		}
	}

	return undefined
}

// ------------------------------------------------------------------------------------------------

const transformCode = (code: string, { type, root }: FileInformation) => {
	switch (type) {
		case '+layout.svelte': return transformLayoutSvelte(code, root)
		case '+page.svelte': return transformPageSvelte(code, root)
		case '.svelte': return transformSvelte(code)
	}
}

const transformLayoutSvelte = (code: string, root: boolean) => {
	if (root) return `
<script lang="ts">
	import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
	import {	getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
	import { browser } from "$app/environment"

	export let data

	addRuntimeToContext(getRuntimeFromData(data))

	let { i, language } = getRuntimeFromContext()

	$: if (browser && $language) {
		document.body.parentElement?.setAttribute("lang", $language)

		localStorage.setItem(localStorageKey, $language)
	}
</script>

{#if $language}
	<slot />
{/if}
`

	return transformSvelte(code)
}

const transformPageSvelte = (code: string, root: boolean) => {
	return transformSvelte(code)
}

// supports multiple imports
// assumption: imports are always on top
const transformSvelte = (code: string): string => {
	let transformedCode: string = code

	let match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
	if (!match) return transformedCode

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

	if (config.isReactive) {
		// replace with store syntax if reactive
		transformedCode = transformedCode.slice(0, lastTransform) + transformedCode.slice(lastTransform)
			.replace(/i\(/g, '$i(')
			.replace(/language[^s]/g, '$language')
	}

	return transformedCode
}

// ------------------------------------------------------------------------------------------------

type PreprocessMarkupArgs = {
	content: string
	filename: string
}

export const preprocessor = {
	async markup({ content, filename }: PreprocessMarkupArgs) {
		const fileInformation = getFileInformation(filename)
		// eslint-disable-next-line unicorn/no-null
		if (!fileInformation) return null

		return { code: transformCode(content, fileInformation) }
	},
}