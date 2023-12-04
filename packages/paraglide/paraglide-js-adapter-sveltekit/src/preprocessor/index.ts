import { parse, type PreprocessorGroup } from "svelte/compiler"
import MagicString from "magic-string"
import { InjectHeader } from "./passes/injectHeader.js"
import { RewriteHrefs } from "./passes/rewriteHrefs.js"
import type { Ast } from "./types.js"
import { RewriteActions } from "./passes/rewriteActions.js"
import { RewriteFormActions } from "./passes/rewriteFormActions.js"

export type PreprocessorConfig = {}

type MarkupPreprocessorArgs = {
	filename: string
	content: string
}

export type PreprocessingPass = {
	/**
	 * A quick and cheap check to see if this pass should be applied.
	 * This is used to avoid parsing the file if it's not necessary.
	 */
	condition: (data: MarkupPreprocessorArgs) => boolean

	/**
	 * Applies the pass to the file.
	 * Should only be called if `condition` returned true, since it may assume that.
	 *
	 * @param ast 	The AST of the file.
	 * @param code 	The code of the file. Modify this directly.
	 * @returns A list of imports that should be injected into the file.
	 */
	apply: (data: { ast: Ast; code: MagicString; originalCode: string }) => {
		imports: string[]
	}
}

const PASSES: PreprocessingPass[] = [RewriteHrefs, RewriteActions, RewriteFormActions, InjectHeader]
export function preprocess(config: PreprocessorConfig): PreprocessorGroup {
	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		markup: ({ filename, content }) => {
			const NOOP = { code: content }

			//I dont' know when this would happen, but it's better to be safe than sorry
			if (!filename) return NOOP

			//dont' process components owned by the framework
			if (filename.includes(".svelte-kit")) return NOOP

			//Run quick checks to see if any passes should be applied - skip parsing if not

			/** A boolean mask describing which passes passed and which didn't */
			const passMask = PASSES.map((pass) => pass.condition({ filename, content }))
			const skipProcessing = passMask.every((pass) => pass === false)
			if (skipProcessing) return NOOP

			//Parse the file
			const ast = parse(content)
			const code = new MagicString(content)

			//Apply the passes whose conditions returned true (be as lazy as possible)
			const imports = new Set<string>()
			for (let i = 0; i < passMask.length; i++) {
				if (!passMask[i]) continue

				const passResult = PASSES[i]!.apply({ ast, code, originalCode: content })
				passResult.imports.forEach((importStatement) => imports.add(importStatement))
			}

			//Inject any imports that were added by the passes
			injectImports(ast, code, imports)

			//Generate the code and map
			const map = code.generateMap({ hires: true })
			return { code: code.toString(), map }
		},
	}
}

function injectImports(ast: Ast, code: MagicString, importStatements: Iterable<string>) {
	const importStatementsArray: string[] = Array.isArray(importStatements)
		? importStatements
		: Array.from(importStatements)

	if (!ast.instance) {
		code.prepend("<script>\n" + importStatementsArray.join("\n") + "\n</script>\n")
	} else {
		//@ts-ignore
		const scriptStart = ast.instance.content.start as number
		code.appendLeft(scriptStart, "\n" + importStatementsArray.join("\n") + "\n")
	}
}
