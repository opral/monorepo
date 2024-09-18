/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Command } from "commander"
import { rpc } from "@inlang/rpc"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log, logError } from "../../utilities/log.js"
import { selectBundleNested, type InlangProject } from "@inlang/sdk2"
import prompts from "prompts"
import { projectOption } from "../../utilities/globalFlags.js"
import progessBar from "cli-progress"

export const translate = new Command()
	.command("translate")
	.requiredOption(projectOption.flags, projectOption.description)
	.option("-f, --force", "Force machine translation and skip the confirmation prompt.", false)
	.option("-q, --quiet", "don't log every tranlation.", false)
	.option("--locale <source>", "Locales for translation.")
	.option("--targetLocales <targets...>", "Comma separated list of target locales for translation.")
	.option("-n, --nobar", "disable progress bar", false)
	.description("Machine translate bundles.")
	.action(async (args: { force: boolean; project: string }) => {
		try {
			// Prompt the user to confirm
			if (!args.force) {
				log.warn(
					"Human translations are better than machine translations. \n\nWe advise to use machine translations in the build step without commiting them to the repo. By using machine translate in the build step, you avoid missing translations in production while still flagging to human translators that transaltions are missing. You can use the force flag (-f, --force) to skip this prompt warning."
				)
				const response = await prompts({
					type: "confirm",
					name: "value",
					message: "Are you sure you want to machine translate?",
				})
				if (!response.value) {
					log.warn("Aborting machine translation.")
					return
				}
			}

			const project = await getInlangProject({ projectPath: args.project })
			await translateCommandAction({ project })
		} catch (error) {
			logError(error)
		}
	})

export async function translateCommandAction(args: { project: InlangProject }) {
	try {
		const options = translate.opts()
		const settings = await args.project.settings.get()

		const targetLocales: string[] = options.targetLocales
			? options.targetLocales[0]?.split(",")
			: settings.locales

		const bar = options.nobar
			? undefined
			: new progessBar.SingleBar(
					{
						clearOnComplete: true,
						format: `🤖 Machine translating bundles | {bar} | {percentage}% | {value}/{total} Bundles`,
					},
					progessBar.Presets.shades_grey
			  )

		const bundles = await selectBundleNested(args.project.db).selectAll().execute()

		bar?.start(bundles.length, 0)

		const promises: Promise<Awaited<ReturnType<typeof rpc.machineTranslateBundle>>>[] = []
		const errors: string[] = []

		for (const bundle of bundles) {
			promises.push(
				rpc
					.machineTranslateBundle({
						bundle,
						sourceLocale: settings.baseLocale,
						targetLocales: targetLocales,
					})
					.then((result) => {
						bar?.increment()
						if (result.error) {
							errors.push(result.error)
						}
						return result
					})
			)
		}

		await Promise.all(promises)

		log.success("Machine translate complete.")
		if (errors.length > 0) {
			log.warn("Some bundles could not be translated.")
			log.warn(errors.join("\n"))
		}
	} catch (error) {
		logError(error)
	}
}
