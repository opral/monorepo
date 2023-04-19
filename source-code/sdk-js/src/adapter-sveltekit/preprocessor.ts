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
	if (root) {
		const imports = config.isSPA
			? `import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"`
			: `import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"`

		const initCode = config.isSPA
			? `
	$: if (browser && $language) {
		document.body.parentElement?.setAttribute("lang", $language)
		// TODO: only if localStorageDetector
		localStorage.setItem(localStorageKey, $language)
	}
` : `
	$: {
		addRuntimeToContext(getRuntimeFromData(data))
		;({ i, language } = getRuntimeFromContext())
	}
`

		const template = config.isSPA
			? `
{#if $language}
	<slot />
{/if}
` : `
{#key language}
	<slot />
{/key}
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

	return transformSvelte(code)
}

const transformPageSvelte = (code: string, root: boolean) => {
	return transformSvelte(code)
}

// TODO: fix this soon !!
// supports multiple imports
// assumption: imports are always on top of the file
// no other variable can be named `i` or `language`
// no other code snippet can contain `i(`
// no other code snippet can contain `language`
const transformSvelte = (code: string): string => {
	let transformedCode: string = code

	let match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
	if (!match) return transformedCode

	let lastTransform = 0

	const imports = config.isSPA
		? `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`
		: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";`

	while (match) {
		const replacement = (!lastTransform ? imports : '')
			+ 'const {' + match[1] + '} = getRuntimeFromContext();'

		transformedCode = transformedCode.slice(0, match.index)
			+ replacement
			+ transformedCode.slice(match.index + match[0].length)

		lastTransform = match.index + replacement.length
		match = REGEX_INLANG_SDK_IMPORT.exec(transformedCode)
	}

	if (config.isSPA) {
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