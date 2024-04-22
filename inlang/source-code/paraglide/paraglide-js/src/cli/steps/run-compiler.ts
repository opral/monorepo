import type { InlangProject } from "@inlang/sdk"
import type { CliStep } from "../utils.js"
import path from "node:path"
import { compile } from "~/compiler/compile.js"
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

	const output = await compile({
		messages: ctx.project.query.messages.getAll(),
		settings: ctx.project.settings(),
		projectId: ctx.project.id,
	})

	await writeOutput(absoluteOutdir, output, ctx.repo.nodeishFs)
	return ctx
}
