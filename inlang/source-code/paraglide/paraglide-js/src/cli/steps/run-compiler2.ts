import { selectBundleNested, type InlangProject } from "@inlang/sdk2"
import type { CliStep } from "../utils.js"
import path from "node:path"
import { compile } from "~/compilerV2/compile.js"
import { writeOutput } from "~/services/file-handling/write-output.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export const runCompiler: CliStep<
	{
		project: InlangProject
		outdir: string
		fs: NodeishFilesystem
	},
	unknown
> = async (ctx) => {
	const absoluteOutdir = path.resolve(process.cwd(), ctx.outdir)
	const bundles = await selectBundleNested(ctx.project.db).execute()

	const output = await compile({
		bundles: bundles,
		settings: await ctx.project.settings.get(),
		projectId: undefined,
		outputStructure: "message-modules",
	})

	await writeOutput(absoluteOutdir, output, ctx.fs)
	return ctx
}
