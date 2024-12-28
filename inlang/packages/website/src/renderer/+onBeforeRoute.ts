import type { PageContext } from "vike/types";
import { i18nRouting } from "#src/services/i18n/routing.js";

export default function onBeforeRoute(
	pageContext: PageContext,
	data?: { projectCount: string }
) {
	const { url: urlWithoutLanguageTag, languageTag } = i18nRouting(
		pageContext.urlOriginal
	);

	// TODO: improve to make it fit /m/@id/@slug
	const url = urlWithoutLanguageTag;
	// if (urlWithoutLanguageTag.charAt(1) === "m" && urlWithoutLanguageTag.length === 11) {
	// 	url = urlWithoutLanguageTag + "/*"
	// }

	return {
		pageContext: {
			languageTag,
			urlOriginal: url,
			data,
		},
	};
}
