import { availableLanguageTags, sourceLanguageTag } from "./src/paraglide/runtime.js"
import { withParaglide } from "@inlang/paraglide-js-adapter-next/plugin"

/** @type {import('next').NextConfig} */
const config = {
	i18n: {
		locales: [...availableLanguageTags],
		defaultLocale: sourceLanguageTag,
	},
}

export default withParaglide(
	{
		outdir: "./src/paraglide",
		project: "./project.inlang",
	},
	config
)