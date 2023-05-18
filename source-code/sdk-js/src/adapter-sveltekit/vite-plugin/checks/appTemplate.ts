import { readFile, writeFile } from 'node:fs/promises';
import type { TransformConfig } from '../config.js';

const REGEX_LANG_ATTRIBUTE = /<html[^>]*(\slang=".*")[^>]*>/

export const assertAppTemplateIsCorrect = async ({ svelteKit, cwdFolderPath }: TransformConfig) => {
	const appTemplatePath = svelteKit.files.appTemplate
	const template = await readFile(appTemplatePath, { encoding: 'utf-8' })

	const execArray = REGEX_LANG_ATTRIBUTE.exec(template)
	if (!execArray) return

	const htmlTag = execArray[0] as string
	const langAttribute = execArray[1] as string
	const index = execArray.index

	const newTemplate = template.slice(0, index)
		+ htmlTag.replace(langAttribute, '')
		+ template.slice(index + htmlTag.length)

	console.info(`Updating '${appTemplatePath.replace(cwdFolderPath, '')}' to remove the 'lang' attribute from the <html> tag.`)

	await writeFile(appTemplatePath, newTemplate, { encoding: 'utf-8' })
}