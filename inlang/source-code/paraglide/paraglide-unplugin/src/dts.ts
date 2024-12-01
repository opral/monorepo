import { createProgram, createCompilerHost, type CompilerOptions } from "typescript"

/**
 * Compiler options for paraglide JS
 */
const compilerOptions: CompilerOptions = {
	allowJs: true,
	checkJs: true,
	declaration: true,
	declarationDir: undefined,
	declarationMap: false,
	emitDeclarationOnly: true,
	lib: undefined,
	noEmit: false,
	noEmitOnError: false,
	skipLibCheck: true,
}

/**
 * @param inputFiles
 * @param virtualModuleNamespace The prefix used for the virtual module namespace. Eg: `$paralgide`
 * @returns A .d.ts file that uses `declare module` declarations to type the given input files
 */
export function generateDTS(
	inputFiles: Record<string, string>,
	virtualModuleNamespace: string
): string {
	/**
	 * Stores files that were emitted as `.d.ts` files during the output.
	 * @example
	 * ```js
	 * {
	 *      "paraglide/runtime.d.ts": "export type AvailableLanguageTag = ...",
	 *      "paragildes/messages.d.ts": "...",
	 * }
	 * ```
	 */
	const outputFiles: Record<string, string> = {}
	const host = createCompilerHost(compilerOptions)

	// intercept read/write methods of the compiler
	host.writeFile = (path, contents) => (outputFiles[path] = contents)
	host.readFile = (path) => inputFiles[path]

	// A list of input paths for the compiler
	const inputs = Object.keys(inputFiles).filter(
		(file) => file.endsWith(".js") || (file.endsWith(".ts") && !file.endsWith(".d.ts")) // to be sure
	)

	// run the TS compiler
	// this will cause `host.writeFile` to be called
	// our output files are in `outputFiles` after this
	const program = createProgram(inputs, compilerOptions, host)
	program.emit()

	return createDeclarationFile(inputs, virtualModuleNamespace, outputFiles)
}

/**
 * Takes the output of the TS compiler and bundles all the
 * declarations into a single declaration file for the virtual modules
 */
function createDeclarationFile(
	inputs: string[],
	virtualModuleNamespace: string,
	outputFiles: Record<string, string>
) {
	const declarations: string[] = []

	for (const input of inputs) {
		const declarationPath = input.replace(/.ts$/, ".d.ts").replace(/.js$/, ".d.ts")
		const declaration = outputFiles[declarationPath]
		if (!declaration) continue

		declarations.push(createDeclaration(`${virtualModuleNamespace}/${input}`, declaration))
	}

	return declarations.join("\n\n")
}

/**
 * Creates a declaration statement for a module & it's types
 * @param moduleName
 * @param dts
 * @returns
 */
function createDeclaration(moduleName: string, dts: string) {
	return `declare module "${moduleName}" {${dts}}`
}
