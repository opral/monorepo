import { selectBundleNested, type InlangProject } from "@inlang/sdk2"
import type { CliStep } from "../utils.js"
import path from "node:path"
import { compile } from "~/compiler/compile.js"
import { writeOutput } from "~/services/file-handling/write-output.js"
import type { NodeishFilesystem } from "~/services/file-handling/types.js"

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
	const settings = await ctx.project.settings.get()

	const output = await compile({
		bundles,
		settings,
		outputStructure: "regular",
	})

	await writeOutput(absoluteOutdir, output, ctx.fs)
	return ctx
}
