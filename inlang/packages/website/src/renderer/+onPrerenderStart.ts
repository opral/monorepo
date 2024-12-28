import {
	sourceLanguageTag,
	availableLanguageTags,
} from "#src/paraglide/runtime.js";

export default function onPrerenderStart(prerenderContext: any) {
	const pageContexts = [];
	for (const pageContext of prerenderContext.pageContexts) {
		// Duplicate pageContext for each locale
		for (const locale of availableLanguageTags) {
			// Localize URL
			let { urlOriginal } = pageContext;
			if (locale !== sourceLanguageTag) {
				urlOriginal = `/${locale}${pageContext.urlOriginal}`;
			}
			pageContexts.push({
				...pageContext,
				urlOriginal,
				// Set pageContext.locale
				languageTag: locale,
			});
		}
	}
	return {
		prerenderContext: {
			pageContexts,
		},
	};
}
