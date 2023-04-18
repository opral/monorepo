import { createUnplugin } from "unplugin"

const srcFolder = process.cwd() + '/src'

// ------------------------------------------------------------------------------------------------

type FileType =
	| 'hooks.server.js'
	| '+layout.server.js'
	| '+layout.js'
	| '+layout.svelte'
	| '+page.server.js'
	| '+page.js'
	| '+page.svelte'
	| '.svelte'

type FileInformation = {
	type: FileType
	root: boolean
}

const getFileInformation = (id: string): FileInformation | undefined => {
	if (!id.startsWith(srcFolder)) return undefined

	const path = id.replace(srcFolder, '')

	if (path === '/server.hooks.js' || path === '/+server.hooks.ts') {
		return {
			type: 'hooks.server.js',
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
	if (path.endsWith('/+layout.svelte')) {
		return {
			type: '+layout.svelte',
			root: path.endsWith('/routes/+layout.svelte'),
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
		case 'hooks.server.js': return transformHooksServerJs(code, root)
		case '+layout.server.js': return transformLayoutServerJs(code, root)
		case '+layout.js': return transformLayoutJs(code, root)
		case '+layout.svelte': return transformLayoutSvelte(code, root)
		case '+page.server.js': return transformPageServerJs(code, root)
		case '+page.js': return transformPageJs(code, root)
		case '+page.svelte': return transformPageSvelte(code, root)
		case '.svelte': return transformSvelte(code, root)
	}
}

const transformHooksServerJs = (code: string, root: boolean) => {
	return code
}

const transformLayoutServerJs = (code: string, root: boolean) => {
	return code
}

const transformLayoutJs = (code: string, root: boolean) => {
	return code
}

const transformLayoutSvelte = (code: string, root: boolean) => {
	if (!root) return transformSvelte(code, root)

	return code
}

const transformPageServerJs = (code: string, root: boolean) => {
	return code
}

const transformPageJs = (code: string, root: boolean) => {
	return code
}

const transformPageSvelte = (code: string, root: boolean) => {
	return transformSvelte(code, root)
}

const transformSvelte = (code: string, root: boolean) => {

	if (code.includes('create_ssr_component')) {
		console.log(1111111, code);

	}

	return code.replace('import { i } from "@inlang/sdk-js";', 'const i = (key) => key;')
}

// ------------------------------------------------------------------------------------------------

const unplugin = createUnplugin(() => {
	return {
		name: "inlang-sveltekit-adapter",
		buildStart() {
			// TODO: create files that need to be created
			// this.emitFile ???
		},
		transform(code, id) {
			const fileInformation = getFileInformation(id)
			if (fileInformation) {
				const log = false
				log && console.log('--- start ---')
				log && console.log(fileInformation)
				log && console.log('--- code ---')
				log && console.log(code)
				log && console.log('--- transform ---')

				const transformedCode = transformCode(code, fileInformation)
				log && console.log(transformedCode)
				log && console.log('--- end ---')

				return { code: transformedCode }
			}

			return null
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
