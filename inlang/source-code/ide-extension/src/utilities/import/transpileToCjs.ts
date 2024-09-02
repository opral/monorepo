import ts from "typescript"

export function transpileToCjs(code: string): string {
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2020,
	}

	const result = ts.transpileModule(code, { compilerOptions })
	return result.outputText
}
