import { loadProjectFromDirectory } from "@inlang/sdk";
import path from "node:path";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { compileProject } from "./compile-project.js";
import { writeOutput } from "../services/file-handling/write-output.js";
// import {
// 	getLocalAccount,
// 	saveLocalAccount,
// } from "../services/account/index.js";
import {
	defaultCompilerOptions,
	type CompilerOptions,
} from "./compiler-options.js";
import { Logger } from "../services/logger/index.js";

// This is a workaround to prevent multiple compilations from running at the same time.
// https://github.com/opral/inlang-paraglide-js/issues/320#issuecomment-2596951222
let compilationInProgress: Promise<{
	outputHashes: Record<string, string> | undefined;
}> | null = null;

export type CompilationResult = {
	outputHashes: Record<string, string> | undefined;
};

const logger = new Logger();

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
	options: CompilerOptions & {
		previousCompilation?: CompilationResult;
	}
): Promise<CompilationResult> {
	const withDefaultOptions = {
		...defaultCompilerOptions,
		...options,
	};

	if (compilationInProgress) {
		await compilationInProgress;
	}

	compilationInProgress = (async () => {
		try {
	                const fs = withDefaultOptions.fs ?? (await import("node:fs"));
	                const absoluteOutdir = path.resolve(
	                        process.cwd(),
	                        withDefaultOptions.outdir
	                );
	                const cwd = path.resolve(process.cwd());

	                // Regression test: https://github.com/opral/inlang-sdk/issues/245
	                // Cleaning the project root deletes user source files. Guard against it early.
	                if (absoluteOutdir === cwd) {
	                        throw new Error(
	                                "`outdir` cannot be set to './'. Cleaning the project root would delete your source files. See https://github.com/opral/inlang-sdk/issues/245 for details."
	                        );
	                }

			// const localAccount = getLocalAccount({ fs });

			const project = await loadProjectFromDirectory({
				path: withDefaultOptions.project,
				fs,
				// account: localAccount,
				appId: ENV_VARIABLES.PARJS_APP_ID,
			});

			const output = await compileProject({
				compilerOptions: withDefaultOptions,
				project,
			});

			const outputHashes = await writeOutput({
				directory: absoluteOutdir,
				output,
				cleanDirectory: withDefaultOptions.cleanOutdir,
				fs: fs.promises,
				previousOutputHashes: options.previousCompilation?.outputHashes,
			});

			// if (!localAccount) {
			// 	const activeAccount = await project.lix.db
			// 		.selectFrom("active_account as aa")
			// 		.innerJoin("account_all as a", "a.id", "aa.account_id")
			// 		.where("a.lixcol_version_id", "=", "global")
			// 		.select(["a.id", "a.name"])
			// 		.executeTakeFirstOrThrow();

			// 	saveLocalAccount({ fs, account: activeAccount });
			// }

			const warningsAndErrors = await project.errors.get();

			for (const warningOrError of warningsAndErrors) {
				logger.warn(warningOrError);
			}

			await project.close();

			return { outputHashes };
		} catch (e) {
			// release the lock in case of an error
			compilationInProgress = null;
			throw e;
		}
	})();

	const result = structuredClone(await compilationInProgress);
	compilationInProgress = null;

	return result;
}
