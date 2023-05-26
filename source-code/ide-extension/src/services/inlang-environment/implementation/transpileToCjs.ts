import ts from "typescript"

/**
 * Transpiles ESM code to CJS code.
 */
export function transpileToCjs(code: string): string {
	const compilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2020,
		strict: true,
	} satisfies ts.CompilerOptions

	const result = ts.transpileModule(code, { compilerOptions })
	return result.outputText
}
