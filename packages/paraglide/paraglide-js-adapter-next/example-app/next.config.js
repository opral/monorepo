const { withParaglide } = require("@inlang/paraglide-js-adapter-next/plugin")

/** @type {import('next').NextConfig} */
module.exports = withParaglide(
	{
		project: "./project.inlang",
		outdir: "./src/paraglide",
	},
	{}
)
