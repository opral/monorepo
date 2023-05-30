import { readFile, writeFile } from "node:fs/promises"
import type { TransformConfig } from "../config.js"

export const assertAppTemplateIsCorrect = async ({ svelteKit, cwdFolderPath }: TransformConfig) => {
	const appTemplatePath = svelteKit.files.appTemplate
	const markup = await readFile(appTemplatePath, { encoding: "utf-8" })

	const updatedMarkup = removeHtmlLangAttribute(markup)
	if (!updatedMarkup) return

	console.info(
		`Updating '${appTemplatePath.replace(
			cwdFolderPath,
			"",
		)}' to remove the 'lang' attribute from the <html> tag.`,
	)

	await writeFile(appTemplatePath, updatedMarkup, { encoding: "utf-8" })
}

const REGEX_LANG_ATTRIBUTE = /<html[^>]*(\slang="[^"]*")[^>]*>/

export const removeHtmlLangAttribute = (markup: string) => {
	const execArray = REGEX_LANG_ATTRIBUTE.exec(markup)
	if (!execArray) return

	const htmlTag = execArray[0] as string
	const langAttribute = execArray[1] as string
	const index = execArray.index

	return markup.slice(0, index) +
		htmlTag.replace(langAttribute, "") +
		markup.slice(index + htmlTag.length)
}