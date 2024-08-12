import { selectBundleNested, type InlangProject } from "@inlang/sdk2"
import type { CliStep } from "../utils.js"
import path from "node:path"
import { compile } from "~/compilerV2/compile.js"
import { writeOutput } from "~/services/file-handling/write-output.js"
import type { Repository } from "@lix-js/client"

export const runCompiler: CliStep<
	{
		project: InlangProject
		outdir: string
		repo: Repository
	},
	unknown
> = async (ctx) => {
	const absoluteOutdir = path.resolve(process.cwd(), ctx.outdir)
	const bundles = await selectBundleNested(ctx.project.db).execute()

	const output = await compile({
		bundles: bundles,
		settings: ctx.project.settings.get(),
		projectId: undefined,
	})

	await writeOutput(absoluteOutdir, output, ctx.repo.nodeishFs)
	return ctx
}
