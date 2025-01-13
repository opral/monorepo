import { loadProjectFromDirectory } from "@inlang/sdk";
import path from "node:path";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import {
	compileProject,
	type ParaglideCompilerOptions,
} from "./compileProject.js";
import { writeOutput } from "../services/file-handling/write-output.js";
import {
	getLocalAccount,
	saveLocalAccount,
} from "../services/account/index.js";

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
export async function compile(args: {
	project: string;
	outdir: string;
	fs?: typeof import("node:fs");
	options?: ParaglideCompilerOptions;
}): Promise<void> {
	const fs = args.fs ?? (await import("node:fs"));
	const absoluteOutdir = path.resolve(process.cwd(), args.outdir);

	const localAccount = getLocalAccount({ fs });

	const project = await loadProjectFromDirectory({
		path: args.project,
		fs,
		account: localAccount,
		appId: ENV_VARIABLES.PARJS_APP_ID,
	});

	const output = await compileProject({
		project,
		options: args.options,
	});

	await writeOutput(absoluteOutdir, output, fs.promises);

	if (!localAccount) {
		const activeAccount = await project.lix.db
			.selectFrom("active_account")
			.selectAll()
			.executeTakeFirstOrThrow();

		saveLocalAccount({ fs, account: activeAccount });
	}

	await project.close();
}
