const { withParaglide } = require("@inlang/paraglide-js-adapter-next/plugin")

/** @type {import('next').NextConfig} */
const config = {
	i18n: {
		locales: ["en", "de"],
		defaultLocale: "en",
	},
}

module.exports = withParaglide(
	{
		outdir: "./src/paraglide",
		project: "./project.inlang",
	},
	config
)
