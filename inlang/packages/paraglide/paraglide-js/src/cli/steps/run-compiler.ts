import { type InlangProject } from "@inlang/sdk";
import type { CliStep } from "../utils.js";
import path from "node:path";
import { writeOutput } from "../../services/file-handling/write-output.js";
import fs from "node:fs";
import { compileProject } from "../../compiler/compile-project.js";

export const runCompiler: CliStep<
	{
		project: InlangProject;
		outdir: string;
		fs: typeof fs.promises;
	},
	unknown
> = async (ctx) => {
	const absoluteOutdir = path.resolve(process.cwd(), ctx.outdir);

	const output = await compileProject({
		project: ctx.project,
	});

	await writeOutput(absoluteOutdir, output, ctx.fs);
	return { ...ctx };
};
