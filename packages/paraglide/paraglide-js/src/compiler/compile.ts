import { loadProjectFromDirectory } from "@inlang/sdk";
import path from "node:path";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { compileProject } from "./compile-project.js";
import { writeOutput } from "../services/file-handling/write-output.js";
import {
	getLocalAccount,
	saveLocalAccount,
} from "../services/account/index.js";
import type { Runtime } from "./runtime/type.js";

export const defaultCompilerOptions = {
	outputStructure: "message-modules",
	emitGitIgnore: true,
	includeEslintDisableComment: true,
	emitPrettierIgnore: true,
	strategy: ["cookie", "variable", "baseLocale"],
	cookieName: "PARAGLIDE_LOCALE",
} as const satisfies Partial<CompilerOptions>;

export type CompilerOptions = {
	/**
	 * The path to the project to compile.
	 *
	 * @example
	 *   './project.inlang'
	 */
	project: string;
	/**
	 * The path to the directory to write the output to.
	 *
	 * @example
	 *   './src/paraglide'
	 */
	outdir: string;
	/**
	 * The strategy to use for getting the locale.
	 *
	 * The order of the strategy defines the precendence of matches.
	 *
	 * For example, in `['pathname', 'cookie', 'baseLocale']`, the locale will be
	 * first tried to be detected in the pathname, then in a cookie, and finally
	 * fallback to the base locale.
	 *
	 * The default ensures that the browser takes a cookie approach,
	 * server-side takes the variable (because cookie is unvailable),
	 * whereas both fallback to the base locale if not available.
	 *
	 * @default ["cookie", "variable", "baseLocale"]
	 */
	strategy?: Runtime["strategy"];
	/**
	 * The name of the cookie to use for the cookie strategy.
	 *
	 * @default 'PARAGLIDE_LOCALE'
	 */
	cookieName?: string;
	/**
	 * Additional files that should be emmited in the outdir.
	 *
	 * @example
	 *   additionalFiles: {
	 *     "custom-file.js": "console.log('Hello, world!')"
	 *   }
	 */
	additionalFiles?: Record<string, string>;
	/**
	 * Whether to emit a .prettierignore file.
	 *
	 * @default true
	 */
	emitPrettierIgnore?: boolean;
	/**
	 * Whether to include an eslint-disable comment at the top of each .js file.
	 *
	 * @default true
	 */
	includeEslintDisableComment?: boolean;
	/**
	 * Whether to emit a .gitignore file.
	 *
	 * @default true
	 */
	emitGitIgnore?: boolean;
	/**
	 * The file-structure of the compiled output.
	 *
	 * @default "message-modules"
	 */
	outputStructure?: "locale-modules" | "message-modules";
	/**
	 * The file system to use. Defaults to `await import('node:fs')`.
	 *
	 * Useful for testing the paraglide compiler by mocking the fs.
	 */
	fs?: typeof import("node:fs");
};

// This is a workaround to prevent multiple compilations from running at the same time.
// https://github.com/opral/inlang-paraglide-js/issues/320#issuecomment-2596951222
let compilationInProgress: Promise<{
	outputHashes: Record<string, string> | undefined;
}> | null = null;

/**
 * Loads, compiles, and writes the output to disk.
 *
 * This is the main function to use when you want to compile a project.
 * If you want to adjust inlang project loading, or the output, use
 * `compileProject()` instead.
 *
 * @example
 *   await compile({
 *     project: 'path/to/project',
 *     outdir: 'path/to/output',
 *   })
 */
export async function compile(
	options: CompilerOptions,
	previousOutputHashes?: Record<string, string>
): Promise<{ outputHashes: Record<string, string> | undefined }> {
	const withDefaultOptions = {
		...defaultCompilerOptions,
		...options,
	};

	if (compilationInProgress) {
		await compilationInProgress;
	}

	compilationInProgress = (async () => {
		const fs = withDefaultOptions.fs ?? (await import("node:fs"));
		const absoluteOutdir = path.resolve(
			process.cwd(),
			withDefaultOptions.outdir
		);

		const localAccount = getLocalAccount({ fs });

		const project = await loadProjectFromDirectory({
			path: withDefaultOptions.project,
			fs,
			account: localAccount,
			appId: ENV_VARIABLES.PARJS_APP_ID,
		});

		const output = await compileProject({
			compilerOptions: withDefaultOptions,
			project,
		});

		const outputHashes = await writeOutput({
			directory: absoluteOutdir,
			output,
			fs: fs.promises,
			previousOutputHashes,
		});

		if (!localAccount) {
			const activeAccount = await project.lix.db
				.selectFrom("active_account")
				.selectAll()
				.executeTakeFirstOrThrow();

			saveLocalAccount({ fs, account: activeAccount });
		}

		await project.close();

		return { outputHashes };
	})();

	const result = structuredClone(await compilationInProgress);
	compilationInProgress = null;

	return result;
}
