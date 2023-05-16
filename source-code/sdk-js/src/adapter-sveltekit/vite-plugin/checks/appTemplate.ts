import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { TransformConfig } from '../config.js';

const REGEX_LANG_ATTRIBUTE = /<html[^>]*(\slang=".*")[^>]*>/

export const assertAppTemplateIsCorrect = async (config: TransformConfig) => {
	const appTemplate = config.svelteKit.svelteConfig.kit?.files?.appTemplate || 'src/app.html'
	const appTemplatePath = path.resolve(config.cwdFolderPath, appTemplate)

	const template = await readFile(appTemplatePath, { encoding: 'utf-8' })

	const execArray = REGEX_LANG_ATTRIBUTE.exec(template)
	if (!execArray) return

	const htmlTag = execArray[0] as string
	const langAttribute = execArray[1] as string
	const index = execArray.index

	const newTemplate = template.slice(0, index)
		+ htmlTag.replace(langAttribute, '')
		+ template.slice(index + htmlTag.length)

	console.info(`Updating '${appTemplate}' to remove the 'lang' attribute from the <html> tag.`)

	await writeFile(appTemplatePath, newTemplate, { encoding: 'utf-8' })
}