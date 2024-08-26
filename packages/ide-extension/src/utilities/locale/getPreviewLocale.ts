import { state } from "../state.js"
import { getSetting } from "../settings/index.js"

export async function getPreviewLanguageTag() {
	const baseLocale = state().project.settings.get()?.baseLocale
	const previewLanguageTag = ((await getSetting("previewLanguageTag")) as string) || baseLocale

	const isPreviewLangAvailable = state().project.settings.get().locales.includes(previewLanguageTag)
	return isPreviewLangAvailable ? previewLanguageTag : baseLocale
}
