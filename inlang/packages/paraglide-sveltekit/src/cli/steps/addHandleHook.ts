import type { Repository } from "@lix-js/client"
import { findFile, type CliStep } from "../utils.js"
import path from "node:path"
import type { Logger } from "@inlang/paraglide-js/cli"

const BOILERPLATE = `// file initialized by the Paraglide-SvelteKit CLI - Feel free to edit it
import { sequence } from "@sveltejs/kit/hooks"
import { i18n } from "${"$"}lib/i18n"

// add your own hooks as part of the sequence here
export const handle = sequence(i18n.handle())
`

export const addHandleHook: CliStep<
	{ repo: Repository; logger: Logger; typescript: boolean },
	unknown
> = async (ctx) => {
	const hooksFilePath = await findFile({
		candidates: ["./src/hooks.server.js", "./src/hooks.server.ts"],
		base: process.cwd(),
		fs: ctx.repo.nodeishFs,
	})

	if (hooksFilePath) {
		// read the file
		const content = await ctx.repo.nodeishFs.readFile(hooksFilePath, { encoding: "utf-8" })

		const result = updateServerHooks(content)
		if (!result.ok) {
			const msg = [
				"Could not automatically add the i18n.handle hook in src/hooks.server.js",
				"REASON: " + result.reason,
				"",
				"Please update it manually",
			].join("\n")
			ctx.logger.warn(msg)
		} else {
			ctx.logger.success("Added handle hook")
			await ctx.repo.nodeishFs.writeFile(hooksFilePath, result.updated)
		}
	} else {
		const hooksFilePath = path.resolve(
			process.cwd(),
			"./src/hooks.server" + (ctx.typescript ? ".ts" : ".js")
		)
		//wrte boilerplate
		await ctx.repo.nodeishFs.writeFile(hooksFilePath, BOILERPLATE)
		ctx.logger.success("Added handle hook")
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

/**
 * Tries to update an existing server hooks file
 * @param code
 */
export function updateServerHooks(code: string): UpdateResult {
	// if it already contains the hook, we don't need to do anything
	if (code.includes("i18n.handle")) {
		return {
			ok: true,
			updated: code,
		}
	}

	// if it does not yet export a handle hook we can just append it
	const exportHandleRegexes = [
		/export\s+const\s+handle\s/g,
		/export\s+function\s+handle\s/g,
		/export\s+async\s+function\s+handle\s/g,
		/export\s+{.*handle.*}/g,
	]

	const importsSequence = code.includes("sequence") && code.includes("@sveltejs/kit/hooks")

	const hasHandle = exportHandleRegexes.some((regex) => regex.test(code))
	if (hasHandle) {
		//fail - we can't do this automatically yet
		return {
			ok: false,
			reason: "Handle hook is already present",
		}
	} else {
		const imports = [
			`import { i18n } from '${"$"}lib/i18n'`,
			importsSequence ? "" : "import { sequence } from '@sveltejs/kit/hooks'",
		]
			.filter(Boolean)
			.join("\n")

		const updatedCode =
			imports + "\n" + code + "\n\n" + "export const handle = sequence(i18n.handle())"

		return {
			ok: true,
			updated: updatedCode,
		}
	}
}
