import { createUnplugin } from "unplugin"

const unplugin = createUnplugin(() => {
	return {
		name: "inlang-sveltekit-adapter",
		buildStart() {
			console.log("Here comes some inlang magic")
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
