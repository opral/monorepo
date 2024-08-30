import type { Logger } from "~/services/logger/index.js"
import type { CliStep } from "../utils.js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import type { NodeishFilesystem } from "~/services/file-handling/types.js"

export function updatePackageJson(opt: {
	dependencies?: (deps: Record<string, string>) => Promise<Record<string, string>>
	devDependencies?: (devDeps: Record<string, string>) => Promise<Record<string, string>>
	scripts?: (scripts: Record<string, string>) => Promise<Record<string, string>>
}): CliStep<{ packageJsonPath: string; fs: NodeishFilesystem; logger: Logger }, unknown> {
	return async (ctx) => {
		const file = await ctx.fs.readFile(ctx.packageJsonPath, {
			encoding: "utf-8",
		})

		const stringify = detectJsonFormatting(file)

		let pkg
		try {
			pkg = JSON.parse(file)
			if (typeof pkg !== "object" || pkg === null) {
				throw new Error()
			}
		} catch {
			ctx.logger.error(
				`Your ./package.json does not contain valid JSON. Please fix it and try again.`
			)
			process.exit(1)
		}

		try {
			if (opt.dependencies) pkg.dependencies = await opt.dependencies(pkg.dependencies || {})
			if (opt.devDependencies)
				pkg.devDependencies = await opt.devDependencies(pkg.devDependencies || {})
			if (opt.scripts) pkg.scripts = await opt.scripts(pkg.scripts || {})
		} catch (e) {
			return ctx
		}
		await ctx.fs.writeFile("./package.json", stringify(pkg))
		return ctx
	}
}
