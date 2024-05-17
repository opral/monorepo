import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import type { Logger } from "@inlang/paraglide-js/internal"
import path from "node:path"

export const editAppHtmlFile: CliStep<{ repo: Repository; logger: Logger }, unknown> = async (
	ctx
) => {
	try {
		const appHtmlPath = path.resolve(process.cwd(), "./src/app.html")
		const content = await ctx.repo.nodeishFs.readFile(appHtmlPath, { encoding: "utf-8" })

		const newContent = content.replace(
			'lang="en"',
			'lang="%paraglide.lang%" dir="%paraglide.textDirection%"'
		)

		await ctx.repo.nodeishFs.writeFile(appHtmlPath, newContent)
		ctx.logger.success("Updated app.html so the lang attribute is always set correctly")
	} catch (e) {
		ctx.logger.error("Failed to update app.html")
	}
	return ctx
}
