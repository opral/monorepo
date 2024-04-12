import { state } from "../state.js"
import { getSetting } from "../settings/index.js"

export async function getPreviewLanguageTag() {
	const sourceLanguageTag = state().project.settings()?.sourceLanguageTag
	const previewLanguageTag =
		((await getSetting("previewLanguageTag")) as string) || sourceLanguageTag

	const isPreviewLangAvailable = state()
		.project.settings()
		.languageTags.includes(previewLanguageTag)
	return isPreviewLangAvailable ? previewLanguageTag : sourceLanguageTag
}
