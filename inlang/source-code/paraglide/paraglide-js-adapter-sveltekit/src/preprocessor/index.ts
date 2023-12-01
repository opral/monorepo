import { parse } from "svelte/compiler"
import MagicString from "magic-string"
import {
	HEADER_COMPONENT_MODULE_ID,
	LANGUAGE_TAG_ALIAS,
	OUTDIR_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"
import { InjectHeader } from "./injectHeader.js"
import { RewriteHrefs } from "./rewriteHrefs.js"

export type Ast = ReturnType<typeof parse>
export type TemplateNode = Ast["html"]

type PreprocessorArgs = {
	filename: string
	content: string
}

export type PreprocessingPass = {
	/**
	 * A quick and cheap check to see if this pass should be applied.
	 * This is used to avoid parsing the file if it's not necessary.
	 */
	condition: (data: PreprocessorArgs) => boolean

	/**
	 * Applies the pass to the file.
	 * @param ast 	The AST of the file.
	 * @param code 	The code of the file. Modify this directly.
	 * @returns A list of imports that should be injected into the file.
	 */
	apply: (data: { ast: Ast; code: MagicString; originalCode: string }) => {
		imports: string[]
	}
}

const PASSES: PreprocessingPass[] = [InjectHeader, RewriteHrefs]

export function preprocess() {
	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		markup: ({ filename, content }: { content: string; filename: string }) => {
			//dont' process built in Svelte files
			if (filename.includes(".svelte-kit")) {
				return { code: content }
			}

			const passMask = PASSES.map((pass) => pass.condition({ filename, content }))
			const shouldProcess = passMask.some((value) => value)

			if (!shouldProcess) {
				return { code: content }
			}

			const code = new MagicString(content)
			const ast = parse(content)

			const imports: string[] = []
			for (let i = 0; i < passMask.length; i++) {
				if (!passMask[i]) continue
				const pass = PASSES[i]!
				const { imports: passImports } = pass.apply({ ast, code, originalCode: content })
				imports.push(...passImports)
			}

			injectImports(ast, code, imports)

			const map = code.generateMap({ hires: true })
			return { code: code.toString(), map }
		},
	}
}

function injectImports(ast: Ast, code: MagicString, importStatements: string[]) {
	if (!ast.instance) {
		code.prepend("<script>\n" + importStatements.join("\n") + "\n</script>\n")
	} else {
		//@ts-ignore
		const scriptStart = ast.instance.content.start as number
		code.appendLeft(scriptStart, "\n" + importStatements.join("\n") + "\n")
	}
}
