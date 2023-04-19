import { writeFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { createUnplugin, UnpluginBuildContext } from "unplugin"
import { doesPathExist, getConfig } from './config.js'

const config = await getConfig()

// ------------------------------------------------------------------------------------------------

type FileType =
	| 'hooks.server.js'
	| '[language].json'
	| '+layout.server.js'
	| '+layout.js'
	| '+page.server.js'
	| '+page.js'

type FileInformation = {
	type: FileType
	root: boolean
}

const getFileInformation = (id: string): FileInformation | undefined => {
	if (!id.startsWith(config.srcFolder)) return undefined

	const path = id.replace(config.srcFolder, '')

	if (path === '/hooks.server.js' || path === '/hooks.server.ts') {
		return {
			type: 'hooks.server.js',
			root: true,
		}
	}

	if (path === '/routes/inlang/[language].json/+server.js' || path === '/routes/inlang/[language].json/+server.ts') {
		return {
			type: '[language].json',
			root: true,
		}
	}

	if (path.endsWith('/+layout.server.js') || path.endsWith('/+layout.server.ts')) {
		return {
			type: '+layout.server.js',
			root: path.endsWith('/routes/+layout.server.js') || path.endsWith('/routes/+layout.server.ts'),
		}
	}
	if (path.endsWith('/+layout.js') || path.endsWith('/+layout.ts')) {
		return {
			type: '+layout.js',
			root: path.endsWith('/routes/+layout.js') || path.endsWith('/routes/+layout.ts'),
		}
	}

	if (path.endsWith('/+page.server.js') || path.endsWith('/+page.server.ts')) {
		return {
			type: '+page.server.js',
			root: path.endsWith('/routes/+page.server.js') || path.endsWith('/routes/+page.server.ts'),
		}
	}
	if (path.endsWith('/+page.js') || path.endsWith('/+page.ts')) {
		return {
			type: '+page.js',
			root: path.endsWith('/routes/+page.js') || path.endsWith('/routes/+page.ts'),
		}
	}

	return undefined
}

// ------------------------------------------------------------------------------------------------

// TODO: throw errors if something is not supported and show a guide how to add the functionality manually
// TODO: move .svelte transform to preprocessor

const transformCode = (code: string, { type, root }: FileInformation) => {
	switch (type) {
		case 'hooks.server.js': return transformHooksServerJs(code)
		case '[language].json': return transformLanguageJson(code)
		case '+layout.server.js': return transformLayoutServerJs(code, root)
		case '+layout.js': return transformLayoutJs(code, root)
		case '+page.server.js': return transformPageServerJs(code, root)
		case '+page.js': return transformPageJs(code, root)
	}
}

const transformHooksServerJs = (code: string) => {
	if (!code) return `
import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = initHandleWrapper({
	getLanguage: () => undefined,
}).wrap(async ({ event, resolve }) => resolve(event))
`

	return code
}

const transformLanguageJson = (code: string) => {
	if (!code) return `
import { json } from "@sveltejs/kit"
import { getResource } from "@inlang/sdk-js/adapter-sveltekit/server"

export const GET = (({ params: { language } }) =>
	json(getResource(language) || null))
`

	return code
}

const transformLayoutServerJs = (code: string, root: boolean) => {
	if (root && !code) return `
import { initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const load = initRootServerLayoutLoadWrapper().wrap(() => { })
`

	return code
}

const transformLayoutJs = (code: string, root: boolean) => {
	if (root && !code) return `
import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

export const load = initRootLayoutLoadWrapper({
	initDetectors: browser
		? () => [initLocalStorageDetector(localStorageKey), navigatorDetector]
		: undefined,
}).wrap(async () => { })
`

	return code
}

const transformPageServerJs = (code: string, root: boolean) => {
	return code
}

const transformPageJs = (code: string, root: boolean) => {
	return code
}

// ------------------------------------------------------------------------------------------------

const createFilesIfNotPresent = async (that: UnpluginBuildContext, ...files: string[]) => {
	// eslint-disable-next-line no-async-promise-executor
	return Promise.all(files.map(file => new Promise<void>((async (resolve) => {

		const path = config.srcFolder + file

		await mkdir(dirname(path), { recursive: true }).catch(() => undefined)

		if (!(await doesPathExist(path))) {
			await writeFile(path, '')
		}

		// TODO: check why this does not work
		that.addWatchFile(path)

		resolve()
	}))))
}

// ------------------------------------------------------------------------------------------------

const unplugin = createUnplugin(() => {
	return {
		name: "inlang-sveltekit-adapter",
		async buildStart() {
			await createFilesIfNotPresent(this,
				'/hooks.server.js',
				'/routes/inlang/[language].json/+server.js',
				'/routes/+layout.server.js',
				'/routes/+layout.js',
				'/routes/+layout.svelte',
			)
		},
		transform(code, id) {
			const fileInformation = getFileInformation(id)
			// eslint-disable-next-line unicorn/no-null
			if (!fileInformation) return null

			return { code: transformCode(code, fileInformation) }
		},
		/*
			this is how we could potentially transform our js files.

			Recast mentioned here, by rich harris: https://github.com/Rich-Harris/magic-string#magic-string

			async transform(code, id) {
				if (id !== "our file id we want to transform") return
				const ast = recast.parse(code)
				// ast transformations
				// This is the ast for the function import
				const functionImportAst = {}
				const astWithImport = await insertAst(ast, functionImportAst, { before: ["body", "0"] })
				const finalAst = await wrapVariableDeclaration(astWithImport, "load", "wrapFn")
				const recastPrint = recast.print()
				// proceed with the transformation...
				return {
					code: recastPrint.code,
					ast: finalAst,
					map: recastPrint.map,
				}
			},
		*/
	}
})

export const vitePlugin = unplugin.vite
export const rollupPlugin = unplugin.rollup
