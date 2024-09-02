import { state } from "../state.js"
import { getSetting } from "../settings/index.js"

export async function getPreviewLocale() {
	const settings = await state().project.settings.get()
	const baseLocale = settings.baseLocale
	const previewLanguageTag = ((await getSetting("previewLanguageTag")) as string) || baseLocale

	const isPreviewLangAvailable = settings.locales.includes(previewLanguageTag)
	return isPreviewLangAvailable ? previewLanguageTag : baseLocale
}
