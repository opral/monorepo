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

		const result = updateAppHTMLFile(content)
		if (result.ok) {
			await ctx.repo.nodeishFs.writeFile(appHtmlPath, result.updated)
			ctx.logger.success("Updated app.html so the lang attribute is always set correctly")
		} else {
			const msg = [
				"Could not automatically update src/app.html",
				"REASON: " + result.reason,
				"",
				"Please update it manually",
			].join("\n")
			ctx.logger.warn(msg)
		}

		return ctx
	} catch (e) {
		ctx.logger.error("Failed to update app.html")
	}
	return ctx
}

type UpdateResult =
	| {
			ok: true
			updated: string
			reason?: undefined
	  }
	| {
			ok: false
			reason: string
			updated?: undefined
	  }

export function updateAppHTMLFile(html: string): UpdateResult {
	const langAttributeRegex = /lang=["']?[a-zA-Z-0-9]+["']?/g
	const langAttributeMatch = langAttributeRegex.exec(html)

	if (!langAttributeMatch) {
		return {
			ok: false,
			reason: "Could not find an existing lang attribute",
		}
	}

	html = html.replace(langAttributeMatch[0], 'lang="%paraglide.lang%"')

	const dirAttributeRegex = /dir=["']?[a-zA-Z]+["']?/g
	const dirAttributeMatch = dirAttributeRegex.exec(html)

	if (!dirAttributeMatch) {
		// add it after the lang attribute
		html = html.replace(
			'lang="%paraglide.lang%"',
			'lang="%paraglide.lang%" dir="%paraglide.textDirection%"'
		)
	} else {
		html = html.replace(dirAttributeMatch[0], 'dir="%paraglide.textDirection%"')
	}

	return {
		ok: true,
		reason: undefined,
		updated: html,
	}
}
