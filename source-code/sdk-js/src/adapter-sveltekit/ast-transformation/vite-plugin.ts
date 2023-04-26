import { writeFile, mkdir, readdir, rename } from "node:fs/promises"
import { dirname, join } from "node:path"
import { createUnplugin } from "unplugin"
import type { ViteDevServer } from "vite"
import { TransformConfig, getConfig, resetConfig } from './config.js'
import { doesPathExist } from './config.js'
import { transformCode } from './transforms/index.js'

type FileType =
	| "hooks.server.js"
	| "[language].json"
	| "+layout.server.js"
	| "+layout.js"
	| "+page.server.js"
	| "+page.js"
	| "*.js"
	| "+layout.svelte"
	| "+page.svelte"
	| "*.svelte"

export type FileInformation = {
	type: FileType
	root: boolean
}

const getFileInformation = (config: TransformConfig, id: string): FileInformation | undefined => {
	if (!id.startsWith(config.srcFolder)) return undefined

	const path = id.replace(config.srcFolder, "")

	const dir = dirname(path)
	const root = dir.endsWith('/routes')

	if (path === "/hooks.server.js" || path === "/hooks.server.ts") {
		return {
			type: "hooks.server.js",
			root: true,
		}
	}

	if (
		path === "/routes/inlang/[language].json/+server.js" ||
		path === "/routes/inlang/[language].json/+server.ts"
	) {
		return {
			type: "[language].json",
			root: true,
		}
	}

	if (path.endsWith("/+layout.server.js") || path.endsWith("/+layout.server.ts")) {
		return {
			type: "+layout.server.js",
			root,
		}
	}
	if (path.endsWith("/+layout.js") || path.endsWith("/+layout.ts")) {
		return {
			type: "+layout.js",
			root,
		}
	}
	if (path.endsWith("/+layout.svelte")) {
		return {
			type: "+layout.svelte",
			root,
		}
	}

	if (path.endsWith("/+page.server.js") || path.endsWith("/+page.server.ts")) {
		return {
			type: "+page.server.js",
			root,
		}
	}
	if (path.endsWith("/+page.js") || path.endsWith("/+page.ts")) {
		return {
			type: "+page.js",
			root,
		}
	}
	if (path.endsWith("/+page.svelte")) {
		return {
			type: "+page.svelte",
			root,
		}
	}

	if (path.endsWith(".js") || path.endsWith(".ts")) {
		return {
			type: "*.js",
			root: false,
		}
	}
	if (path.endsWith(".svelte")) {
		return {
			type: "*.svelte",
			root: false,
		}
	}

	return undefined
}

// ------------------------------------------------------------------------------------------------

const createFilesIfNotPresent = async (srcFolder: string, ...files: string[]) => {
	// eslint-disable-next-line no-async-promise-executor
	const results = await Promise.all(
		files.map(
			(file) =>
				// eslint-disable-next-line no-async-promise-executor
				new Promise<boolean>(async (resolve) => {
					const path = srcFolder + file

					await mkdir(dirname(path), { recursive: true }).catch(() => undefined)

					let wasCreated = false
					if (!(await doesPathExist(path))) {
						await writeFile(path, "")
						wasCreated = true
					}

					resolve(wasCreated)
				}),
		),
	)

	// returns true if a new file was created
	return results.some((result) => result)
}

const moveFiles = async (srcDir: string, destDir: string) =>
	Promise.all(
		(await readdir(srcDir)).map(async (file) => {
			const destFile = join(destDir, file)
			await mkdir(dirname(destFile), { recursive: true }).catch(() => undefined)
			await rename(join(srcDir, file), destFile)
		}),
	)

const moveExistingRoutesIntoSubfolder = async (config: TransformConfig) =>
	moveFiles(config.srcFolder + "/routes", config.rootRoutesFolder)

// ------------------------------------------------------------------------------------------------

let viteServer: ViteDevServer | undefined

export const unplugin = createUnplugin(() => {
	return {
		name: "inlang-sdk-js-sveltekit",
		enforce: 'pre',
		async buildStart() {
			const config = await getConfig()

			if (!config.hasAlreadyBeenInitialized) {
				// TODO: check if no git changes are inside the src folder. If there are changes then throw an error saying that the files should be committed before we make changes to them
				await moveExistingRoutesIntoSubfolder(config)
			}

			const hasCreatedANewFile = await createFilesIfNotPresent(config.srcFolder,
				'/hooks.server.js',
				'/routes/inlang/[language].json/+server.js',
				'/routes/+layout.server.js',
				'/routes/+layout.js',
				'/routes/+layout.svelte',
				...(config.isStatic && config.languageInUrl ? [
					'/routes/+page.js',
					'/routes/+page.svelte',
				] : [])
			)

			if (hasCreatedANewFile && viteServer) {
				resetConfig()
				viteServer.restart() // TODO: currently it is not possible to exit the process with CTRL + C
			}
		},

		async transform(code, id) {
			const config = await getConfig()

			const fileInformation = getFileInformation(config, id)
			// eslint-disable-next-line unicorn/no-null
			if (!fileInformation) return null

			return { code: transformCode(config, code, fileInformation) }
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
		},

		vite: {
			configureServer(server) {
				viteServer = server as unknown as ViteDevServer
			},
		},
	}
})
