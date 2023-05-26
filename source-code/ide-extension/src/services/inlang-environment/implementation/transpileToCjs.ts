import ts from "typescript"

export function transpileToCjs(code: string): string {
	const compilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2020,
		strict: true,
	} satisfies ts.CompilerOptions

	const result = ts.transpileModule(code, { compilerOptions })
	return result.outputText
}
