import { availableLanguageTags, sourceLanguageTag } from "./src/paraglide/runtime.js"

/** @type {import('next').NextConfig} */
export default {
	reactStrictMode: true,
	i18n: {
		locales: [...availableLanguageTags],
		defaultLocale: sourceLanguageTag,
	},
}
