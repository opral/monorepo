import {
	createProgram,
	createCompilerHost,
	type CompilerOptions,
} from "typescript";
import type { CompiledBundleWithMessages } from "./compileBundle.js";

/**
 * @param inputFiles The files in the `outdir`
 * @returns .d.ts files for each file in the `outdir`
 */
export function emitDts(
	compiledBundles: CompiledBundleWithMessages[],
	compiledRuntime: string,
	compiledRegistry: string
): Record<string, string> {
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
	const outputFiles: Record<string, string> = {};
	const host = createCompilerHost(compilerOptions);

	const inputFiles: Record<string, string> = {
		"messages.js": compiledBundles
			.map((compiled) => compiled.bundle.code)
			.join("\n"),
		"registry.js": compiledRegistry,
		"runtime.js": compiledRuntime,
	};

	// A list of input paths for the compiler
	const inputs = Object.keys(inputFiles);

	// intercept read/write methods of the compiler
	host.writeFile = (path, contents) => (outputFiles[path] = contents);
	host.readFile = (path) => inputFiles[path];

	// run the TS compiler
	// this will cause `host.writeFile` to be called
	// our output files are in `outputFiles` after this
	const program = createProgram(inputs, compilerOptions, host);
	program.emit();

	const output: Record<string, string> = {};
	for (const [path, content] of Object.entries(outputFiles)) {
		output[path] = `/* eslint-disable */\n` + content;
	}

	return output;
}

/**
 * TypeScript compiler options
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
};
