import { safeState } from "../state.js"
import { getSetting } from "../settings/index.js"
import { logger } from "../logger.js"

export async function getPreviewLocale() {
	const activeProject = safeState()?.project
	if (!activeProject) {
		logger.warn("getPreviewLocale called without an active project")
		return ""
	}
	const settings = await activeProject.settings.get()
	const baseLocale = settings.baseLocale
	const previewLanguageTag = ((await getSetting("previewLanguageTag")) as string) || baseLocale

	const isPreviewLangAvailable = settings.locales.includes(previewLanguageTag)
	return isPreviewLangAvailable ? previewLanguageTag : baseLocale
}
